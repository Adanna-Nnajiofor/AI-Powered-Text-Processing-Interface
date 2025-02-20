import { NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

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

    // Placeholder for translation logic (Replace with your new translation service)
    const translatedText = `Translated text from ${sourceLang} to ${targetLang}: ${text}`;

    // Create response and add Origin-Trial token
    const response = NextResponse.json({ translation: translatedText });
    response.headers.set("Origin-Trial", TRANSLATE_TOKEN);

    return response;
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
