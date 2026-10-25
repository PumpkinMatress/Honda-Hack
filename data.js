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
// Each level has a badge picture in img/badges/<id>.png (shown on profile folders).
const LEVELS = [
  { id: "beginner",     label: "Beginner",     meaning: "Has used the skill with guidance. The basics are there, but the work needed help." },
  { id: "intermediate", label: "Intermediate", meaning: "Handles common tasks on their own, with some rough edges." },
  { id: "advanced",     label: "Advanced",     meaning: "Solid, independent work that would hold up on a real engineering team." },
  { id: "expert",       label: "Expert",       meaning: "At or near professional quality. Could teach this skill to others." },
];

// ---------- People ----------

const users = [
  // The three people you switch between in the "Viewing as" dropdown.
  {
    id: "maya",
    name: "Bennett Dial",
    role: "student",
    major: "Economics",
    year: "2nd year",
    bio: "I'm an Economics student who builds hardware on the side, mostly small electronics that solve everyday problems.\n\n" +
      "I taught myself circuit design, soldering, and embedded C in the makerspace, and I don't call a project finished until I've tested it against real lab equipment. Looking for a Summer 2027 internship where I can work between business and engineering.",
    photo: "img/maya.jpg",
    skills: ["Soldering", "Circuit Design", "Embedded C", "Python", "Testing & Validation"],
  },
  {
    id: "jordan",
    name: "Jaron Jordan",
    role: "student",
    major: "Electrical Engineering",
    year: "2nd year",
    bio: "I'm an Electrical Engineering student who loves the mechanical side of hardware too.\n\n" +
      "I've used SolidWorks since high school robotics and work part time in our student machine shop, so I can take a project from circuit to finished enclosure. Looking for a Summer 2027 internship in automotive or product design.",
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
    year: "2nd year",
    bio: "I'm a Computer Science & Engineering student who turns messy real-world data into something people can use.\n\n" +
      "My projects pair sensors and microcontrollers with Python data pipelines and dashboards. Looking for a Summer 2027 internship in data engineering or analytics.",
    photo: "img/sam.jpg",
    skills: ["Python", "Data Analysis", "Soldering"],
  },
  {
    id: "lena",
    name: "Henry McGee",
    role: "student",
    major: "Mechatronics",
    year: "2nd year",
    bio: "I'm a Mechatronics student who keeps team projects organized and on schedule.\n\n" +
      "I usually own the timeline, budget, and documentation so my team can focus on building, and I'm happy to jump in on the mechanical and electrical work too. Looking for a Summer 2027 internship in operations or project management.",
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
    whatYouGet: "A Honda battery engineer reviews every submission and rates each team member on the skills they tagged. Ratings show up as verified skill certifications on your profile, and every team gets private written feedback.",
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
// status: "open" (still being worked on), "submitted" (waiting for a challenge review) or "done"
// completedOn: the day it was finished (shown on the folder tab on profiles)
// description, photos[0]: the title card's summary and picture (folder.js)
// links: [{ label, url }], the title card's "Important links". Optional.
// pages: [{ id, title, date, html }], the pages the team adds as the project goes,
//        oldest first (folder.js)
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
    completedOn: "2025-04-19",
    pages: [
      {
        id: "led-cube-1",
        title: "Soldering the layers",
        date: "02/22/25",
        html:
          "<h2>The build</h2>" +
          "<p>512 LEDs: 64 per layer, eight layers. I made a wooden jig to hold each layer straight while soldering. All the soldering took about <b>30 hours</b>.</p>" +
          "<h2>Lesson learned</h2>" +
          "<p>Test every layer before stacking them. I had to desolder a whole layer to fix one cold joint.</p>",
      },
      {
        id: "led-cube-2",
        title: "Driver board and animations",
        date: "04/19/25",
        html:
          "<h2>How it's driven</h2>" +
          "<ul><li>An Arduino Nano runs everything</li>" +
          "<li>Eight 74HC595 shift registers pick the columns</li>" +
          "<li>Eight transistors switch on one layer at a time, fast enough that you can't see the flicker</li></ul>" +
          "<h2>Animations</h2>" +
          "<p>I wrote the firmware in C: rain, a rotating wave, text that scrolls around the sides, and a playable <mark>3D snake game</mark> with two buttons.</p>",
      },
    ],
    description: "I designed and built an 8x8x8 LED cube with 512 hand-soldered LEDs, driven by an Arduino Nano through a chain of shift registers. I also wrote the animation firmware in C, including a rain effect and a playable 3D snake game.",
    photos: ["img/led-cube.jpg"],
    links: [
      { label: "GitHub", url: "https://github.com/example/led-cube" },
      { label: "Demo video", url: "https://www.youtube.com/watch?v=example-led-cube" },
    ],
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
    completedOn: "2025-11-15",
    pages: [
      {
        id: "plant-sensor-1",
        title: "Version 1",
        date: "10/04/25",
        html:
          "<h2>The problem</h2>" +
          "<p>I kept forgetting to water the plants in my apartment, so I wanted something that just texts me.</p>" +
          "<h2>How it works</h2>" +
          "<ul><li>A capacitive soil sensor (no bare metal in the dirt, so it doesn't corrode)</li>" +
          "<li>An ESP32 wakes up once an hour, takes a reading, and goes back to deep sleep</li>" +
          "<li>If the soil is too dry, it sends a text through a free webhook service</li></ul>",
      },
      {
        id: "plant-sensor-2",
        title: "Fixing the battery life",
        date: "11/15/25",
        html:
          "<p>Version 1 lasted <b>9 days</b>. The voltage regulator was wasting power even while the ESP32 slept. " +
          "I switched to a low-quiescent-current regulator and cut power to the sensor between readings. " +
          "Now it should last <mark>about six months on two AA batteries</mark>.</p>" +
          "<h2>Next time</h2>" +
          "<p>Design a small PCB so the whole thing fits inside a plant pot.</p>",
      },
    ],
    description: "I built a battery-powered soil moisture sensor that sends a text when a plant needs water. It uses a capacitive sensor and an ESP32 that sleeps between hourly readings. After two power-circuit redesigns, it now runs about six months on two AA batteries.",
    photos: ["img/plant-sensor.jpg"],
    links: [{ label: "GitHub", url: "https://github.com/example/plant-sensor" }],
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
    completedOn: "2026-01-03",
    pages: [
      {
        id: "bench-psu-1",
        title: "Plan and parts",
        date: "11/22/25",
        html:
          "<h2>Why I built it</h2>" +
          "<p>Our lab only has four bench supplies, and they're all taken the week before a deadline. A decent one costs over $150, so I wanted to see how close I could get for less.</p>" +
          "<h2>Parts</h2>" +
          "<ul><li>A salvaged 19 V laptop charger (free, from the e-waste bin)</li>" +
          "<li>An XL6009 converter, rewired for 0 to 24 V</li>" +
          "<li>An INA219 current sensor and a small OLED screen</li>" +
          "<li>An Arduino Nano for the readout and the current limit</li></ul>",
      },
      {
        id: "bench-psu-2",
        title: "Version 1 overheated",
        date: "12/13/25",
        html:
          "<p>Version 1 had no heatsink on the converter. It hit <b>92 °C</b> at 2 A after ten minutes. I added an aluminum heatsink and a small fan, and now it stays under 55 °C.</p>",
      },
      {
        id: "bench-psu-3",
        title: "Testing and wrap-up",
        date: "01/03/26",
        html:
          "<h2>How I tested it</h2>" +
          "<p>I checked the output against the lab's bench supply and a Fluke multimeter at 1, 5, 12 and 24 V. Every reading was <mark>within 1%</mark>.</p>" +
          "<h2>Next time</h2>" +
          "<p>Add a second channel, and swap the knob for a rotary encoder so I can dial in exact voltages.</p>",
      },
    ],
    description: "I built an adjustable 0 to 24 V bench power supply from a salvaged 19 V laptop charger, with current limiting and a live OLED readout. Tested against lab-grade supplies, it's accurate to within 1%, at about a third of the cost of buying one.",
    photos: ["img/bench-psu.jpg"],
    links: [
      { label: "GitHub", url: "https://github.com/example/bench-psu" },
      { label: "Demo video", url: "https://www.youtube.com/watch?v=example-bench-psu" },
      { label: "Enclosure CAD", url: "https://cad.onshape.com/documents/example-bench-psu-enclosure" },
    ],
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
    completedOn: "2025-12-06",
    pages: [
      {
        id: "cnc-plotter-1",
        title: "CAD and printed parts",
        date: "10/11/25",
        html:
          "<h2>The design</h2>" +
          "<p>I modeled the whole plotter in SolidWorks before buying anything, so I could check that the gantry cleared the paper and the belts lined up. The drawing area is <b>A4</b>.</p>" +
          "<ul><li>8 printed parts in orange PETG: corner blocks, motor mounts, and the pen carriage</li>" +
          "<li>Two NEMA 17 stepper motors and a GT2 belt</li>" +
          "<li>A small servo lifts the pen between lines</li></ul>",
      },
      {
        id: "cnc-plotter-2",
        title: "Machining the rails",
        date: "11/08/25",
        html:
          "<p>I cut the aluminum rails to length and drilled the mounting holes on the manual mill in the student shop. " +
          "My first set was off by <b>0.4 mm</b>, and the carriage bound up at one end. " +
          "I remade them using a stop block so every hole lined up.</p>",
      },
      {
        id: "cnc-plotter-3",
        title: "First drawings",
        date: "12/06/25",
        html:
          "<h2>How it runs</h2>" +
          "<p>An Arduino with a CNC shield runs GRBL. I turn SVG files into G-code and stream them over USB. " +
          "A full spirograph takes about <mark>12 minutes</mark>.</p>" +
          "<h2>Next time</h2>" +
          "<p>Add limit switches so it can home itself instead of me lining it up by hand.</p>",
      },
    ],
    description: "I designed a two-axis pen plotter in SolidWorks, 3D printed the frame in PETG, and machined the aluminum rails on a manual mill. It runs GRBL firmware on an Arduino and can draw any SVG file.",
    photos: ["img/cnc-plotter.jpg"],
    links: [{ label: "GitHub", url: "https://github.com/example/pen-plotter" }],
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
    completedOn: "2026-03-21",
    pages: [
      {
        id: "bike-mount-1",
        title: "Revs 1 and 2",
        date: "01/17/26",
        html:
          "<h2>The problem</h2>" +
          "<p>Every store-bought mount I tried rattled loose on gravel, and one dropped my phone on the trail.</p>" +
          "<h2>What happened</h2>" +
          "<p>Rev 1 was printed in PLA and the clamp was too loose. Rev 2 was tighter, but it <b>cracked at the clamp</b> after about 20 miles, right where the bolt pulls the two halves together.</p>",
      },
      {
        id: "bike-mount-2",
        title: "Revs 3 and 4",
        date: "03/21/26",
        html:
          "<ul><li><b>Rev 3:</b> switched to PETG, which bends a little instead of snapping, and added ribs around the clamp</li>" +
          "<li><b>Rev 4:</b> added printed TPU pads between the clamp and the bar to soak up vibration</li></ul>" +
          "<h2>Testing</h2>" +
          "<p>I logged rides with my phone's accelerometer. The TPU pads cut the shaking at the phone by about <mark>40%</mark>. Rev 4 has more than 300 miles on it with no cracks.</p>",
      },
    ],
    description: "I designed a vibration-damped bike phone mount over four revisions. When version 2 cracked at the clamp, I added ribs and switched to PETG, then added TPU pads to absorb vibration. The final version has held up for more than 300 miles of gravel riding.",
    photos: ["img/bike-mount.jpg"],
    links: [{ label: "GitHub", url: "https://github.com/example/bike-mount" }],
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
    completedOn: "2026-10-12",
    pages: [
      {
        id: "solar-logger-1",
        title: "Setting up the logger",
        date: "08/24/26",
        html:
          "<h2>The setup</h2>" +
          "<ul><li>A 100 W panel on a tilting stand on our balcony</li>" +
          "<li>A charge controller and a small 12 V battery, so the panel always has a load</li>" +
          "<li>A Raspberry Pi reads an INA219 sensor and a temperature probe on the back of the panel every minute</li></ul>" +
          "<p>Readings go into a CSV file, and the Pi uploads it every night so we don't lose data if the SD card dies.</p>",
      },
      {
        id: "solar-logger-2",
        title: "Six weeks of data",
        date: "10/12/26",
        html:
          "<h2>What we found</h2>" +
          "<p>We lined up about 60,000 readings with local weather records. Clouds caused the biggest drops, but heat mattered too: " +
          "on afternoons above 85 °F the panel made <mark>almost 10% less power</mark> than on cool, sunny days.</p>" +
          "<h2>Next time</h2>" +
          "<p>Calibrate the current sensor before starting. We found a small offset halfway through and had to correct the first three weeks.</p>",
      },
    ],
    description: "We built a Raspberry Pi data logger that recorded a 100 W solar panel's output every minute for six weeks, then compared it against local weather data. We found that heat alone cut the panel's output by almost 10% on hot afternoons.",
    photos: ["img/solar-logger.jpg"],
    links: [{ label: "GitHub", url: "https://github.com/example/solar-logger" }],
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
    completedOn: "2026-09-10",
    pages: [
      {
        id: "weather-station-1",
        title: "Sensors and wiring",
        date: "12/06/25",
        html:
          "<h2>Parts</h2>" +
          "<ul><li>A BME280 for temperature, humidity, and pressure</li>" +
          "<li>A cup anemometer and wind vane from a hobby kit</li>" +
          "<li>An ESP32, soldered onto perfboard in a weatherproof box</li>" +
          "<li>A small solar panel and a battery, so it doesn't need an outlet</li></ul>" +
          "<p>The first temperature readings were <b>8 °F too high</b> on sunny days. I put the sensor in a louvered shield so the sun can't heat it directly.</p>",
      },
      {
        id: "weather-station-2",
        title: "The dashboard",
        date: "09/10/26",
        html:
          "<p>The ESP32 posts readings every five minutes to a small Flask app I wrote in Python. The dashboard shows live values and graphs for the last week.</p>" +
          "<h2>Results</h2>" +
          "<p>It ran outdoors all winter, down to <mark>-6 °F</mark>, and only missed data during two power outages.</p>",
      },
    ],
    description: "I built a weather station that measures temperature, humidity, pressure, and wind speed with an ESP32, and posts readings every five minutes to a live dashboard I wrote in Python and Flask. It has run outdoors through a full Ohio winter.",
    photos: ["img/weather-station.jpg"],
    links: [{ label: "GitHub", url: "https://github.com/example/weather-station" }],
    skillTags: [
      { skill: "Soldering", people: ["sam"] },
      { skill: "Data Analysis", people: ["sam"] },
    ],
    submittedTo: "aep-sensor",
  },

  // Open projects other students posted listings for (shown on the Listings page).
  {
    id: "delivery-drone",
    title: "Autonomous Delivery Drone",
    owner: "sam",
    members: ["sam"],
    status: "open",
    description: "A quadcopter that carries a small package across campus on its own. The frame is printed, the motors are tuned, and it flies well in manual mode. Next up: waypoint missions and a safe landing routine.",
    photos: ["img/delivery-drone.jpg"],
    links: [{ label: "GitHub", url: "https://github.com/example/delivery-drone" }],
    skillTags: [
      { skill: "Soldering", people: ["sam"] },
      { skill: "Python", people: ["sam"] },
    ],
    challenge: null,
    submittedTo: null,
    startedOn: "2026-09-28",
  },
  {
    id: "dorm-energy",
    title: "Dorm Energy Audit",
    owner: "lena",
    members: ["lena"],
    status: "open",
    description: "I put plug-in power meters on 20 dorm rooms to find out where the energy actually goes. Three weeks in, mini fridges and gaming PCs left on overnight are leading by a lot.",
    photos: ["img/dorm-energy.jpg"],
    links: [],
    skillTags: [
      { skill: "Data Analysis", people: ["lena"] },
      { skill: "Project Management", people: ["lena"] },
    ],
    challenge: null,
    submittedTo: null,
    startedOn: "2026-10-01",
  },

  // NOTE: Maya's new project does NOT exist yet. She makes it with
  // "Create project" on her profile during the demo.
  // Projects without pages show an empty "Add page" spot.
];

// ---------- Listings (posts on the Listings page) ----------
// "Create listing" on a current project's folder (listings.js) adds one here.
// project:     the project's id (its folder shows next to the post)
// lookingFor:  "student" (a group member), "mentor", or "any" (either)
// role:        a short name for who they want, like "Mentor" or "Flight controller programmer"
// details:     the post itself: what they're looking for, in their own words

const listings = [
  {
    id: "listing-drone",
    project: "delivery-drone",
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
    project: "dorm-energy",
    projectTitle: "Dorm Energy Audit",
    owner: "lena",
    challenge: null,
    lookingFor: "mentor",
    role: "Energy industry mentor",
    details: "I have three weeks of power data from 20 dorm rooms and want someone who works in energy to look over my measurement setup before I collect more. Even one 30-minute call would help a lot.",
    skillsNeeded: ["Data Analysis", "Testing & Validation"],
    postedOn: "2026-10-18",
  },
];

// ---------- Messages ----------
// One list of messages. A conversation = all messages between two people.
// Person B's chat screen adds to this during the demo. Keep them oldest first:
// the chat list puts the person you talked to last at the top.
// listing: (optional) the listing a message was sent from, so its owner can add the sender to the team.

const messages = [
  {
    from: "sam",
    to: "maya",
    text: "Hey Bennett, can I borrow your soldering iron this weekend? The tip on mine finally died.",
    sentAt: "2026-10-02T19:15",
  },
  {
    from: "maya",
    to: "sam",
    text: "Sure! It's in my locker in the ECE lab. Just bring it back with a clean tip.",
    sentAt: "2026-10-02T19:31",
  },
  {
    from: "maya",
    to: "priya",
    text: "Hi Jose! Quick question about the battery monitor challenge: can we test with cells pulled from an old laptop battery, or do they need to be new?",
    sentAt: "2026-10-06T10:12",
  },
  {
    from: "priya",
    to: "maya",
    text: "Salvaged cells are fine. Check each cell's voltage and internal resistance before you build, and explain how you did it in your write-up.",
    sentAt: "2026-10-06T13:41",
  },
  {
    from: "jordan",
    to: "lena",
    text: "Thanks for sharing your Gantt chart template. Our design team finally has a schedule we stick to.",
    sentAt: "2026-10-12T11:05",
  },
  {
    from: "lena",
    to: "jordan",
    text: "Happy to help! Send it my way anytime if you want a second pair of eyes.",
    sentAt: "2026-10-12T11:20",
  },
  {
    from: "lena",
    to: "maya",
    text: "Are you still selling your old Arduino Uno? Our solar logger needs a second board.",
    sentAt: "2026-10-14T16:40",
  },
  {
    from: "maya",
    to: "lena",
    text: "Yep, it's yours! I'll bring it to the makerspace Thursday.",
    sentAt: "2026-10-14T17:02",
  },
  {
    from: "lena",
    to: "maya",
    text: "Perfect, thank you!",
    sentAt: "2026-10-14T17:04",
  },
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
    id: "NXS-K7QM-4XPA",
    user: "sam",
    skill: "Data Analysis",
    level: "expert",
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
