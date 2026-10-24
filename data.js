// data.js — all the fake data for the demo.
// Only Person A edits this file. Ask them if you need a new field.
//
// How to read this file:
//   const NAME = [ ... ]   is a list of things.
//   { key: value, ... }    is one thing, with named details.
//   Every thing has an "id" so other things can point to it.

// ---------- Fixed lists ----------

// The skills students can tag. Reviewers rate only these.
const SKILLS = [
  "Soldering",
  "Circuit Design",
  "Embedded C",
  "CAD (SolidWorks)",
  "3D Printing",
  "Machining",
  "Python",
  "Data Analysis",
  "Testing & Validation",
  "Technical Writing",
  "Project Management",
];

// What each rating level means. Shown to the reviewer next to every skill,
// so ratings mean the same thing no matter who gives them.
const LEVELS = [
  { id: "beginner",   label: "Beginner",   meaning: "Used the skill with help; results work but need rework." },
  { id: "proficient", label: "Proficient", meaning: "Used the skill independently; results are solid and repeatable." },
  { id: "advanced",   label: "Advanced",   meaning: "Made good design choices others could learn from; industry-quality work." },
];

// ---------- People ----------

const users = [
  // The three people you switch between in the "Viewing as" dropdown.
  {
    id: "maya",
    name: "Maya Chen",
    role: "student",
    major: "Electrical & Computer Engineering",
    year: "3rd year",
    bio: "I like building small electronics that solve real problems.",
    photo: "img/maya.jpg",
    skills: ["Soldering", "Circuit Design", "Embedded C"],
  },
  {
    id: "jordan",
    name: "Jordan Reyes",
    role: "student",
    major: "Mechanical Engineering",
    year: "2nd year",
    bio: "CAD nerd. Happiest in the machine shop.",
    photo: "img/jordan.jpg",
    skills: ["CAD (SolidWorks)", "3D Printing", "Machining"],
  },
  {
    id: "priya",
    name: "Priya Shah",
    role: "mentor",
    title: "Battery Systems Engineer",
    company: "Honda",
    verified: true,
    bio: "10 years in EV battery systems. Happy to give feedback on hardware projects.",
    photo: "img/priya.jpg",
  },

  // Extra people so the site doesn't feel empty.
  {
    id: "sam",
    name: "Sam Okafor",
    role: "student",
    major: "Computer Science & Engineering",
    year: "4th year",
    bio: "Data and dashboards.",
    photo: "img/sam.jpg",
    skills: ["Python", "Data Analysis"],
  },
  {
    id: "lena",
    name: "Lena Novak",
    role: "student",
    major: "Industrial & Systems Engineering",
    year: "3rd year",
    bio: "I organize things so other people can build them.",
    photo: "img/lena.jpg",
    skills: ["Project Management", "Technical Writing"],
  },
  {
    id: "marcus",
    name: "Marcus Lee",
    role: "mentor",
    title: "Test Engineer",
    company: "AEP",
    verified: true,
    bio: "Grid hardware testing. Ask me about soldering.",
    photo: "img/marcus.jpg",
  },
];

// ---------- Challenges (posted by companies) ----------

const challenges = [
  {
    id: "honda-battery",
    company: "Honda",
    postedBy: "priya",
    title: "Build a low-cost EV battery monitor",
    prompt: "Design and build a device that tracks the health of a small battery pack and shows it in a way a non-expert can understand.",
    weeks: 4,
    opens: "2026-10-01",
    closes: "2026-11-30",
    targetSkills: ["Circuit Design", "Embedded C", "CAD (SolidWorks)", "Testing & Validation"],
    whatYouGet: "Every submission gets a review and skill ratings from a Honda engineer.",
  },
  {
    id: "aep-sensor",
    company: "AEP",
    postedBy: "marcus",
    title: "Show off a sensor project",
    prompt: "Any project that measures something in the real world.",
    weeks: 1,
    opens: "2026-09-01",
    closes: "2026-09-08",
    targetSkills: ["Soldering", "Data Analysis"],
    whatYouGet: "Feedback and skill ratings from AEP test engineers.",
  },
];

// ---------- Projects ----------
// status: "open" (still being worked on) or "done"
// members: who worked on it
// skillTags: which skill each person did. Filled in by Person C's screen.
// submittedTo: the challenge id it was submitted to, or null

const projects = [
  // Maya's past projects (shown on her profile at the start of the demo).
  {
    id: "led-cube",
    title: "8x8x8 LED Cube",
    owner: "maya",
    members: ["maya"],
    status: "done",
    description: "A 512-LED cube driven by an Arduino with custom animations.",
    photos: ["img/led-cube.jpg"],
    link: "https://github.com/example/led-cube",
    skillTags: [
      { skill: "Soldering", people: ["maya"] },
      { skill: "Embedded C", people: ["maya"] },
    ],
    submittedTo: null,
  },
  {
    id: "plant-sensor",
    title: "Smart Plant Moisture Sensor",
    owner: "maya",
    members: ["maya"],
    status: "done",
    description: "Texts you when your plant needs water. Runs on a coin battery for 6 months.",
    photos: ["img/plant-sensor.jpg"],
    link: "https://github.com/example/plant-sensor",
    skillTags: [
      { skill: "Circuit Design", people: ["maya"] },
    ],
    submittedTo: null,
  },

  // A finished SAMPLE team project already submitted to the Honda challenge.
  // It is waiting for Priya's review. It lets Person C build the review screens
  // before Person B's flow exists, and makes Priya's queue look busy in the demo.
  {
    id: "solar-logger",
    title: "Solar Panel Efficiency Logger",
    owner: "sam",
    members: ["sam", "lena"],
    status: "done",
    description: "Logs panel output every minute and graphs efficiency against weather.",
    photos: ["img/solar-logger.jpg"],
    link: "https://github.com/example/solar-logger",
    skillTags: [
      { skill: "Python", people: ["sam"] },
      { skill: "Data Analysis", people: ["sam", "lena"] },
      { skill: "Project Management", people: ["lena"] },
    ],
    submittedTo: "honda-battery",
  },

  // Sam's earlier project, already reviewed by AEP (source of the sample certification).
  {
    id: "weather-station",
    title: "Backyard Weather Station",
    owner: "sam",
    members: ["sam"],
    status: "done",
    description: "Temperature, humidity, and wind sensors feeding a live web dashboard.",
    photos: ["img/weather-station.jpg"],
    link: "https://github.com/example/weather-station",
    skillTags: [
      { skill: "Soldering", people: ["sam"] },
      { skill: "Data Analysis", people: ["sam"] },
    ],
    submittedTo: "aep-sensor",
  },

  // NOTE: Maya and Jordan's new team project does NOT exist yet.
  // Person B's "Add to project" button creates it during the demo.
];

// ---------- Listings (open positions on projects) ----------
// Person B's listing form adds Maya's new listing here during the demo.

const listings = [
  {
    id: "listing-drone",
    projectTitle: "Autonomous Delivery Drone",
    owner: "sam",
    challenge: null,
    lookingFor: "student",
    role: "Flight controller programmer",
    details: "Help tune the flight controller and write the waypoint code. About 4 hours a week.",
    skillsNeeded: ["Embedded C", "Python"],
    postedOn: "2026-10-20",
  },
  {
    id: "listing-mentor",
    projectTitle: "Solar Panel Efficiency Logger",
    owner: "lena",
    challenge: null,
    lookingFor: "mentor",
    role: "Energy industry mentor",
    details: "One 30-minute call to sanity-check our measurements.",
    skillsNeeded: ["Data Analysis"],
    postedOn: "2026-10-18",
  },
];

// ---------- Messages ----------
// One list of messages. A conversation = all messages between two people.
// Person B's chat screen adds to this during the demo.

const messages = [
  {
    from: "lena",
    to: "sam",
    text: "Marcus said our sensor wiring looks good!",
    sentAt: "2026-10-19T14:02",
  },
];

// ---------- Certifications (skill ratings from reviewers) ----------
// Person C's review form adds entries here. Person A's profile page shows them.
// Maya has none at the start of the demo; that's the point of the demo.

const certifications = [
  // SAMPLE so Person A can design the badge before Person C's form exists.
  {
    user: "sam",
    skill: "Data Analysis",
    level: "advanced",
    by: "marcus",
    project: "weather-station",
    challenge: "aep-sensor",
    date: "2026-09-10",
  },
];

// ---------- Private feedback ----------
// Written comments from reviewers. Only the student sees these.

const feedback = [
  {
    project: "weather-station",
    from: "marcus",
    to: ["sam"],
    doneWell: "Clean data pipeline and clear graphs.",
    toImprove: "Calibrate the current sensor against a known load.",
    date: "2026-09-10",
  },
];
