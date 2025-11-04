import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateChatResponse = async (systemInstruction: string, userMessage: string): Promise<string> => {
  if (!API_KEY) {
    return "API Key is not configured. Please contact the site owner.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5,
        topP: 0.95,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
};
