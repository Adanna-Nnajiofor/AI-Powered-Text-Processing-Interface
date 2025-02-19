import { NextResponse } from "next/server";

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY!;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    // Call the detectLanguage function
    const detectedLanguage = await detectLanguage(text);

    return NextResponse.json({ language: detectedLanguage });
  } catch (error) {
    const errMessage = (error as Error).message || "Failed to detect language";
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

// Function to detect language using Hugging Face API
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
  console.log("Hugging Face API Response:", data);

  if (!response.ok || !Array.isArray(data) || data.length === 0) {
    throw new Error("Language detection failed");
  }

  return data[0].label || "Unknown"; // Returns detected language code
};
