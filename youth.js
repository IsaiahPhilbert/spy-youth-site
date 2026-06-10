// Supabase connection.
// IMPORTANT: Use the legacy anon public key here, not the short publishable key.
// Supabase connection.
// Uses your project URL without /rest/v1/ at the end.
// Uses the legacy anon public key, not the short publishable key.
const SUPABASE_URL = "https://dgukspnemrudxkfbedpv.supabase.co";

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndWtzcG5lbXJ1ZHhrZmJlZHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NzMyOTIsImV4cCI6MjA5NjE0OTI5Mn0.i5nbIeg9SxfJWzHj_zCY95FS-MAgrs7Yh2nmJbnvebo";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Private signup code.
// Only people who know this code can create an SPY Youth Hub account.
const SIGNUP_INVITE_CODE = "SPY2026";

// Google Form URL where participant sign-up information will also be sent.
// Password is intentionally not sent to this form.
const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdC7YIAJ_S2nviEp4xNdJqhxZZJmBAQW1F3V-fgXGoSDc7F4Q/formResponse";

// Google Form entry IDs for participant sign-up.
const googleFormFields = {
  fullName: "entry.333907920",
  username: "entry.1783636286",
  gender: "entry.383442692",
  dob: "entry.85831508",
  age: "entry.2041118275",
  school: "entry.365257590",
  grade: "entry.1677235606",
  church: "entry.1438116514",
  mobile: "entry.450711014",
  address: "entry.1707016209",
  guardianName: "entry.1542215037",
  guardianRelationship: "entry.1474016922",
  guardianMobile: "entry.166243643",
  mediaConsent: "entry.1204762613",
  conductAgreement: "entry.20952318"
};

// Google Form backup URL for attendance check-ins.
const attendanceFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSd1R7rlbIiezdGi8c8McvwbUJo-tTwpS0Qfmd2gDk8wBaRuAQ/formResponse";

// Google Form entry IDs for attendance backup.
const attendanceFormFields = {
  fullName: "entry.1471288471",
  username: "entry.1342387969",
  role: "entry.1613259231",
  date: "entry.510546678",
  time: "entry.580819541",
  code: "entry.423799869"
};

// Gets the next birthday date for this year or next year.
function getNextBirthday(dob) {
  if (!dob) return null;

  const birthday = new Date(dob);
  if (Number.isNaN(birthday.getTime())) return null;

  const today = new Date();
  const nextBirthday = new Date(
    today.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );

  if (nextBirthday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  return nextBirthday;
}

// Calculates how many days away the next birthday is.
function getDaysUntil(date) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const difference = targetStart - todayStart;
  return Math.round(difference / (1000 * 60 * 60 * 24));
}


// Makes usernames consistent.
function cleanUsername(username) {
  return String(username || "").trim().toLowerCase();
}

// Makes passwords consistent for login.
function cleanPassword(password) {
  return String(password || "").trim();
}

// Converts username into a hidden internal email for Supabase Auth.
// Users still only type username and password.
function usernameToEmail(username) {
  return `${cleanUsername(username)}@spyyouthhub.com`;
}

// Checks if username format is safe for login.
function isValidUsername(username) {
  return /^[a-z0-9_.-]{3,30}$/.test(username);
}

// Safely reads localStorage data for features not yet moved online.
function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

// Sends sign-up information to Google Forms.
// Password is intentionally NOT sent.
function sendSignupToGoogleForm(user) {
  const formData = new FormData();

  formData.append(googleFormFields.fullName, user.fullName);
  formData.append(googleFormFields.username, user.username);
  formData.append(googleFormFields.gender, user.gender);
  formData.append(googleFormFields.dob, user.dob);
  formData.append(googleFormFields.age, String(user.age));
  formData.append(googleFormFields.school, user.school);
  formData.append(googleFormFields.grade, user.grade);
  formData.append(googleFormFields.church, user.church);
  formData.append(googleFormFields.mobile, user.mobile);
  formData.append(googleFormFields.address, user.address);
  formData.append(googleFormFields.guardianName, user.guardian.fullName);
  formData.append(googleFormFields.guardianRelationship, user.guardian.relationship);
  formData.append(googleFormFields.guardianMobile, user.guardian.mobile);
  formData.append(googleFormFields.mediaConsent, user.mediaConsent);
  formData.append(
    googleFormFields.conductAgreement,
    user.conductAgreement
      ? "Yes, I agree to follow the Youth Group's Code of Conduct."
      : ""
  );

  fetch(googleFormUrl, {
    method: "POST",
    mode: "no-cors",
    body: formData
  }).catch(error => {
    console.log("Google Form signup backup failed:", error);
  });
}

// Gets all navigation buttons.
const tabs = document.querySelectorAll(".tab");

// Gets all page sections.
const sections = document.querySelectorAll(".section");

// Gets dashboard number displays.
const attendanceCount = document.getElementById("attendanceCount");
const prayerCount = document.getElementById("prayerCount");
const pointsCount = document.getElementById("pointsCount");

// Gets login/sign up elements.
const authScreen = document.getElementById("authScreen");
const appShell = document.getElementById("appShell");
const showLoginBtn = document.getElementById("showLoginBtn");
const showSignupBtn = document.getElementById("showSignupBtn");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authMessage = document.getElementById("authMessage");

// Gets logged-in user display elements.
const currentUserLabel = document.getElementById("currentUserLabel");
const logoutBtn = document.getElementById("logoutBtn");

// Current logged-in user profile from Supabase.
let currentUser = null;

// Online attendance records from Supabase.
let attendanceRecords = [];

// Online prayer requests from Supabase.
let prayerRequests = [];

// Online announcements from Supabase.
let onlineAnnouncements = [];

// Online events from Supabase.
let onlineEvents = [];

// Online event registrations from Supabase.
let onlineEventRegistrations = [];

// Online Ask the Leaders questions from Supabase.
// These are shared across all devices.
let onlineQuestions = [];

// Online Bible leaderboard from Supabase.
// This makes Bible points shared across all devices.
let onlineBibleLeaderboard = [];

// Online resources from Supabase.
// Leaders add them, everyone can view them.
let onlineResources = [];

// Online member directory from Supabase.
// Leaders can view this to manage the youth group.
let onlineMembers = [];

// Public birthday reminders from Supabase.
// Everyone can see safe birthday info only.
let publicBirthdays = [];

// Daily verses used by the Bible Challenge section.
const dailyVerses = [
  {
    text: "Your word is a lamp to my feet and a light to my path.",
    reference: "Psalm 119:105"
  },
  {
    text: "Let no one despise you for your youth, but set the believers an example.",
    reference: "1 Timothy 4:12"
  },
  {
    text: "I can do all things through him who strengthens me.",
    reference: "Philippians 4:13"
  },
  {
    text: "The Lord is my shepherd; I shall not want.",
    reference: "Psalm 23:1"
  },
  {
    text: "Trust in the Lord with all your heart, and do not lean on your own understanding.",
    reference: "Proverbs 3:5"
  },
  {
    text: "Be strong and courageous. Do not be frightened, and do not be dismayed.",
    reference: "Joshua 1:9"
  },
  {
    text: "For we walk by faith, not by sight.",
    reference: "2 Corinthians 5:7"
  }
];

// Local fallback app data for features not yet fully moved to Supabase.
let state = readStorage("spyYouthHubState", {
  attendance: [],
  prayers: [],
  points: 0,
  announcements: [
    "Welcome to SPY Youth Hub at St. Sebastian Church Madhavaram.",
    "Youth weekly intercessory prayer on WEDNESDAY at 7.30PM.",
    "Bring your Bible and rosary."
  ],
  events: [
    {
      title: "SPY Friday Youth Night",
      date: "2026-06-12",
      description: "Worship, games, Bible study, and fellowship at St. Sebastian Church.",
      registered: []
    }
  ],
  questions: [],
  leaderboard: [
    { name: "Isaiah", points: 120 },
    { name: "Sarah", points: 95 },
    { name: "Daniel", points: 80 }
  ]
});

// Saves local fallback app data.
function saveState() {
  localStorage.setItem("spyYouthHubState", JSON.stringify(state));
}

// Shows login/sign up messages.
function showAuthMessage(message) {
  authMessage.textContent = message;
}

// Shows a fun success popup with confetti instead of boring browser alerts.
function showSuccessToast(title, message) {
  const toast = document.getElementById("successToast");
  const toastTitle = document.getElementById("successToastTitle");
  const toastText = document.getElementById("successToastText");
  const confettiLayer = document.getElementById("confettiLayer");

  const colors = ["#0f8174", "#fde7ad", "#bd4f5f", "#c57a12", "#1f2933"];

  toastTitle.textContent = title;
  toastText.textContent = message;
  confettiLayer.innerHTML = "";

  // Creates small colorful confetti pieces.
  for (let i = 0; i < 45; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.25}s`;
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    confettiLayer.appendChild(piece);
  }

  toast.classList.remove("hidden");

  // Auto-hides the popup after a short celebration.
  setTimeout(() => {
    toast.classList.add("hidden");
    confettiLayer.innerHTML = "";
  }, 1800);
}

// Converts Supabase profile row into the app's currentUser format.
function mapProfile(profile) {
  return {
    id: profile.id,
    fullName: profile.full_name,
    username: profile.username,
    gender: profile.gender,
    dob: profile.dob,
    age: profile.age,
    school: profile.school,
    grade: profile.grade,
    church: profile.church,
    mobile: profile.mobile,
    address: profile.address,
    guardian: {
      fullName: profile.guardian_full_name,
      relationship: profile.guardian_relationship,
      mobile: profile.guardian_mobile
    },
    mediaConsent: profile.media_consent,
    conductAgreement: profile.conduct_agreement,
    role: profile.role || "member"
  };
}

// Loads the logged-in user's profile from Supabase.
async function loadCurrentProfile(userId) {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.log("Profile load error:", error);
    return null;
  }

  return mapProfile(data);
}

// Loads Bible challenge leaderboard from Supabase.
async function loadBibleLeaderboard() {
  const { data, error } = await db
    .from("bible_points")
    .select("*")
    .order("points", { ascending: false })
    .order("updated_at", { ascending: true });

  if (error) {
    console.log("Bible leaderboard load error:", error);
    onlineBibleLeaderboard = [];
    return;
  }

  onlineBibleLeaderboard = data || [];
}

// Loads safe public birthday reminder data.
async function loadPublicBirthdays() {
  const { data, error } = await db
    .from("public_birthdays")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    console.log("Public birthdays load error:", error);
    publicBirthdays = [];
    return;
  }

  publicBirthdays = data || [];
}

// Loads announcements from Supabase.
async function loadAnnouncements() {
  const { data, error } = await db
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Announcements load error:", error);
    onlineAnnouncements = [];
    return;
  }

  onlineAnnouncements = data || [];
}

// Loads events from Supabase.
async function loadEvents() {
  const { data, error } = await db
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.log("Events load error:", error);
    onlineEvents = [];
    return;
  }

  onlineEvents = data || [];
}

// Loads event registrations from Supabase.
async function loadEventRegistrations() {
  const { data, error } = await db
    .from("event_registrations")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.log("Event registrations load error:", error);
    onlineEventRegistrations = [];
    return;
  }

  onlineEventRegistrations = data || [];
}

// Loads attendance records from Supabase.
async function loadAttendanceRecords() {
  const { data, error } = await db
    .from("attendance")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Attendance load error:", error);
    attendanceRecords = [];
    return;
  }

  attendanceRecords = data || [];
}

// Loads prayer requests from Supabase.
async function loadPrayerRequests() {
  const { data, error } = await db
    .from("prayer_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Prayer load error:", error);
    prayerRequests = [];
    return;
  }

  prayerRequests = data || [];
}

// Loads Ask the Leaders questions from Supabase.
async function loadQuestions() {
  const { data, error } = await db
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Questions load error:", error);
    onlineQuestions = [];
    return;
  }

  onlineQuestions = data || [];
}
// Loads resource library links from Supabase.
async function loadResources() {
  const { data, error } = await db
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Resources load error:", error);
    onlineResources = [];
    return;
  }

  onlineResources = data || [];
}


// Loads all online data needed after login.
async function loadOnlineData() {
  await Promise.all([
    loadAttendanceRecords(),
    loadPrayerRequests(),
    loadAnnouncements(),
    loadEvents(),
    loadEventRegistrations(),
    loadQuestions(),
    loadBibleLeaderboard(),
    loadResources(),
    loadMembers(),
    loadPublicBirthdays()
  ]);
}

// Loads all registered members for leaders.
async function loadMembers() {
  if (!currentUser || currentUser.role !== "leader") {
    onlineMembers = [];
    return;
  }

  const { data, error } = await db
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    console.log("Members load error:", error);
    onlineMembers = [];
    return;
  }

  onlineMembers = data || [];
}

// Logs a user into the app after Supabase auth/profile is ready.
async function setCurrentUser(profile) {
  currentUser = profile;

  authScreen.classList.add("hidden");
  appShell.classList.remove("hidden");

  document.body.classList.toggle("leader-mode", currentUser.role === "leader");
  currentUserLabel.textContent =
    currentUser.role === "leader" ? "Leader" : "Youth Member";

  await loadOnlineData();
  renderAll();
}

// Shows one section and hides the others.
function showSection(sectionId) {
  sections.forEach(section => {
    section.classList.toggle("active", section.id === sectionId);
  });

  tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.section === sectionId);
  });
}

// Makes each tab switch sections when clicked.
tabs.forEach(tab => {
  tab.addEventListener("click", () => showSection(tab.dataset.section));
});

// Hides the birthday scroll hint after the user scrolls on the dashboard.
window.addEventListener("scroll", () => {
  const hint = document.getElementById("birthdayScrollHint");

  if (!hint) return;

  if (window.scrollY > 120) {
    hint.classList.add("hidden");
  }
});

// Shows login form.
showLoginBtn.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  showLoginBtn.classList.add("active");
  showSignupBtn.classList.remove("active");
  showAuthMessage("");
});

// Shows sign up form.
showSignupBtn.addEventListener("click", () => {
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  showSignupBtn.classList.add("active");
  showLoginBtn.classList.remove("active");
  showAuthMessage("");
});


// Handles creating a new online account.
signupForm.addEventListener("submit", async event => {
  event.preventDefault();

  const fullName = document.getElementById("signupFullName").value.trim();
  const username = cleanUsername(document.getElementById("signupUsername").value);
  const gender = document.getElementById("signupGender").value;
  const dob = document.getElementById("signupDob").value;
  const ageInput = document.getElementById("signupAge").value.trim();
  const age = Number(ageInput);
  const school = document.getElementById("signupSchool").value.trim();
  const grade = document.getElementById("signupGrade").value.trim();
  const church = document.getElementById("signupChurch").value.trim();

  const mobile = document.getElementById("signupMobile").value.trim();
  const address = document.getElementById("signupAddress").value.trim();

  const guardianName = document.getElementById("guardianName").value.trim();
  const guardianRelationship = document.getElementById("guardianRelationship").value.trim();
  const guardianMobile = document.getElementById("guardianMobile").value.trim();

  const mediaConsentOption = document.querySelector("input[name='mediaConsent']:checked");
  const mediaConsent = mediaConsentOption ? mediaConsentOption.value : "";

  const conductAgreement = document.getElementById("conductAgreement").checked;
  const password = cleanPassword(document.getElementById("signupPassword").value);

  const inviteCode = document.getElementById("signupInviteCode").value.trim();

  if (
    !fullName ||
    !username ||
    !gender ||
    !dob ||
    !ageInput ||
    Number.isNaN(age) ||
    !school ||
    !church ||
    !mobile ||
    !address ||
    !guardianName ||
    !guardianRelationship ||
    !guardianMobile ||
    !mediaConsent ||
    !password ||
    !inviteCode
  ) {
    showAuthMessage("Please fill in every required field.");
    return;
  }

  if (!isValidUsername(username)) {
    showAuthMessage("Username must be 3-30 characters using letters, numbers, dots, dashes, or underscores.");
    return;
  }

  if (age < 0) {
    showAuthMessage("Age cannot be below 0.");
    return;
  }

  if (!conductAgreement) {
    showAuthMessage("You must agree to the Code of Conduct.");
    return;
  }

  // Stops random people from creating accounts unless they know the SPY invite code.
  if (inviteCode !== SIGNUP_INVITE_CODE) {
    showAuthMessage("Invalid SPY invite code.");
    return;
  }

  const email = usernameToEmail(username);

  let authResult;

  try {
    authResult = await db.auth.signUp({
      email,
      password
    });
  } catch (error) {
    showAuthMessage("Could not connect to Supabase. Check your legacy anon key.");
    return;
  }

  if (authResult.error) {
    showAuthMessage(authResult.error.message);
    return;
  }

  if (!authResult.data.user) {
    showAuthMessage("Account could not be created. Check email confirmation settings.");
    return;
  }

  const profileRow = {
    id: authResult.data.user.id,
    full_name: fullName,
    username,
    gender,
    dob,
    age,
    school,
    grade,
    church,
    mobile,
    address,
    guardian_full_name: guardianName,
    guardian_relationship: guardianRelationship,
    guardian_mobile: guardianMobile,
    media_consent: mediaConsent,
    conduct_agreement: conductAgreement,
    role: "member"
  };

  const { error: profileError } = await db
  .from("profiles")
  .insert(profileRow);

if (profileError) {
  showAuthMessage("Account was created, but profile could not be saved: " + profileError.message);
  return;
}

  sendSignupToGoogleForm({
    fullName,
    username,
    gender,
    dob,
    age,
    school,
    grade,
    church,
    mobile,
    address,
    guardian: {
      fullName: guardianName,
      relationship: guardianRelationship,
      mobile: guardianMobile
    },
    mediaConsent,
    conductAgreement
  });

  signupForm.reset();
  showAuthMessage("");

  await setCurrentUser(mapProfile(profileRow));
});

// Handles logging into an existing online account.
loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  const username = cleanUsername(document.getElementById("loginUsername").value);
  const password = cleanPassword(document.getElementById("loginPassword").value);

  if (!username || !password) {
    showAuthMessage("Please enter username and password.");
    return;
  }

  if (!isValidUsername(username)) {
    showAuthMessage("Please enter a valid username.");
    return;
  }

  let loginResult;

  try {
    loginResult = await db.auth.signInWithPassword({
      email: usernameToEmail(username),
      password
    });
  } catch (error) {
    showAuthMessage("Could not connect to Supabase. Check your legacy anon key.");
    return;
  }

  if (loginResult.error) {
    showAuthMessage("Wrong username or password.");
    return;
  }

  const profile = await loadCurrentProfile(loginResult.data.user.id);

  if (!profile) {
    showAuthMessage("Profile not found.");
    return;
  }

  loginForm.reset();
  showAuthMessage("");
  await setCurrentUser(profile);
});

// Handles logging out.
logoutBtn.addEventListener("click", async () => {
  await db.auth.signOut();

  currentUser = null;
  attendanceRecords = [];
  prayerRequests = [];

  appShell.classList.add("hidden");
  authScreen.classList.remove("hidden");
  document.body.classList.remove("leader-mode");
});

// Shows one verse per day.
function renderDailyVerse() {
  const verseText = document.getElementById("dailyVerseText");
  const verseReference = document.getElementById("dailyVerseReference");
  const bibleVerseText = document.getElementById("bibleDailyVerseText");
  const bibleVerseReference = document.getElementById("bibleDailyVerseReference");
  const memoryChallengeText = document.getElementById("memoryChallengeText");

  const verse = getTodaysVerse();

  verseText.textContent = `"${verse.text}"`;
  verseReference.textContent = verse.reference;

  bibleVerseText.textContent = `"${verse.text}"`;
  bibleVerseReference.textContent = verse.reference;

  if (memoryChallengeText) {
    memoryChallengeText.textContent = `Memorize ${verse.reference} today.`;
  }
}

// Updates dashboard content.
function renderDashboard() {
  attendanceCount.textContent = attendanceRecords.length;
  prayerCount.textContent = prayerRequests.length;
  // Shows the logged-in user's online Bible points.
const myBiblePoints = onlineBibleLeaderboard.find(person => {
  return currentUser && person.username === currentUser.username;
});

pointsCount.textContent = myBiblePoints ? myBiblePoints.points : state.points;

  const announcementList = document.getElementById("announcementList");
  announcementList.innerHTML = "";

  const announcementSource =
    onlineAnnouncements.length > 0
      ? onlineAnnouncements.map(item => item.text)
      : state.announcements;

  announcementSource.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    announcementList.appendChild(li);
  });
}

// Gets today's date in YYYY-MM-DD format.
function getTodayKey() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

// Creates the same SPY check-in code for everyone on the same day.
function getTodayCheckInCode() {
  const todayKey = getTodayKey();
  const secret = "SPY-ST-SEBASTIAN";

  let total = 0;
  const text = todayKey + secret;

  for (let i = 0; i < text.length; i++) {
    total += text.charCodeAt(i) * (i + 1);
  }

  const number = String(total % 10000).padStart(4, "0");
  return `SPY-${number}`;
}

// Sends attendance record to Google Forms as backup.
function sendAttendanceToGoogleForm(record) {
  if (!attendanceFormUrl) return;

  const formData = new FormData();

  formData.append(attendanceFormFields.fullName, record.fullName);
  formData.append(attendanceFormFields.username, record.username);
  formData.append(attendanceFormFields.role, record.role);
  formData.append(attendanceFormFields.date, record.displayDate);
  formData.append(attendanceFormFields.time, record.displayTime);
  formData.append(attendanceFormFields.code, record.code);

  fetch(attendanceFormUrl, {
    method: "POST",
    mode: "no-cors",
    body: formData
  }).catch(error => {
    console.log("Google Form attendance backup failed:", error);
  });
}

// Updates attendance section.
function renderAttendance() {
  const attendanceList = document.getElementById("attendanceList");
  const checkInUserText = document.getElementById("checkInUserText");
  const leaderCheckInCode = document.getElementById("leaderCheckInCode");
  const attendanceLeaderboard = document.getElementById("attendanceLeaderboard");

  attendanceList.innerHTML = "";
  attendanceLeaderboard.innerHTML = "";

  if (currentUser) {
    checkInUserText.textContent = `Logged in as ${currentUser.fullName}`;
  } else {
    checkInUserText.textContent = "Log in to check in";
  }

  leaderCheckInCode.textContent = getTodayCheckInCode();

  attendanceRecords.forEach(record => {
    const li = document.createElement("li");
    li.textContent = `${record.full_name} checked in on ${record.display_date} at ${record.display_time}`;
    attendanceList.appendChild(li);
  });

  const totals = {};

  attendanceRecords.forEach(record => {
    if (!totals[record.username]) {
      totals[record.username] = {
        fullName: record.full_name,
        count: 0
      };
    }

    totals[record.username].count += 1;
  });

  const topThree = Object.values(totals)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  if (topThree.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-leaderboard";
    empty.textContent = "No champions yet. First check-in takes the lead.";
    attendanceLeaderboard.appendChild(empty);
    return;
  }

  topThree.forEach((person, index) => {
    const card = document.createElement("article");
    card.className = "podium-card";

    const rankLabels = ["1st", "2nd", "3rd"];

    card.innerHTML = `
      <div class="podium-rank">${rankLabels[index]}</div>
      <div>
        <div class="podium-name">${person.fullName}</div>
        <div class="podium-meta">${index === 0 ? "Current attendance champion" : "Chasing the top spot"}</div>
      </div>
      <div class="podium-score">${person.count}x</div>
    `;

    attendanceLeaderboard.appendChild(card);
  });
}

// Updates prayer request cards.
function renderPrayers() {
  const prayerList = document.getElementById("prayerList");
  prayerList.innerHTML = "";

  prayerRequests.forEach(prayer => {
    const card = document.createElement("article");
    card.className = "request-card";

    card.innerHTML = `
      <strong>${prayer.name}</strong>
      <p>${prayer.text}</p>
      <p class="card-meta">${prayer.date}</p>
      ${prayer.private ? `<span class="private-badge">Private</span>` : ""}
      ${prayer.prayed ? `<span class="prayed-badge">Prayed For</span>` : ""}
    `;

    if (currentUser && currentUser.role === "leader" && !prayer.prayed) {
      const button = document.createElement("button");
      button.textContent = "Mark Prayed For";

      button.addEventListener("click", async () => {
        await db
          .from("prayer_requests")
          .update({ prayed: true })
          .eq("id", prayer.id);

        await loadPrayerRequests();
        renderAll();
      });

      card.appendChild(button);
    }

    prayerList.appendChild(card);
  });

  if (prayerList.innerHTML === "") {
    const empty = document.createElement("div");
    empty.className = "empty-leaderboard";
    empty.textContent = "No prayer requests yet.";
    prayerList.appendChild(empty);
  }
}

// Updates Bible challenge leaderboard.
function renderBible() {
  const leaderboardList = document.getElementById("leaderboardList");
  leaderboardList.innerHTML = "";

  // Uses online Supabase leaderboard first.
  // Falls back to localStorage only if Supabase has no Bible point records yet.
  const leaderboardSource =
    onlineBibleLeaderboard.length > 0
      ? onlineBibleLeaderboard.map(person => ({
          name: person.full_name,
          points: person.points
        }))
      : state.leaderboard;

  const sorted = [...leaderboardSource].sort((a, b) => b.points - a.points);

  sorted.forEach(person => {
    const li = document.createElement("li");
    li.textContent = `${person.name} - ${person.points} points`;
    leaderboardList.appendChild(li);
  });
}

// Updates event cards.
function renderEvents() {
  const eventList = document.getElementById("eventList");
  eventList.innerHTML = "";

  const isLeader = currentUser && currentUser.role === "leader";
  const eventSource = onlineEvents.length > 0 ? onlineEvents : state.events;

  eventSource.forEach((event, index) => {
    const isOnlineEvent = Boolean(event.id);
    const eventId = event.id;

    const registrations = isOnlineEvent
      ? onlineEventRegistrations.filter(registration => registration.event_id === eventId)
      : event.registered.map(name => ({ full_name: name, username: name }));

    const alreadyRegistered =
      isOnlineEvent &&
      currentUser &&
      registrations.some(registration => registration.username === currentUser.username);

    const card = document.createElement("article");
    card.className = "event-card";

    card.innerHTML = `
      <h3>${event.title}</h3>
      <p>${event.description}</p>
      <p class="card-meta">${event.date}</p>
      <p class="card-meta">${registrations.length} registered</p>
    `;

    const registerButton = document.createElement("button");
    registerButton.textContent = alreadyRegistered ? "Registered" : "Register";
    registerButton.disabled = alreadyRegistered;

    registerButton.addEventListener("click", async () => {
      if (!currentUser) {
        alert("Please log in before registering.");
        return;
      }

      if (isOnlineEvent) {
        const { error } = await db
          .from("event_registrations")
          .insert({
            event_id: eventId,
            user_id: currentUser.id,
            full_name: currentUser.fullName,
            username: currentUser.username
          });

        if (error) {
          alert("You are already registered for this event.");
          return;
        }

        await loadEventRegistrations();
        renderAll();
        showSuccessToast("Registered!", "You are signed up for this event.");
        return;
      }

      state.events[index].registered.push(currentUser.fullName);
      saveState();
      renderAll();
      showSuccessToast("Registered!", "You are signed up for this event.");
    });

    card.appendChild(registerButton);

    if (isLeader) {
      const names = document.createElement("p");
      names.className = "card-meta";
      names.textContent = `Participants: ${
        registrations.map(registration => registration.full_name).join(", ") || "None yet"
      }`;
      card.appendChild(names);
    }

    eventList.appendChild(card);
  });
}

// Opens a custom leader answer modal instead of the browser prompt.
// This keeps the popup matching the SPY Youth Hub design.
function openLeaderAnswerModal() {
  return new Promise(resolve => {
    const modal = document.getElementById("answerModal");
    const input = document.getElementById("leaderAnswerInput");
    const saveButton = document.getElementById("saveAnswerBtn");
    const cancelButton = document.getElementById("cancelAnswerBtn");

    input.value = "";
    modal.classList.remove("hidden");
    input.focus();

    // Closes the modal and sends the typed answer back.
    saveButton.onclick = () => {
      const answer = input.value.trim();

      if (!answer) {
        alert("Please type an answer first.");
        return;
      }

      modal.classList.add("hidden");
      resolve(answer);
    };

    // Closes the modal without saving anything.
    cancelButton.onclick = () => {
      modal.classList.add("hidden");
      resolve(null);
    };
  });
}

// Updates Q&A section.
function renderQuestions() {
  const questionList = document.getElementById("questionList");
  const searchValue = document.getElementById("questionSearch").value.toLowerCase();

  const isLeader = currentUser && currentUser.role === "leader";

  questionList.innerHTML = "";

  const questionSource = onlineQuestions.length > 0 ? onlineQuestions : state.questions;

  questionSource
    .filter(item => {
      const questionText = item.question || "";
      const answerText = item.answer || "";

      return (
        questionText.toLowerCase().includes(searchValue) ||
        answerText.toLowerCase().includes(searchValue)
      );
    })
    .forEach((item, index) => {
      const isOnlineQuestion = Boolean(item.id);

      const card = document.createElement("article");
      card.className = "question-card";

      const questionTitle =
        item.show_name && item.full_name
          ? `Question from ${item.full_name}`
          : "Anonymous Question";

      card.innerHTML = `
  <strong>${questionTitle}</strong>
  <p>${item.question}</p>

  ${
    item.answer
      ? `
        <!-- Leader answer shown like a comment/reply -->
        <div class="leader-answer">
          <div class="leader-answer-badge">Leader Response</div>
          <p>${item.answer}</p>
        </div>
      `
      : `<p class="card-meta">Waiting for leader response</p>`
  }
`;

      if (isLeader && !item.answer) {
        const button = document.createElement("button");
        button.textContent = "Answer";

        button.addEventListener("click", async () => {
          const answer = await openLeaderAnswerModal();
          if (!answer) return;

          if (isOnlineQuestion) {
            const { error } = await db
              .from("questions")
              .update({
                answer,
                answered_at: new Date().toISOString()
              })
              .eq("id", item.id);

            if (error) {
              alert("Answer could not be saved.");
              return;
            }

            await loadQuestions();
            renderAll();
            showSuccessToast("Answer Posted!", "The leader response is now visible.");
            return;
          }

          state.questions[index].answer = answer;
          saveState();
          renderAll();
        });

        card.appendChild(button);
      }

      questionList.appendChild(card);
    });

  if (questionList.innerHTML === "") {
    const empty = document.createElement("div");
    empty.className = "empty-leaderboard";
    empty.textContent = "No questions yet.";
    questionList.appendChild(empty);
  }
}

// Updates online resource library.
function renderResources() {
  const resourceList = document.getElementById("resourceList");
  resourceList.innerHTML = "";

  onlineResources.forEach(resource => {
    const card = document.createElement("article");
    card.className = "event-card";

    card.innerHTML = `
      <h3>${resource.title}</h3>
      <p>${resource.description || "No description added."}</p>
      <p class="card-meta">${resource.category}</p>
      <a href="${resource.url}" target="_blank" rel="noopener noreferrer">
        Open Resource
      </a>
    `;

    resourceList.appendChild(card);
  });

  if (resourceList.innerHTML === "") {
    const empty = document.createElement("div");
    empty.className = "empty-leaderboard";
    empty.textContent = "No resources added yet.";
    resourceList.appendChild(empty);
  }
}

// Updates 30-day birthday reminders for leaders.
function renderBirthdays() {
  const birthdayList = document.getElementById("birthdayList");

  if (!birthdayList) return;

  birthdayList.innerHTML = "";

const birthdaySource =
  publicBirthdays.length > 0 ? publicBirthdays : onlineMembers;

const upcomingBirthdays = birthdaySource
    .map(member => {
      const nextBirthday = getNextBirthday(member.dob);

      if (!nextBirthday) return null;

      return {
        fullName: member.full_name,
        username: member.username,
        nextBirthday,
        daysUntil: getDaysUntil(nextBirthday)
      };
    })
    .filter(item => item && item.daysUntil >= 0 && item.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  upcomingBirthdays.forEach(item => {
    const card = document.createElement("article");
    card.className =
  item.daysUntil === 0
    ? "birthday-card birthday-today"
    : "birthday-card";

    const birthdayText =
      item.daysUntil === 0
        ? "Today"
        : `${item.daysUntil} day${item.daysUntil === 1 ? "" : "s"} away`;

    card.innerHTML = `
      <strong>${item.fullName}</strong>
      <p class="card-meta">@${item.username}</p>
      <p class="birthday-countdown">${birthdayText}</p>
      <p class="card-meta">${item.nextBirthday.toLocaleDateString()}</p>
    `;

    birthdayList.appendChild(card);
  });

  if (birthdayList.innerHTML === "") {
    const empty = document.createElement("div");
    empty.className = "empty-leaderboard";
    empty.textContent = "No birthdays in the next 30 days.";
    birthdayList.appendChild(empty);
  }
}

// Updates leader-only member directory.
function renderMembers() {
  const memberList = document.getElementById("memberList");
  const memberSearch = document.getElementById("memberSearch");

  if (!memberList || !memberSearch) return;

  memberList.innerHTML = "";

  if (!currentUser || currentUser.role !== "leader") {
    return;
  }

  const searchValue = memberSearch.value.toLowerCase();

  onlineMembers
    .filter(member => {
      const searchableText = [
        member.full_name,
        member.username,
        member.school,
        member.church,
        member.mobile,
        member.guardian_full_name,
        member.guardian_mobile,
        member.role
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchValue);
    })
    .forEach(member => {
      const card = document.createElement("article");
      card.className = "question-card";

      card.innerHTML = `
        <strong>${member.full_name}</strong>
        <p class="card-meta">@${member.username} • ${member.role}</p>
        <p>Age: ${member.age || "Not added"}</p>
        <p>Gender: ${member.gender || "Not added"}</p>
        <p>School / College / Work: ${member.school || "Not added"}</p>
        <p>Grade / Year: ${member.grade || "Not added"}</p>
        <p>Church / Parish: ${member.church || "Not added"}</p>
        <p>Mobile: ${member.mobile || "Not added"}</p>
        <p>Address: ${member.address || "Not added"}</p>
        <p>Guardian: ${member.guardian_full_name || "Not added"}</p>
        <p>Guardian Relationship: ${member.guardian_relationship || "Not added"}</p>
        <p>Guardian Mobile: ${member.guardian_mobile || "Not added"}</p>
        <p>Media Consent: ${member.media_consent || "Not added"}</p>
      `;

      memberList.appendChild(card);
    });

  if (memberList.innerHTML === "") {
    const empty = document.createElement("div");
    empty.className = "empty-leaderboard";
    empty.textContent = "No members found.";
    memberList.appendChild(empty);
  }
}



// Refreshes the whole app.
function renderAll() {
  renderDashboard();
  renderAttendance();
  renderPrayers();
  renderBible();
  renderDailyVerse();
  renderEvents();
  renderQuestions();
  renderResources();
  renderMembers();
  renderBirthdays();
}

// Bible memory test popup.
let memoryTimerInterval = null;
let memorySecondsLeft = 30;

// Opens the timed Bible memory test.
function openMemoryTest() {
  const modal = document.getElementById("memoryModal");
  const timer = document.getElementById("memoryTimer");
  const reference = document.getElementById("memoryReference");
  const input = document.getElementById("memoryAnswerInput");
  const result = document.getElementById("memoryResult");

  const verse = getTodaysVerse();

  memorySecondsLeft = 30;
  timer.textContent = "30s";
  reference.textContent = verse.reference;
  input.value = "";
  result.textContent = "";

  modal.classList.remove("hidden");
  input.focus();

  document.body.classList.add("memory-testing");

  clearInterval(memoryTimerInterval);

  memoryTimerInterval = setInterval(() => {
    memorySecondsLeft -= 1;
    timer.textContent = `${memorySecondsLeft}s`;

    if (memorySecondsLeft <= 0) {
      clearInterval(memoryTimerInterval);
      result.textContent = "Time is up. Try again after memorizing it.";
      input.disabled = true;
    }
  }, 1000);

  input.disabled = false;
}

// Closes the Bible memory test.
function closeMemoryTest() {
  const modal = document.getElementById("memoryModal");
  const input = document.getElementById("memoryAnswerInput");
  const result = document.getElementById("memoryResult");

  clearInterval(memoryTimerInterval);
  input.disabled = false;
  result.textContent = "";
  modal.classList.add("hidden");
  document.body.classList.remove("memory-testing");
}

// Opens memory test when clicked.
document.getElementById("testMemoryBtn").addEventListener("click", () => {
  if (!currentUser) {
    alert("Please log in before taking the memory test.");
    return;
  }

  openMemoryTest();
});

// Cancels memory test.
document.getElementById("cancelMemoryBtn").addEventListener("click", closeMemoryTest);

// Checks the memory test answer.
document.getElementById("submitMemoryBtn").addEventListener("click", async () => {
  const input = document.getElementById("memoryAnswerInput");
  const result = document.getElementById("memoryResult");
  const verse = getTodaysVerse();

  if (memorySecondsLeft <= 0) {
    result.textContent = "Time is up. Try again.";
    return;
  }

  const answer = cleanMemoryAnswer(input.value);
  const correctAnswer = cleanMemoryAnswer(verse.text);

  if (answer !== correctAnswer) {
    result.textContent = "Not exact yet. Check punctuation, spelling, and every word.";
    return;
  }

  clearInterval(memoryTimerInterval);

  const { data, error } = await db.rpc("complete_bible_challenge", {
    p_full_name: currentUser.fullName,
    p_username: currentUser.username
  });

  if (error) {
    result.textContent = "Correct, but points could not be saved.";
    console.log("Bible memory test error:", error);
    return;
  }

  await loadBibleLeaderboard();
  renderAll();
  closeMemoryTest();

  if (data && data[0] && data[0].already_completed) {
    showSuccessToast("Correct!", "You already earned today's Bible points.");
    return;
  }

  showSuccessToast("Perfect Memory!", "+10 Bible points added.");
});

// Makes the memory test harder to cheat by blocking paste/drop/copy shortcuts in the answer box.
document.getElementById("memoryAnswerInput").addEventListener("paste", event => {
  event.preventDefault();
});

document.getElementById("memoryAnswerInput").addEventListener("drop", event => {
  event.preventDefault();
});

document.getElementById("memoryAnswerInput").addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  const shortcut = event.ctrlKey || event.metaKey;

  if (shortcut && ["v", "c", "x", "a"].includes(key)) {
    event.preventDefault();
  }
});

// Handles attendance check-in.
document.getElementById("checkInBtn").addEventListener("click", async () => {
  const checkInMessage = document.getElementById("checkInMessage");
  const codeInput = document.getElementById("checkInCodeInput");

  if (!currentUser) {
    checkInMessage.textContent = "Please log in before checking in.";
    return;
  }

  const enteredCode = codeInput.value.trim().toUpperCase();
  const correctCode = getTodayCheckInCode();

  if (enteredCode !== correctCode) {
    checkInMessage.textContent = "Incorrect check-in code.";
    return;
  }

  const todayKey = getTodayKey();

  const alreadyCheckedIn = attendanceRecords.some(record => {
    return record.username === currentUser.username && record.date_key === todayKey;
  });

  if (alreadyCheckedIn) {
    checkInMessage.textContent = "You have already checked in today.";
    return;
  }

  const now = new Date();

  const newRecord = {
    user_id: currentUser.id,
    full_name: currentUser.fullName,
    username: currentUser.username,
    role: currentUser.role,
    date_key: todayKey,
    display_date: now.toLocaleDateString(),
    display_time: now.toLocaleTimeString(),
    code: correctCode
  };

  const { error } = await db
    .from("attendance")
    .insert(newRecord);

  if (error) {
    checkInMessage.textContent = "You have already checked in today.";
    return;
  }

  sendAttendanceToGoogleForm({
    fullName: newRecord.full_name,
    username: newRecord.username,
    role: newRecord.role,
    displayDate: newRecord.display_date,
    displayTime: newRecord.display_time,
    code: newRecord.code
  });

  await loadAttendanceRecords();

  codeInput.value = "";
  checkInMessage.textContent = "";
showSuccessToast("Checked In!", "Your attendance has been saved.");
renderAll();
});

// Prayer request form.
document.getElementById("prayerForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser) {
    alert("Please log in before submitting a prayer request.");
    return;
  }

  const name = document.getElementById("prayerName").value.trim() || currentUser.fullName;
  const text = document.getElementById("prayerText").value.trim();
  const isPrivate = document.getElementById("privatePrayer").checked;

  if (!text) {
    alert("Please write a prayer request.");
    return;
  }

  const newPrayer = {
    user_id: currentUser.id,
    name,
    username: currentUser.username,
    text,
    private: isPrivate,
    prayed: false,
    date: new Date().toLocaleDateString()
  };

  const { error } = await db
    .from("prayer_requests")
    .insert(newPrayer);

  if (error) {
    alert("Prayer request could not be submitted.");
    return;
  }

  event.target.reset();

  await loadPrayerRequests();
renderAll();
showSuccessToast("Prayer Submitted!", "Your prayer request has been saved.");
}); 

// Leader event creation.
document.getElementById("eventForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser || currentUser.role !== "leader") {
    alert("Only leaders can create events.");
    return;
  }

  const title = document.getElementById("eventTitle").value.trim();
  const date = document.getElementById("eventDate").value;
  const description = document.getElementById("eventDescription").value.trim();

  if (!title || !date || !description) {
    alert("Please fill in all event fields.");
    return;
  }

  const { error } = await db
    .from("events")
    .insert({
      title,
      date,
      description,
      created_by: currentUser.id
    });

  if (error) {
    alert("Event could not be created.");
    return;
  }

  event.target.reset();
  await loadEvents();
renderAll();
showSuccessToast("Event Created!", "The event is now live.");
});

// Anonymous question submission.
document.getElementById("questionForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser) {
    alert("Please log in before asking a question.");
    return;
  }

  const question = document.getElementById("questionInput").value.trim();
  const showName = document.getElementById("showQuestionName").checked;

  if (!question) {
    alert("Please write your question.");
    return;
  }

  const { error } = await db
    .from("questions")
    .insert({
      user_id: currentUser.id,
      full_name: currentUser.fullName,
      username: currentUser.username,
      question,
      answer: "",
      show_name: showName
    });

  if (error) {
    alert("Question could not be submitted.");
    return;
  }

  event.target.reset();
  await loadQuestions();
renderAll();
showSuccessToast("Question Submitted!", "Your question was sent to the leaders.");
});

// Q&A search.
document.getElementById("questionSearch").addEventListener("input", renderQuestions);

// Member directory search for leaders.
document.getElementById("memberSearch").addEventListener("input", renderMembers);

// Leader announcement posting.
document.getElementById("announcementForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser || currentUser.role !== "leader") {
    alert("Only leaders can post announcements.");
    return;
  }

  const input = document.getElementById("announcementInput");
  const text = input.value.trim();

  if (!text) return;

  const { error } = await db
    .from("announcements")
    .insert({
      text,
      created_by: currentUser.id
    });

  if (error) {
    alert("Announcement could not be posted.");
    return;
  }

  input.value = "";
await loadAnnouncements();
renderAll();
showSuccessToast("Announcement Posted!", "Everyone can now see the update.");
});

// Leader resource posting.
// Leaders can add links to prayer guides, Bible studies, worship resources, photos, and files.
document.getElementById("resourceForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser || currentUser.role !== "leader") {
    alert("Only leaders can add resources.");
    return;
  }

  const title = document.getElementById("resourceTitle").value.trim();
  const category = document.getElementById("resourceCategory").value;
  const url = document.getElementById("resourceUrl").value.trim();
  const description = document.getElementById("resourceDescription").value.trim();

  if (!title || !category || !url) {
    alert("Please add a title, category, and link.");
    return;
  }

  const { error } = await db
    .from("resources")
    .insert({
      title,
      category,
      url,
      description,
      created_by: currentUser.id
    });

  if (error) {
    alert("Resource could not be added.");
    return;
  }

  event.target.reset();
  await loadResources();
  renderAll();
  showSuccessToast("Resource Added!", "Everyone can now access this resource.");
});
// Fake AI helper.
document.getElementById("askAiBtn").addEventListener("click", () => {
  const question = document.getElementById("aiQuestion").value.trim();
  const answer = document.getElementById("aiAnswer");

  if (!question) {
    answer.textContent = "Ask a Bible question first.";
    return;
  }

  answer.textContent =
    "Study helper response: This feature would connect to an AI API later. For now, ask a leader, read the full passage, and compare the verse with the surrounding context.";
});

// Gets today's Bible verse using the same date-based system every device shares.
function getTodaysVerse() {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  let total = 0;

  for (let i = 0; i < dateKey.length; i++) {
    total += dateKey.charCodeAt(i);
  }

  return dailyVerses[total % dailyVerses.length];
}

// Makes memory answers fair.
// Punctuation and capital letters do not matter.
// The words still need to be correct and in the right order.
function cleanMemoryAnswer(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Opens the correct screen when page loads.
async function startApp() {
  authScreen.classList.remove("hidden");
  appShell.classList.add("hidden");

  let sessionResult;

  try {
    sessionResult = await db.auth.getSession();
  } catch (error) {
    showAuthMessage("Could not connect to Supabase. Check your legacy anon key.");
    return;
  }

  if (!sessionResult.data.session) return;

  const profile = await loadCurrentProfile(sessionResult.data.session.user.id);

  if (!profile) return;

  await setCurrentUser(profile);
}

startApp();
