// ============================================================
// data.js — all the fake data for the prototype.
// Every page loads this file, so edit it here and it changes everywhere.
// Skill levels run 1–5. "verifiedBy" is the id of the professional
// who confirmed the claim, or null if nobody has yet.
// ============================================================

const users = [
  {
    id: "u1",
    name: "Maya Chen",
    role: "student",
    school: "State University",
    major: "Computer Engineering, Junior",
    bio: "I like building things that move. Currently working on robotics and embedded C++.",
    skills: ["C++", "Embedded Systems", "Python", "Circuit Design"],
    experience: ["Robotics Club — Software Lead (2025–present)", "Teaching Assistant, Intro to Programming"]
  },
  {
    id: "u2",
    name: "Devon Brooks",
    role: "student",
    school: "State University",
    major: "Computer Science, Sophomore",
    bio: "Front-end developer who loves making apps people actually use.",
    skills: ["JavaScript", "HTML/CSS", "UI Design"],
    experience: ["Web Developer Intern, Campus IT (Summer 2026)"]
  },
  {
    id: "u3",
    name: "Priya Natarajan",
    role: "professional",
    verified: true,
    company: "Brightline Robotics",
    title: "Senior Software Engineer",
    bio: "10 years writing control software for autonomous robots. Happy to mentor students getting into robotics.",
    skills: ["C++", "Robotics", "Control Systems"],
    experience: ["Senior Software Engineer, Brightline Robotics", "Software Engineer, Northfield Automation"]
  },
  {
    id: "u4",
    name: "Marcus Hill",
    role: "professional",
    verified: true,
    company: "Voltaic Systems",
    title: "Electrical Engineer",
    bio: "Power electronics and PCB design. I review student hardware projects whenever I can.",
    skills: ["Circuit Design", "PCB Layout", "Power Electronics"],
    experience: ["Electrical Engineer, Voltaic Systems"]
  }
];

const projects = [
  {
    id: "p1",
    title: "Line-Following Robot",
    status: "open", // "open" or "past"
    owner: "u1",
    authors: ["u1", "u2"],
    mentors: ["u3"],
    description: "An autonomous robot that follows a line using infrared sensors and a PID controller written in C++. Next step: adding obstacle avoidance.",
    images: [],
    files: ["main.cpp", "pid_controller.h", "motor_control.cpp"],
    skillClaims: [
      { skill: "C++", level: 3, verifiedBy: "u3" },
      { skill: "Embedded Systems", level: 2, verifiedBy: null }
    ],
    updated: "2026-10-20"
  },
  {
    id: "p2",
    title: "Campus Event Finder",
    status: "past",
    owner: "u2",
    authors: ["u2"],
    mentors: [],
    description: "A web app that collects campus events into one searchable calendar, with filters by category and date.",
    images: [],
    files: ["index.html", "app.js", "style.css"],
    skillClaims: [
      { skill: "JavaScript", level: 2, verifiedBy: null },
      { skill: "UI Design", level: 2, verifiedBy: null }
    ],
    updated: "2026-05-02"
  },
  {
    id: "p3",
    title: "Smart Plant Monitor",
    status: "past",
    owner: "u1",
    authors: ["u1"],
    mentors: ["u4"],
    description: "A soil moisture and light sensor board that sends readings to a phone. Designed and soldered the circuit from scratch.",
    images: [],
    files: ["schematic.pdf", "sensor_reader.cpp"],
    skillClaims: [
      { skill: "Circuit Design", level: 2, verifiedBy: "u4" },
      { skill: "C++", level: 2, verifiedBy: null }
    ],
    updated: "2026-03-15"
  }
];

const listings = [
  {
    id: "l1",
    project: "p1",
    position: "student", // "student" or "mentor"
    title: "Computer vision helper",
    description: "Help add a camera so the robot can recognize obstacles. You'd write the image-processing code and test it on the robot.",
    skillsNeeded: ["Python", "OpenCV", "Basic C++"]
  },
  {
    id: "l2",
    project: "p1",
    position: "mentor",
    title: "Hardware mentor",
    description: "Looking for someone with motor driver and power supply experience to review our wiring and help us avoid frying another board.",
    skillsNeeded: ["Power Electronics", "Motor Control"]
  }
];

const showcases = [
  {
    id: "s1",
    company: "Brightline Robotics",
    postedBy: "u3",
    title: "Autonomy Challenge",
    prompt: "Build a robot or simulation that makes its own decisions. We'll review every submission and offer summer internship interviews to standout projects.",
    opens: "2026-10-01",
    closes: "2027-01-31",
    prize: "Internship interviews",
    submissions: ["p1"]
  },
  {
    id: "s2",
    company: "Voltaic Systems",
    postedBy: "u4",
    title: "Show Off Your Circuits",
    prompt: "Show off any electrical engineering project you've already built. One week only.",
    opens: "2026-10-22",
    closes: "2026-10-29",
    prize: "Feedback from our engineering team",
    submissions: ["p3"]
  }
];

// Pretend this person is logged in. Change it to test other profiles.
const currentUserId = "u1";
