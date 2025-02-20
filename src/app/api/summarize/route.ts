import { NextResponse } from "next/server";

const SUMMARIZE_TOKEN = process.env.NEXT_PUBLIC_ORIGIN_TRIAL_SUMMARIZE!;

// ✅ Define Types for Summarizer API
interface SummarizerAPI {
  capabilities(): Promise<{ available: "no" | "readily" | "needs-download" }>;
  create(options: SummarizerOptions): Promise<Summarizer>;
}

interface SummarizerOptions {
  sharedContext: string;
  type: "key-points" | "paragraph";
  format: "markdown" | "text";
  length: "short" | "medium" | "long";
}

interface Summarizer {
  ready?: Promise<void>;
  summarize(text: string, options?: { context: string }): Promise<string>;
  addEventListener(
    event: "downloadprogress",
    listener: (event: ProgressEvent) => void
  ): void;
}

export async function POST(request: Request) {
  try {
    const { text }: { text: string } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // ✅ Step 1: Check if AI Summarizer API is available
    const globalAI = globalThis as unknown as {
      ai?: { summarizer?: SummarizerAPI };
    };

    const summarizerAPI = globalAI.ai?.summarizer;
    if (!summarizerAPI) {
      return NextResponse.json(
        { error: "Summarizer API is not available in this browser." },
        { status: 500 }
      );
    }

    const capabilities = await summarizerAPI.capabilities();
    if (capabilities.available === "no") {
      return NextResponse.json(
        { error: "Summarization is not supported in this browser." },
        { status: 500 }
      );
    }

    // ✅ Step 2: Set Summarization Options
    const options: SummarizerOptions = {
      sharedContext: "This is a general text input.",
      type: "key-points",
      format: "markdown",
      length: "medium",
    };

    let summarizer: Summarizer;
    if (capabilities.available === "readily") {
      summarizer = await summarizerAPI.create(options);
    } else {
      summarizer = await summarizerAPI.create(options);
      summarizer.addEventListener("downloadprogress", (e: ProgressEvent) => {
        console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
      });
      await summarizer.ready;
    }

    // ✅ Step 3: Perform Summarization
    const summary: string = await summarizer.summarize(text, {
      context: "This is a user-submitted text requiring summarization.",
    });

    const response = NextResponse.json({ summary });
    response.headers.set("Origin-Trial", SUMMARIZE_TOKEN);
    return response;
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: "Failed to summarize text." },
      { status: 500 }
    );
  }
}
