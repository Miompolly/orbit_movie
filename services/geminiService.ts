import { GoogleGenAI, Type } from "@google/genai";
import { Movie } from "../types";
import { api } from "./movieService";

// Initialize Gemini
// NOTE: In a real app, ensure process.env.API_KEY is defined. 
// If it's undefined, the SDK will throw, which we handle gracefully in the UI.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAIRecommendations = async (userQuery: string): Promise<{ text: string; recommendedIds: number[] }> => {
  try {
    if (!process.env.API_KEY) {
      return {
        text: "I'm sorry, I can't connect to the AI mainframe (API Key missing). However, try checking out our Trending section!",
        recommendedIds: []
      };
    }

    // We pass the movie catalog summary to the model so it knows what we "have"
    // To save tokens, we just pass IDs and Titles + Genres
    const movies = await api.fetchMovies();
    const catalogContext = movies.map(m => `ID:${m.id} | Title:${m.title} | Genres:${m.genre.join(', ')} | Desc:${m.description.substring(0, 50)}...`).join('\n');

    const prompt = `
      You are a smart movie recommendation assistant for 'MovieExchange'.
      User Query: "${userQuery}"

      Here is our current catalog:
      ${catalogContext}

      Recommend up to 3 movies from the catalog that best match the user's query.
      If the user just wants to chat, be witty and crypto-themed (use terms like 'bullish on this movie', 'to the moon', 'HODL this thought').
      
      Return JSON format:
      {
        "responseText": "Your conversational response here...",
        "movieIds": [id1, id2, id3]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            responseText: { type: Type.STRING },
            movieIds: { 
              type: Type.ARRAY,
              items: { type: Type.INTEGER }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const result = JSON.parse(jsonText);
    return {
      text: result.responseText,
      recommendedIds: result.movieIds || []
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      text: "Connection disrupted. The blockchain is congested. Try again later.",
      recommendedIds: []
    };
  }
};
