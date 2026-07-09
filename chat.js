require("dotenv").config();

const fs = require("fs");
const readline = require("readline");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const theory = fs.readFileSync("data/theory.txt", "utf8");
const physics = fs.readFileSync("data/physics.txt", "utf8");
const aiKnowledge = fs.readFileSync("data/ai.txt", "utf8");
const neuroscience = fs.readFileSync("data/neuroscience.txt", "utf8");
const profile = fs.readFileSync("data/profile.txt", "utf8");

let memory = JSON.parse(fs.readFileSync("memory.json", "utf8"));

const SYSTEM_PROMPT = `
You are Neuro-Cosmic Fractal AI.

You were created by Rosy Parmar.

Use the research provided to answer questions.

If the research does not contain the answer, clearly say so instead of inventing facts.

Be clear about what is established science and what is Rosy Parmar's proposed theory.
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("==================================");
console.log("Neuro-Cosmic Fractal AI v2.0");
console.log("Type 'exit' to quit.");
console.log("==================================");

async function askQuestion() {
  rl.question("\nYou: ", async (question) => {

    if (question.toLowerCase() === "exit") {
  console.log("\nGoodbye, Rosy!");
  rl.close();
  return;
}

if (question === "/help") {
  console.log(`
Available Commands

/help      Show all commands
/about     About Neuro-Cosmic AI
/version   Show current version
/clear     Clear conversation memory
exit       Exit chatbot
`);
  askQuestion();
  return;
}

if (question === "/version") {
  console.log("\nNeuro-Cosmic AI v2.0\n");
  askQuestion();
  return;
}

if (question === "/about") {
  console.log("\nNeuro-Cosmic AI Research Assistant");
  console.log("Created by Rosy Parmar");
  console.log("Built with Node.js + Gemini AI\n");
  askQuestion();
  return;
}

if (question === "/clear") {
  memory = [];
  fs.writeFileSync("memory.json", "[]");
  console.log("\nConversation memory cleared.\n");
  askQuestion();
  return;
}

memory.push({
  role: "user",
  text: question
});

    const conversation = memory
  .map(item => `${item.role}: ${item.text}`)
  .join("\n");

let selectedKnowledge = theory;

const lowerQuestion = question.toLowerCase();

if (
  lowerQuestion.includes("physics") ||
  lowerQuestion.includes("gravity") ||
  lowerQuestion.includes("black hole")
) {
  selectedKnowledge = physics;
}

if (
  lowerQuestion.includes("artificial intelligence") ||
  lowerQuestion.includes("machine learning") ||
  lowerQuestion.includes("ai")
) {
  selectedKnowledge = aiKnowledge;
}

if (
  lowerQuestion.includes("brain") ||
  lowerQuestion.includes("neuron") ||
  lowerQuestion.includes("neuroscience")
) {
  selectedKnowledge = neuroscience;
}

if (
  lowerQuestion.includes("who created you") ||
  lowerQuestion.includes("who made you") ||
  lowerQuestion.includes("creator") ||
  lowerQuestion.includes("rosy")
) {
  selectedKnowledge = profile;
}

if (
  lowerQuestion.includes("neuro-cosmic") ||
  lowerQuestion.includes("fractal")
) {
  selectedKnowledge = theory;
}

const fullPrompt =
  SYSTEM_PROMPT +
  "\n\nKnowledge:\n" +
selectedKnowledge +
  "\n\nConversation History:\n" +
  conversation +
  "\n\nCurrent User Question:\n" +
  question;

console.log("\nNeuro-Cosmic AI is thinking...\n");

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: fullPrompt
});

    console.log("\nNeuro-Cosmic AI:\n");
    console.log(response.text);

memory.push({
  role: "assistant",
  text: response.text
});

fs.writeFileSync(
  "memory.json",
  JSON.stringify(memory, null, 2)
);

    askQuestion();
  });
}

askQuestion();
