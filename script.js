// ClassSync – a simple notice board saved in your browser (localStorage)

const STORAGE_KEY = "classsync_posts";

// ---------- Grab page elements ----------
const formPanel   = document.getElementById("formPanel");
const toggleBtn   = document.getElementById("toggleFormBtn");
const cancelBtn   = document.getElementById("cancelBtn");
const form        = document.getElementById("postForm");
const searchInput = document.getElementById("search");
const resetBtn    = document.getElementById("resetBtn");

const announcementList = document.getElementById("announcementList");
const testList         = document.getElementById("testList");
const homeworkList     = document.getElementById("homeworkList");

// ---------- Helpers ----------

// Returns a date string like "2026-10-03", N days from today
function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function todayString() {
  return daysFromToday(0);
}

// Turns "2026-10-03" into "Sat, 3 Oct"
function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short"
  });
}

// ---------- Sample data (dates are relative to today) ----------
function getSamplePosts() {
  const now = Date.now();
  return [
    { id: now - 1, title: "Unit test on Fractions", type: "test", subject: "Maths", priority: "high",
      details: "Chapters 4 and 5. Bring your geometry box and a calculator.", date: daysFromToday(3) },
    { id: now - 2, title: "Science lab report", type: "homework", subject: "Science", priority: "medium",
      details: "Write up the plant growth experiment. Include a graph of your results.", date: daysFromToday(2) },
    { id: now - 3, title: "Picture day is Friday", type: "announcement", subject: "General", priority: "low",
      details: "Wear your full school uniform. Hair neatly tied, please.", date: "" },
    { id: now - 4, title: "English essay: My Hero", type: "homework", subject: "English", priority: "high",
      details: "300 words. Hand it in at the start of class.", date: daysFromToday(1) },
    { id: now - 5, title: "History quiz on the Mughal Empire", type: "test", subject: "History", priority: "medium",
      details: "Short quiz covering Akbar, Jahangir and Shah Jahan.", date: daysFromToday(7) },
    { id: now - 6, title: "Revise: Parts of a cell", type: "revision", subject: "Science", priority: "medium",
      details: "Learn the labelled diagram and functions of each part.", date: "" },
    { id: now - 7, title: "Library books due back", type: "announcement", subject: "General", priority: "low",
      details: "Return all borrowed books by next Wednesday to avoid a fine.", date: daysFromToday(5) }
  ];
}

// ---------- Load & save ----------
function loadPosts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.warn("Could not read saved posts", err);
  }
  const samples = getSamplePosts();
  savePosts(samples);
  return samples;
}

function savePosts(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Could not save posts", err);
  }
}

let posts = loadPosts();

// ---------- Build one post card ----------
// We use textContent (not innerHTML) so typed text can never run as code.
function makeCard(post) {
  const li = document.createElement("li");
  li.className = `item ${post.priority}`;

  const head = document.createElement("div");
  head.className = "item-head";

  const title = document.createElement("h3");
  title.textContent = post.title;

  const del = document.createElement("button");
  del.className = "delete";
  del.type = "button";
  del.textContent = "×";
  del.setAttribute("aria-label", `Delete ${post.title}`);
  del.addEventListener("click", () => deletePost(post.id));

  head.append(title, del);

  const details = document.createElement("p");
  details.textContent = post.details;

  const tags = document.createElement("div");
  tags.className = "tags";

  const typeLabels = { announcement: "Announcement", homework: "Homework", test: "Test", revision: "Revision" };
  const priorityLabels = { high: "High", medium: "Medium", low: "Low" };

  const typeTag = document.createElement("span");
  typeTag.className = "tag";
  typeTag.textContent = typeLabels[post.type];

  const subjectTag = document.createElement("span");
  subjectTag.className = "tag";
  subjectTag.textContent = post.subject;

  const priorityTag = document.createElement("span");
  priorityTag.className = `tag ${post.priority}`;
  priorityTag.textContent = `${priorityLabels[post.priority]} priority`;

  tags.append(typeTag, subjectTag, priorityTag);

  if (post.date) {
    const date = document.createElement("span");
    date.className = "date";
    const word = post.type === "test" ? "Test" : "Due";
    date.textContent = `${word}: ${formatDate(post.date)}`;
    tags.append(date);
  }

  li.append(head, details, tags);
  return li;
}

// Fill a list with cards, or show a friendly message if empty
function fillList(listEl, items, emptyMessage) {
  listEl.innerHTML = "";
  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = emptyMessage;
    listEl.append(li);
    return;
  }
  items.forEach(p => listEl.append(makeCard(p)));
}

// ---------- Draw everything ----------
function render() {
  const query = searchInput.value.trim().toLowerCase();
  const today = todayString();

  // Newest first
  const newestFirst = [...posts].sort((a, b) => b.id - a.id);

  // Search checks title, details, subject and type
  const matches = p =>
    `${p.title} ${p.details} ${p.subject} ${p.type}`.toLowerCase().includes(query);

  // Latest announcements: every post that matches the search
  const latest = newestFirst.filter(matches);

  // Upcoming tests: tests today or later, soonest first
  const tests = posts
    .filter(p => p.type === "test" && (!p.date || p.date >= today))
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  // Homework: soonest due date first; no date goes last
  const homework = posts
    .filter(p => p.type === "homework")
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  fillList(announcementList, latest,
    query ? "No posts match your search." : "No posts yet. Tap “+ New post” to add one.");
  fillList(testList, tests, "No upcoming tests. Enjoy the break!");
  fillList(homeworkList, homework, "No homework right now.");

  document.getElementById("statAll").textContent = posts.length;
  document.getElementById("statTests").textContent = tests.length;
  document.getElementById("statHw").textContent = homework.length;
}

// ---------- Actions ----------
function deletePost(id) {
  if (!confirm("Delete this post?")) return;
  posts = posts.filter(p => p.id !== id);
  savePosts(posts);
  render();
}

function setFormOpen(open) {
  formPanel.hidden = !open;
  toggleBtn.setAttribute("aria-expanded", String(open));
  toggleBtn.textContent = open ? "Close" : "+ New post";
  if (open) document.getElementById("title").focus();
}

toggleBtn.addEventListener("click", () => setFormOpen(formPanel.hidden));
cancelBtn.addEventListener("click", () => { form.reset(); setFormOpen(false); });

form.addEventListener("submit", event => {
  event.preventDefault(); // stop the page from reloading

  const newPost = {
    id: Date.now(),
    title: document.getElementById("title").value.trim(),
    details: document.getElementById("details").value.trim(),
    type: document.getElementById("type").value,
    subject: document.getElementById("subject").value.trim(),
    priority: document.getElementById("priority").value,
    date: document.getElementById("date").value
  };

  posts.push(newPost);
  savePosts(posts);
  form.reset();
  document.getElementById("priority").value = "medium";
  setFormOpen(false);
  searchInput.value = "";
  render();
});

searchInput.addEventListener("input", render);

resetBtn.addEventListener("click", () => {
  if (!confirm("Replace all posts with the sample posts?")) return;
  posts = getSamplePosts();
  savePosts(posts);
  render();
});

// ---------- Start ----------
render();
