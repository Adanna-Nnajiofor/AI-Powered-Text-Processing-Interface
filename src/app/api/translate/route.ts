import { NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY!;

// Allowed languages for translation
const SUPPORTED_LANGUAGES = ["en", "pt", "es", "ru", "tr", "fr"];

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json();

    // Validate input
    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Text and target language are required" },
        { status: 400 }
      );
    }

    //  Validate supported languages
    if (!SUPPORTED_LANGUAGES.includes(targetLang)) {
      return NextResponse.json(
        { error: `Unsupported target language: ${targetLang}` },
        { status: 400 }
      );
    }

    // ✅ Call translation function
    const translatedText = await translateText(text, targetLang);

    return NextResponse.json({ translation: translatedText });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
}

// Function to call Hugging Face Translation API (M2M-100)
const translateText = async (text: string, targetLang: string) => {
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
          parameters: { tgt_lang: targetLang },
        }),
      }
    );

    // Parse response
    const data = await response.json();
    console.log("Hugging Face API Response:", data);

    // Handle API errors
    if (!response.ok) {
      throw new Error(`API Error: ${data.error || "Unknown error"}`);
    }

    // Validate response structure
    if (!data || typeof data !== "object" || !data.translation_text) {
      throw new Error("Invalid translation response format");
    }

    return data.translation_text;
  } catch (error) {
    console.error("Translation API error:", error);
    throw new Error("Translation failed");
  }
};
