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
