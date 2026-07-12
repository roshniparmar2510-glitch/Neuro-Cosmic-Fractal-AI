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

const app = express();

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

console.log("Question:", question);
console.log("Time:", new Date().toISOString());
console.log("IP:", req.ip);

    const lowerQuestion = question.toLowerCase();

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

const prompt =
  "Knowledge:\n" +
  selectedKnowledge +
  "\n\nUploaded PDF:\n" +
  uploadedPdfText +
  "\n\nUser Question:\n" +
  question;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    res.json({
      answer: response.text
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      answer: "Something went wrong."
    });
  }
});


app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdf = await pdfParse(dataBuffer);

    uploadedPdfText = pdf.text;

res.json({
  message: "PDF uploaded successfully."
});

    fs.unlinkSync(req.file.path);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to read PDF."
    });
  }
});

app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
});
