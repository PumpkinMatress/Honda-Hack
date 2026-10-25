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
// Listed lowest to highest; core.js uses this order to rank badges.
const LEVELS = [
  { id: "beginner",     label: "Beginner",     meaning: "Has used the skill with guidance. The basics are there, but the work needed help." },
  { id: "intermediate", label: "Intermediate", meaning: "Handles common tasks on their own, with some rough edges." },
  { id: "proficient",   label: "Proficient",   meaning: "Solid, independent work that would hold up on a real engineering team." },
  { id: "advanced",     label: "Advanced",     meaning: "At or near professional quality. Could teach this skill to others." },
];

// ---------- People ----------

const users = [
  // The three people you switch between in the "Viewing as" dropdown.
  {
    id: "maya",
    name: "Bennett Dial",
    role: "student",
    major: "Electrical & Computer Engineering",
    year: "3rd year",
    bio: "I'm an ECE student who loves building hardware that solves everyday problems.\n\n" +
      "I work mostly in circuit design, soldering, and embedded C, and I don't call a project finished until I've tested it against real lab equipment. Looking for a Summer 2027 co-op in embedded systems or power electronics.",
    photo: "img/maya.jpg",
    skills: ["Soldering", "Circuit Design", "Embedded C", "Python", "Testing & Validation"],
  },
  {
    id: "jordan",
    name: "Jaron Jordan",
    role: "student",
    major: "Mechanical Engineering",
    year: "2nd year",
    bio: "I'm a Mechanical Engineering student focused on product design and manufacturing.\n\n" +
      "I've used SolidWorks since high school robotics and work part time in our student machine shop. I love taking a part from sketch to tested prototype. Looking for a Summer 2027 internship in automotive or product design.",
    photo: "img/jordan.jpg",
    skills: ["CAD (SolidWorks)", "3D Printing", "Machining", "Testing & Validation"],
  },
  {
    id: "priya",
    name: "Jose Bonilla",
    role: "mentor",
    title: "Battery Systems Engineer",
    company: "Honda",
    verified: true,
    bio: "I'm a Battery Systems Engineer at Honda, working on EV battery pack validation.\n\n" +
      "I review student projects because building something real is the best way to show what you can do. If your project involves batteries, sensors, or power electronics, I'd love to see it.",
    photo: "img/priya.jpg",
  },

  // Extra people so the site doesn't feel empty.
  {
    id: "sam",
    name: "Max Long",
    role: "student",
    major: "Computer Science & Engineering",
    year: "4th year",
    bio: "I'm a CSE senior who turns messy real-world data into something people can use.\n\n" +
      "My projects pair sensors and microcontrollers with Python data pipelines and dashboards. Graduating May 2027 and looking for full-time roles in data engineering or analytics.",
    photo: "img/sam.jpg",
    skills: ["Python", "Data Analysis", "Soldering"],
  },
  {
    id: "lena",
    name: "Henry Mcgee",
    role: "student",
    major: "Industrial & Systems Engineering",
    year: "3rd year",
    bio: "I'm an ISE student who keeps team projects organized and on schedule.\n\n" +
      "I usually own the timeline, budget, and documentation so my team can focus on building. Looking for a Summer 2027 internship in operations or project management.",
    photo: "img/lena.jpg",
    skills: ["Project Management", "Technical Writing", "Data Analysis"],
  },
  {
    id: "marcus",
    name: "Marcus Lee",
    role: "mentor",
    title: "Test Engineer",
    company: "AEP",
    verified: true,
    bio: "I'm a Test Engineer at AEP, validating monitoring hardware for the power grid.\n\n" +
      "I review student projects because good testing habits are rarely taught in class. My first question will always be: how did you calibrate your sensors?",
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
    prompt: "Design and build a low-cost monitor for a small lithium-ion pack (3 to 4 cells). It should measure cell voltages, pack current, and temperature, estimate the pack's state of health, and show the result so that someone with no battery background can tell whether the pack is safe to use. Aim for under $40 in parts, and show us how you checked that your readings are accurate.",
    weeks: 4,
    opens: "2026-10-01",
    closes: "2026-11-30",
    targetSkills: ["Circuit Design", "Embedded C", "CAD (SolidWorks)", "Testing & Validation"],
    whatYouGet: "A Honda battery engineer reviews every submission and rates each team member on the skills they tagged. Ratings show up as verified certifications on your profile, and every team gets private written feedback.",
  },
  {
    id: "aep-sensor",
    company: "AEP",
    postedBy: "marcus",
    title: "Show us your sensor project",
    prompt: "Built something that measures the real world? Temperature, current, vibration, air quality: anything counts. Submit a working project with a short write-up that explains how you know your readings are right.",
    weeks: 1,
    opens: "2026-09-01",
    closes: "2026-09-08",
    targetSkills: ["Soldering", "Data Analysis"],
    whatYouGet: "Written feedback and skill ratings from AEP test engineers.",
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
    description: "I designed and built an 8x8x8 LED cube with 512 hand-soldered LEDs, driven by an Arduino Nano through a chain of shift registers. I also wrote the animation firmware in C, including a rain effect and a playable 3D snake game.",
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
    description: "I built a battery-powered soil moisture sensor that sends a text when a plant needs water. It uses a capacitive sensor and an ESP32 that sleeps between hourly readings. After two power-circuit redesigns, it now runs about six months on two AA batteries.",
    photos: ["img/plant-sensor.jpg"],
    link: "https://github.com/example/plant-sensor",
    skillTags: [
      { skill: "Circuit Design", people: ["maya"] },
    ],
    submittedTo: null,
  },
  {
    id: "bench-psu",
    title: "Adjustable Bench Power Supply",
    owner: "maya",
    members: ["maya"],
    status: "done",
    description: "I built an adjustable 0 to 24 V bench power supply from a salvaged 19 V laptop charger, with current limiting and a live OLED readout. Tested against lab-grade supplies, it's accurate to within 1%, at about a third of the cost of buying one.",
    photos: ["img/bench-psu.jpg"],
    link: "https://github.com/example/bench-psu",
    skillTags: [
      { skill: "Soldering", people: ["maya"] },
      { skill: "Circuit Design", people: ["maya"] },
      { skill: "Testing & Validation", people: ["maya"] },
    ],
    submittedTo: null,
  },

  // Jordan's past projects (Maya checks his profile before adding him).
  {
    id: "cnc-plotter",
    title: "Desktop Pen Plotter",
    owner: "jordan",
    members: ["jordan"],
    status: "done",
    description: "I designed a two-axis pen plotter in SolidWorks, 3D printed the frame in PETG, and machined the aluminum rails on a manual mill. It runs GRBL firmware on an Arduino and can draw any SVG file.",
    photos: ["img/cnc-plotter.jpg"],
    link: "https://github.com/example/pen-plotter",
    skillTags: [
      { skill: "CAD (SolidWorks)", people: ["jordan"] },
      { skill: "3D Printing", people: ["jordan"] },
      { skill: "Machining", people: ["jordan"] },
    ],
    submittedTo: null,
  },
  {
    id: "bike-mount",
    title: "Bike Phone Mount, Rev 4",
    owner: "jordan",
    members: ["jordan"],
    status: "done",
    description: "I designed a vibration-damped bike phone mount over four revisions. When version 2 cracked at the clamp, I added ribs and switched to PETG, then added TPU pads to absorb vibration. The final version has held up for more than 300 miles of gravel riding.",
    photos: ["img/bike-mount.jpg"],
    link: "https://github.com/example/bike-mount",
    skillTags: [
      { skill: "CAD (SolidWorks)", people: ["jordan"] },
      { skill: "Testing & Validation", people: ["jordan"] },
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
    description: "We built a Raspberry Pi data logger that recorded a 100 W solar panel's output every minute for six weeks, then compared it against local weather data. We found that heat alone cut the panel's output by almost 10% on hot afternoons.",
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
    description: "I built a weather station that measures temperature, humidity, pressure, and wind speed with an ESP32, and posts readings every five minutes to a live dashboard I wrote in Python and Flask. It has run outdoors through a full Ohio winter.",
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
    details: "The frame is built and it flies fine in manual mode. Now I need someone to help tune the PID loops in ArduPilot and script the waypoint missions in Python. Probably 4 to 5 hours a week, mostly weekend test flights.",
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
    details: "We have six weeks of solar data and want someone who works in energy to look over our measurement setup before we write it up. Even one 30-minute call would help a lot.",
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
    text: "Just got off the call with Marcus. He said the wiring looks good, but we should calibrate the current sensor before we submit.",
    sentAt: "2026-10-19T14:02",
  },
  {
    from: "sam",
    to: "lena",
    text: "Nice! I'll grab a known load from the lab Thursday and redo the calibration.",
    sentAt: "2026-10-19T14:20",
  },
];

// ---------- Certifications (skill ratings from reviewers) ----------
// Person C's review form adds entries here. Person A's profile page shows them.
// Maya has none at the start of the demo; that's the point of the demo.
//
// id: the credential ID shown on the public certificate page and on LinkedIn.
// The review form also saves two more fields on each one:
//   reviewer: { name, title, company }  the reviewer as they were that day
//   token:    the signed version used in the public link (made by credential.js)

const certifications = [
  // SAMPLE so Person A can design the badge before Person C's form exists.
  {
    id: "BRG-K7QM-4XPA",
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
    doneWell: "Your data pipeline is clean and well documented, and the dashboard is easy to read even for someone seeing it for the first time. Logging the raw readings alongside the averages was a smart call.",
    toImprove: "Your current readings run about 5% high at low loads. Calibrate the sensor against a known resistive load, and note the calibration date in your README.",
    date: "2026-09-10",
  },
];
