import { NextResponse } from "next/server";

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY!;
const SUMMARIZE_TOKEN = process.env.NEXT_PUBLIC_ORIGIN_TRIAL_SUMMARIZE!;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const summary = await summarizeText(text);

    const response = NextResponse.json({ summary });
    response.headers.set("Origin-Trial", SUMMARIZE_TOKEN);

    return response;
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Summarization failed";

    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

// Function to call Hugging Face API for text summarization
const summarizeText = async (text: string) => {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    }
  );

  if (!response.ok) {
    throw new Error("Text summarization failed");
  }

  const data = await response.json();
  console.log("Summarized Text:", data);

  return data?.[0]?.summary_text || "No summary available";
};
