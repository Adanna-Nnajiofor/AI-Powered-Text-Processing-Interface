import { NextResponse } from "next/server";

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY!;
const DETECT_TOKEN = process.env.NEXT_PUBLIC_ORIGIN_TRIAL_DETECT_LANGUAGE!;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const detectedLanguage = await detectLanguage(text);

    const response = NextResponse.json({ language: detectedLanguage });
    response.headers.set("Origin-Trial", DETECT_TOKEN);

    return response;
  } catch (error) {
    const errMessage = (error as Error).message || "Failed to detect language";
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

// Hugging Face API call
const detectLanguage = async (text: string) => {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/papluca/xlm-roberta-base-language-detection",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    }
  );

  const data = await response.json();
  if (!response.ok || !Array.isArray(data) || data.length === 0) {
    throw new Error("Language detection failed");
  }

  return data[0].label || "Unknown";
};
