
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A bit more graceful for a demo app than throwing an error immediately.
  console.warn("API_KEY environment variable not set. Gemini features will be disabled.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const getDrawingIdea = async (): Promise<string> => {
    if (!ai) {
        return "A cat wearing a party hat. (Gemini API key not configured)";
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Give me a fun, simple, two-word drawing prompt for two people to draw together. For example: 'Skateboarding T-Rex'.",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prompt: {
                            type: Type.STRING,
                            description: "The drawing prompt, consisting of two or three fun words.",
                        }
                    },
                    required: ["prompt"],
                },
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        return result.prompt || "Failed to get an idea. Try drawing a smiling robot!";

    } catch (error) {
        console.error("Error fetching drawing idea from Gemini:", error);
        return "Error from API. How about... a turtle with a jetpack?";
    }
};
