
import { GoogleGenAI } from "@google/genai";
import { Mission } from "../types";

export const analyzeMissions = async (missions: Mission[]): Promise<string> => {
  if (missions.length === 0) return "No missions to analyze.";

  // Initialize the Google GenAI client with the API key from environment variables.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format the missions into a text string for the AI to process.
  const missionText = missions.map(m => `- ${m.date.toDateString()}: ${m.mission}`).join('\n');

  try {
    // Generate content using gemini-3-pro-preview for complex reasoning tasks like conflict detection.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a mission planning assistant. Analyze the following list of missions and provide a brief, professional summary (max 150 words). Highlight any busy days or potential conflicts. 
      
      Missions:
      ${missionText}`,
    });

    // Directly access the .text property of the GenerateContentResponse object.
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to analyze missions with AI.";
  }
};
