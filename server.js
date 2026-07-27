require("dotenv").config();

const express = require("express");
const path = require("path");

const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");

const multer = require("multer");
const pdfParse = require("pdf-parse");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const theory = fs.readFileSync("data/theory.txt", "utf8");
const physics = fs.readFileSync("data/physics.txt", "utf8");
const aiKnowledge = fs.readFileSync("data/ai.txt", "utf8");
const neuroscience = fs.readFileSync("data/neuroscience.txt", "utf8");
const profile = fs.readFileSync("data/profile.txt", "utf8");

let uploadedPdfText = "";
let uploadedPdfChunks = [];

function splitIntoChunks(text, chunkSize = 1000) {
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

function findRelevantChunks(question, chunks, maxChunks = 5) {
  const words = question
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean);

  const scored = chunks.map(chunk => {
    let score = 0;
    const lower = chunk.toLowerCase();

    for (const word of words) {
      if (lower.includes(word)) score++;
    }

    return { chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map(x => x.chunk)
    .join("\n\n");
}

const app = express();

function searchKnowledge(question) {
  const query = question.toLowerCase();

  const allChunks = [
    ...uploadedPdfChunks,
    theory,
    physics,
    aiKnowledge,
    neuroscience,
    profile
  ];

  const scored = allChunks.map(chunk => {
    let score = 0;

    const words = query.split(/\s+/);

    for (const word of words) {
      if (word.length < 3) continue;

      const matches = (
        chunk.toLowerCase().match(
          new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
        ) || []
      ).length;

      score += matches;
    }

    return { chunk, score };
  });

  return scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(x => x.chunk)
    .join("\n\n");
}

const upload = multer({
  dest: "uploads/"
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/chat", async (req, res) => {
  try {
    const question = req.body.question;

let pdfContext = uploadedPdfText;

if (uploadedPdfChunks.length > 0) {
  const lowerQuestion = question.toLowerCase();

  const matchedChunks = uploadedPdfChunks.filter(chunk =>
    chunk.toLowerCase().includes(lowerQuestion) ||
    lowerQuestion.split(" ").some(word =>
      word.length > 3 && chunk.toLowerCase().includes(word)
    )
  );

  if (matchedChunks.length > 0) {
    pdfContext = matchedChunks.slice(0, 5).join("\n\n");
  }
}

console.log("Context length:", pdfContext.length);

console.log("Question:", question);
    console.log("Uploaded PDF length:", uploadedPdfText.length);

    const lowerQuestion = question.toLowerCase();

console.log("Question:", question);
console.log("Time:", new Date().toISOString());
console.log("IP:", req.ip);

let selectedKnowledge = theory;

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

const systemPrompt = `
You are Neuro-Cosmic AI created by Rosy Parmar.

If the user asks questions about an uploaded PDF,
answer ONLY from the uploaded PDF.

If the answer is not found in the PDF, say:
"I couldn't find that information in the uploaded PDF."

Do not make up answers.
`;

let prompt;

if (uploadedPdfText.length > 0) {

  prompt = `
${systemPrompt}

Uploaded PDF:
${uploadedPdfText}

Question:
${question}
`;

} else {

  prompt = `
${systemPrompt}

Knowledge:
${selectedKnowledge}

Question:
${question}
`;

}

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    res.json({
      answer: response.text
    });

 } catch (error) {
  console.error("===== CHAT ERROR =====");
  console.error(error);

  if (error.stack) {
    console.error(error.stack);
  }

  res.status(500).json({
    answer: error.message || "Something went wrong."
  });
}
});


app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
console.log("File:", req.file);
console.log("Headers:", req.headers["content-type"]);

if (!req.file) {
if (req.file.mimetype !== "application/pdf") {
  fs.unlinkSync(req.file.path);

  return res.status(400).json({
    error: "Please upload a PDF file only."
  });
}
  return res.status(400).json({
    error: "No PDF file received."
  });
}

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdf = await pdfParse(dataBuffer);

uploadedPdfText = pdf.text.trim();

if (!uploadedPdfText) {
  return res.status(400).json({
    error: "This PDF contains no readable text. It may be a scanned PDF."
  });
}

    uploadedPdfText = pdf.text;

uploadedPdfChunks = splitIntoChunks(uploadedPdfText);

console.log("PDF Characters:", uploadedPdfText.length);
console.log("Total Chunks:", uploadedPdfChunks.length);


uploadedPdfChunks = [];

const chunkSize = 1000;

for (let i = 0; i < uploadedPdfText.length; i += chunkSize) {
  uploadedPdfChunks.push(
    uploadedPdfText.substring(i, i + chunkSize)
  );
}

console.log("PDF Characters:", uploadedPdfText.length);
console.log("Total Chunks:", uploadedPdfChunks.length);

res.json({
  message: "PDF uploaded successfully."
});

    fs.unlinkSync(req.file.path);

  } catch (error) {

console.error(error);

if (error.status === 503) {
    return res.status(503).json({
        answer: "Gemini is busy. Please try again in a few seconds."
    });
}
    console.error(error);
    res.status(500).json({
      error: "Failed to read PDF."
    });
  }
});

app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
});
