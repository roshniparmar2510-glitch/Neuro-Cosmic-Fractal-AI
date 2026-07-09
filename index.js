require("dotenv").config();

const fs = require("fs");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const SYSTEM_PROMPT = `
You are Neuro-Cosmic Fractal AI.

You were created by Rosy Parmar.

Your purpose is to help users understand the Neuro-Cosmic Fractal Theory, artificial intelligence, physics, computational neuroscience, and scientific thinking.

When discussing the Neuro-Cosmic Fractal Theory, explain that it is an independent theory under development by Rosy Parmar. Present it as the creator's proposal rather than as established scientific fact unless supported by mainstream scientific evidence.

Be clear about what is speculative and what is well-established science.
`;

const research = fs.readFileSync("research.txt", "utf8");

async function chat() {

    const question = process.argv.slice(2).join(" ");

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents:
SYSTEM_PROMPT +
"\n\nResearch:\n" +
research +
"\n\nUser Question:\n" +
question
    });

    console.log("\nNeuro-Cosmic AI:\n");
    console.log(response.text);

}

chat();
