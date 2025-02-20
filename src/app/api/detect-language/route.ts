import { NextResponse } from "next/server";

const DETECT_TOKEN = process.env.NEXT_PUBLIC_ORIGIN_TRIAL_DETECT_LANGUAGE!;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const response = NextResponse.json({
      message: `Language detection for: ${text}`,
    });

    response.headers.set("Origin-Trial", DETECT_TOKEN);
    return response;
  } catch (error) {
    console.error("Language detection error:", error);

    return NextResponse.json(
      { error: "Failed to detect language" },
      { status: 500 }
    );
  }
}
