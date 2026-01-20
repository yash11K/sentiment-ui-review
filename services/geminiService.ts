import { GoogleGenAI } from "@google/genai";
import { VisualizationTag } from "../types";

const SYSTEM_INSTRUCTION = `
You are AutoInsights, an expert analyst for car rental station managers. 
Your goal is to provide concise, actionable insights based on customer reviews and operational data.

When the user asks a question, analyze the context (which is typically about wait times, customer sentiment, staff performance, or vehicle cleanliness).

CRITICAL: If the user's query relates to specific data visualizations, you MUST append a JSON block to the END of your response suggesting the best visualization tag.
The available tags are:
- 'wait-time-analysis' (for queues, delays, peak hours)
- 'sentiment-breakdown' (for general feeling, positive/negative split)
- 'topic-correlation' (for specific issues like cleanliness vs rating)
- 'rating-distribution' (for star ratings 1-5)
- 'time-series-trend' (for changes over time)

Format the JSON strictly as:
\`\`\`json
{ "suggestedVisualization": "TAG_NAME" }
\`\`\`

Example:
User: "Why are people complaining about the morning shift?"
Assistant: "It seems there are recurring issues with counter staffing between 6 AM and 9 AM, leading to negative sentiment. I recommend looking at the wait time correlation."
\`\`\`json
{ "suggestedVisualization": "wait-time-analysis" }
\`\`\`

Keep your textual response professional, slightly formal but helpful.
`;

let aiClient: GoogleGenAI | null = null;

export const getAIClient = () => {
  if (!aiClient && process.env.API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

export const sendMessageToGemini = async (
  history: { role: string; content: string }[],
  newMessage: string
): Promise<{ text: string; visualization?: VisualizationTag }> => {
  const client = getAIClient();
  
  if (!client) {
    // Fallback for demo if no API key
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          text: "I'm running in demo mode because no API Key was provided. In a real environment, I would analyze your data using Gemini. For now, I'll switch the view to 'Sentiment Breakdown'.",
          visualization: 'sentiment-breakdown'
        });
      }, 1000);
    });
  }

  try {
    // Note: The new SDK syntax is strictly ai.chats.create
    const chat = client.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    // We rely on the prompt context in this single turn for simplicity or
    // ideally reconstruct history. Since the SDK manages history in a session,
    // recreating it every time is tricky without persistence. 
    // We will just send the new message for this demo, assuming the system instruction guides it enough.
    
    const result = await chat.sendMessage({ message: newMessage });
    const responseText = result.text;

    // Parse JSON block for visualization
    const jsonMatch = responseText?.match(/```json\n([\s\S]*?)\n```/);
    let visualization: VisualizationTag | undefined;
    let cleanText = responseText || "";

    if (jsonMatch && jsonMatch[1]) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (data.suggestedVisualization) {
          visualization = data.suggestedVisualization;
        }
        // Remove the JSON block from the displayed text
        cleanText = responseText?.replace(/```json\n[\s\S]*?\n```/, '').trim() || "";
      } catch (e) {
        console.error("Failed to parse AI suggestion JSON", e);
      }
    }

    return {
      text: cleanText,
      visualization
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "I encountered an error connecting to the analysis engine. Please try again.",
    };
  }
};