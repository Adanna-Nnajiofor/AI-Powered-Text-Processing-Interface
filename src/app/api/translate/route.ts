import { NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY!;
const TRANSLATE_TOKEN = process.env.NEXT_PUBLIC_ORIGIN_TRIAL_TRANSLATE!;

export async function POST(request: Request) {
  try {
    const { text, sourceLang, targetLang } = await request.json();

    // Validate input
    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: "Text, source language, and target language are required" },
        { status: 400 }
      );
    }

    // Call the translation function dynamically
    const translatedText = await translateText(text, sourceLang, targetLang);

    // Create response and add Origin-Trial token
    const response = NextResponse.json({ translation: translatedText });
    response.headers.set("Origin-Trial", TRANSLATE_TOKEN);

    return response;
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}

// Function to translate text using Hugging Face API
const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
) => {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/m2m100_418M",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          parameters: { src_lang: sourceLang, tgt_lang: targetLang },
        }),
      }
    );

    // Parse response
    const data = await response.json();
    console.log("Hugging Face API Response:", data);

    // Handle errors
    if (!response.ok) {
      throw new Error(`API Error: ${data.error || "Unknown error"}`);
    }

    // Ensure response contains valid translation
    if (!data || typeof data !== "object" || !data.translation_text) {
      throw new Error("Invalid translation response format");
    }

    return data.translation_text;
  } catch (error) {
    console.error("Translation API error:", error);
    throw new Error("Translation failed");
  }
};
