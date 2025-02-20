import { NextResponse } from "next/server";

const SUMMARIZE_TOKEN = process.env.NEXT_PUBLIC_ORIGIN_TRIAL_SUMMARIZE!;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Dummy response since Hugging Face API is removed
    const summary = "Summarization is handled by Origin Trial.";

    const response = NextResponse.json({ summary });
    response.headers.set("Origin-Trial", SUMMARIZE_TOKEN);

    return response;
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Summarization failed";

    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
