const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateResponse(content) {

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: content,
    });
    return response.text;
  } catch (err) {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: content,
    });
    return response.text;
  }
}

module.exports = { generateResponse };
