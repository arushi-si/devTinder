// Demo profiles seeded by `npm run seed`. Emails use example.com (reserved, never delivered).
// Avatars are DiceBear illustrations, so no real person's photo is used on a fake profile.

const avatar = (seed, bg) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}`;

const photos = (name, bgs) => bgs.map((bg, i) => ({ url: avatar(`${name}${i || ""}`, bg), publicId: null }));

const DEMO_USERS = [
  {
    firstName: "Aarav", lastName: "Mehta", age: 26, gender: "male", location: "Bengaluru",
    headline: "Backend @ a fintech that moves money fast", experienceLevel: "mid",
    skills: ["node", "go", "postgres", "kafka"],
    about: "I make payments boring (that's a compliment). Will trade code reviews for filter coffee.",
    prompts: [
      { question: "My most controversial tech opinion", answer: "Most microservices should have stayed a monolith." },
      { question: "My ideal pair-programming date", answer: "Rainy Sunday, lo-fi playlist, one gnarly race condition." },
    ],
    projects: [{ title: "Chai-o-meter", description: "IoT sensor that pings Slack when the office chai is fresh.", tags: ["iot", "slack"] }],
    bgs: ["ffd5dc", "c0aede"],
  },
  {
    firstName: "Diya", lastName: "Sharma", age: 24, gender: "female", location: "Pune",
    headline: "Frontend dev who animates everything", experienceLevel: "junior",
    skills: ["react", "framer-motion", "css", "typescript"],
    about: "If it can move, I will make it bounce. Currently learning WebGL one shader at a time.",
    prompts: [
      { question: "A website I'd build for you", answer: "A tiny site where every button makes confetti. Yes, every button." },
      { question: "I'll fall for you if you", answer: "Notice my 60fps scroll animations." },
    ],
    projects: [{ title: "Will you be my Valentine?", description: "A site where the 'No' button runs away from your cursor. 100% success rate.", tags: ["react", "fun"] }],
    bgs: ["b6e3f4", "ffdfbf"],
  },
  {
    firstName: "Kabir", lastName: "Rao", age: 29, gender: "male", location: "Hyderabad",
    headline: "ML engineer, part-time plant parent", experienceLevel: "senior",
    skills: ["python", "pytorch", "mlops", "fastapi"],
    about: "Training models by day, keeping 14 plants alive by night. The plants are harder.",
    prompts: [
      { question: "Something I built just for fun", answer: "A model that predicts which of my plants is about to die. 70% accurate, 100% dramatic." },
      { question: "On weekends you'll find me", answer: "At a board game cafe losing at Catan." },
    ],
    projects: [{ title: "PlantPal", description: "Raspberry Pi that waters plants based on soil moisture + weather API.", tags: ["python", "raspberry-pi"] }],
    bgs: ["d1f4d9", "ffd5dc"],
  },
  {
    firstName: "Ananya", lastName: "Iyer", age: 27, gender: "female", location: "Chennai",
    headline: "Full-stack + design systems nerd", experienceLevel: "mid",
    skills: ["vue", "node", "figma", "tailwind"],
    about: "I name my CSS variables better than my pets. Big fan of filter coffee and fast builds.",
    prompts: [
      { question: "Tabs or spaces, and why it matters", answer: "Tabs. Accessibility. Fight me (politely)." },
      { question: "The way to win me over is", answer: "A well-written README." },
    ],
    projects: [{ title: "Recipe Roulette", description: "Spin a wheel, get a recipe from what's left in your fridge.", tags: ["vue", "api"] }],
    bgs: ["c0aede", "b6e3f4"],
  },
  {
    firstName: "Rohan", lastName: "Das", age: 31, gender: "male", location: "Kolkata",
    headline: "DevOps: I keep the lights on", experienceLevel: "lead",
    skills: ["kubernetes", "terraform", "aws", "bash"],
    about: "My love language is a green CI pipeline. I also make a mean fish curry.",
    prompts: [
      { question: "The bug that almost broke me", answer: "A DNS issue. It's always DNS." },
      { question: "My dev setup in one sentence", answer: "Tiling WM, one monitor, too many terminals." },
    ],
    projects: [{ title: "Is it DNS?", description: "A website that answers one question. The answer is yes.", tags: ["humor"] }],
    bgs: ["ffdfbf", "d1f4d9"],
  },
  {
    firstName: "Sara", lastName: "Khan", age: 25, gender: "female", location: "Mumbai",
    headline: "iOS dev, Swift enthusiast", experienceLevel: "junior",
    skills: ["swift", "swiftui", "firebase"],
    about: "Building apps that feel nice in your hand. Weekend sketcher, weekday coder.",
    prompts: [
      { question: "The side project I'm secretly proudest of", answer: "A widget that shows how many days until my next vacation." },
      { question: "I'll fall for you if you", answer: "Send me a playlist instead of a 'hey'." },
    ],
    projects: [{ title: "Doodle Diary", description: "An app where you draw one tiny doodle per day instead of journaling.", tags: ["swiftui"] }],
    bgs: ["ffd5dc", "ffdfbf"],
  },
  {
    firstName: "Vikram", lastName: "Nair", age: 28, gender: "male", location: "Kochi",
    headline: "Game dev & Rust convert", experienceLevel: "mid",
    skills: ["rust", "c++", "bevy", "wasm"],
    about: "Writing tiny games in Rust and pretending the borrow checker is my friend.",
    prompts: [
      { question: "Let's debate this", answer: "Rust is worth the learning curve. Change my mind." },
      { question: "Something I built just for fun", answer: "A browser game where you dodge merge conflicts." },
    ],
    projects: [{ title: "Merge Conflict: The Game", description: "Dodge falling <<<<<<< markers. Written in Rust, runs in the browser via WASM.", tags: ["rust", "wasm", "game"] }],
    bgs: ["b6e3f4", "c0aede"],
  },
  {
    firstName: "Meera", lastName: "Joshi", age: 30, gender: "female", location: "Delhi",
    headline: "Data engineer who loves a good chart", experienceLevel: "senior",
    skills: ["sql", "spark", "airflow", "python"],
    about: "Turning messy data into pretty dashboards. Ask me about my spreadsheet of spreadsheets.",
    prompts: [
      { question: "My most controversial tech opinion", answer: "Excel is the world's most successful programming language." },
      { question: "On weekends you'll find me", answer: "Trekking somewhere without network, finally." },
    ],
    projects: [{ title: "Spotify Wrapped, but for chai", description: "Dashboard of my yearly chai consumption. It's concerning.", tags: ["data-viz"] }],
    bgs: ["d1f4d9", "b6e3f4"],
  },
  {
    firstName: "Arjun", lastName: "Kapoor", age: 23, gender: "male", location: "Jaipur",
    headline: "CS student shipping side projects", experienceLevel: "student",
    skills: ["javascript", "react", "mongodb", "express"],
    about: "Final year student. Hackathon regular. I've survived on Maggi and caffeine for 3 days straight.",
    prompts: [
      { question: "The side project I'm secretly proudest of", answer: "A Discord bot that reminds my friends to drink water." },
      { question: "My ideal pair-programming date", answer: "A 24-hour hackathon and a shared pizza." },
    ],
    projects: [{ title: "HydrateBot", description: "Discord bot that nags your server to drink water. 400 servers, zero thanks.", tags: ["discord", "node"] }],
    bgs: ["ffdfbf", "ffd5dc"],
  },
  {
    firstName: "Ishita", lastName: "Banerjee", age: 26, gender: "female", location: "Bengaluru",
    headline: "Security engineer, ethical hacker", experienceLevel: "mid",
    skills: ["security", "python", "go", "linux"],
    about: "I break things for a living (with permission). CTF player, cat person.",
    prompts: [
      { question: "The way to win me over is", answer: "Use a password manager. Seriously." },
      { question: "Something I built just for fun", answer: "A CTF challenge hidden inside a birthday card for my brother." },
    ],
    projects: [{ title: "Birthday CTF", description: "A birthday card you have to hack to open. Brother took 3 hours.", tags: ["ctf", "security"] }],
    bgs: ["c0aede", "d1f4d9"],
  },
  {
    firstName: "Neil", lastName: "Fernandes", age: 32, gender: "male", location: "Goa",
    headline: "Indie hacker building SaaS from the beach", experienceLevel: "senior",
    skills: ["next.js", "stripe", "postgres", "typescript"],
    about: "Left big tech to build small things. Surfing between deploys.",
    prompts: [
      { question: "My dev setup in one sentence", answer: "A laptop, a hammock, and questionable Wi-Fi." },
      { question: "Let's debate this", answer: "Ship it on Friday. Life is short." },
    ],
    projects: [{ title: "Tide Times", description: "Tiny SaaS that texts surfers when the waves are good.", tags: ["saas", "next.js"] }],
    bgs: ["b6e3f4", "ffdfbf"],
  },
  {
    firstName: "Priya", lastName: "Menon", age: 27, gender: "female", location: "Remote",
    headline: "Open-source maintainer & tech writer", experienceLevel: "mid",
    skills: ["typescript", "docs", "node", "graphql"],
    about: "I write the docs you actually read. Maintainer of a library with more stars than I deserve.",
    prompts: [
      { question: "I'll fall for you if you", answer: "Open a PR that also updates the docs." },
      { question: "A website I'd build for you", answer: "A personal wiki of all our inside jokes." },
    ],
    projects: [{ title: "Bookshelf.dev", description: "Tracks the tech books I buy vs the ones I finish. Ratio: embarrassing.", tags: ["typescript"] }],
    bgs: ["ffd5dc", "d1f4d9"],
  },
  {
    firstName: "Alex", lastName: "Morgan", age: 29, gender: "others", location: "Berlin",
    headline: "Creative coder, generative art", experienceLevel: "mid",
    skills: ["p5.js", "three.js", "glsl", "javascript"],
    about: "Making pretty things with math. Techno, coffee, and too many browser tabs.",
    prompts: [
      { question: "Something I built just for fun", answer: "A generative art piece that changes with the weather in your city." },
      { question: "On weekends you'll find me", answer: "At a gallery, or writing shaders at 3am." },
    ],
    projects: [{ title: "Weather Canvas", description: "Generative art that repaints itself from live weather data.", tags: ["three.js", "art"] }],
    bgs: ["c0aede", "ffdfbf"],
  },
  {
    firstName: "Tanvi", lastName: "Kulkarni", age: 24, gender: "female", location: "Pune",
    headline: "Android dev + accessibility advocate", experienceLevel: "junior",
    skills: ["kotlin", "jetpack-compose", "a11y"],
    about: "Apps should work for everyone. Also: I will recommend you a book.",
    prompts: [
      { question: "Tabs or spaces, and why it matters", answer: "Whatever the linter says. I'm a peacekeeper." },
      { question: "The way to win me over is", answer: "Alt text on every image." },
    ],
    projects: [{ title: "ReadAloud", description: "Android app that reads restaurant menus aloud for low-vision users.", tags: ["kotlin", "a11y"] }],
    bgs: ["d1f4d9", "ffd5dc"],
  },
  {
    firstName: "Dev", lastName: "Malhotra", age: 27, gender: "male", location: "Gurugram",
    headline: "Product engineer, ex-startup founder", experienceLevel: "senior",
    skills: ["react", "node", "aws", "product"],
    about: "Founded a startup, learned a lot, now building products I'd use myself.",
    prompts: [
      { question: "The bug that almost broke me", answer: "Timezones. Never again. (Again.)" },
      { question: "My ideal pair-programming date", answer: "Whiteboarding an idea at a cafe until they kick us out." },
    ],
    projects: [{ title: "Did I Water It?", description: "One-button app for remembering if you watered the plants. Married couples love it.", tags: ["react-native"] }],
    bgs: ["ffdfbf", "c0aede"],
  },
  {
    firstName: "Zoya", lastName: "Ali", age: 25, gender: "female", location: "Lucknow",
    headline: "AI tinkerer, prompt whisperer", experienceLevel: "junior",
    skills: ["python", "llms", "langchain", "react"],
    about: "Building small AI tools that save people 10 minutes a day. Shayari on weekends.",
    prompts: [
      { question: "A website I'd build for you", answer: "One that writes you a new poem every morning." },
      { question: "I'll fall for you if you", answer: "Laugh at my terrible puns." },
    ],
    projects: [{ title: "Good Morning Poems", description: "Sends a short AI-written poem to my mom every morning. She thinks I write them.", tags: ["ai", "python"] }],
    bgs: ["b6e3f4", "ffd5dc"],
  },
];

const demoEmail = (u) =>
  `demo.${u.firstName}.${u.lastName}@example.com`.toLowerCase().replace(/[^a-z0-9.@]/g, "");

// Profile documents ready to upsert (password is added by the seed script).
const demoProfiles = () =>
  DEMO_USERS.map(({ bgs, ...u }) => ({
    ...u,
    emailId: demoEmail(u),
    photos: photos(u.firstName, bgs),
    photoUrl: avatar(u.firstName, bgs[0]),
    isDemo: true,
    onboardingCompleted: true,
  }));

const DEMO_REPLIES = [
  "Haha, love that! What are you building these days?",
  "Okay you had me at side projects 😄",
  "Tabs or spaces? Choose wisely, this decides everything.",
  "That's so cool! Show me your favourite project?",
  "Coffee or chai while coding? ☕",
  "I'm a demo profile, but honestly, great opening line 😉",
  "What's the most cursed bug you've ever fixed?",
  "Hackathon together sometime? 🚀",
];

module.exports = { demoProfiles, DEMO_REPLIES };
