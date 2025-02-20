import { NextResponse } from "next/server";

const DETECT_TOKEN = process.env.NEXT_PUBLIC_ORIGIN_TRIAL_DETECT_LANGUAGE!;

// ✅ Define Types for Language Detection API
interface LanguageDetectorAPI {
  capabilities(): Promise<{
    capabilities: "no" | "readily" | "needs-download";
  }>;
  create(options?: {
    monitor?: (monitor: LanguageDetectorMonitor) => void;
  }): Promise<LanguageDetector>;
}

interface LanguageDetectorMonitor {
  addEventListener(
    event: "downloadprogress",
    listener: (event: ProgressEvent) => void
  ): void;
}

interface LanguageDetector {
  ready?: Promise<void>;
  detect(text: string): Promise<LanguageDetectionResult[]>;
}

interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
}

export async function POST(request: Request) {
  try {
    const { text }: { text: string } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // ✅ Step 1: Check if AI API and Language Detector are available
    const globalAI = globalThis as unknown as {
      ai?: { languageDetector?: LanguageDetectorAPI };
    };

    if (!globalAI.ai || !globalAI.ai.languageDetector) {
      console.error("Language Detector API is not available in this browser.");
      return NextResponse.json(
        { error: "Language detection API not available" },
        { status: 500 }
      );
    }

    const languageDetectorAPI = globalAI.ai.languageDetector;

    // ✅ Step 2: Check the language detector capabilities
    const capabilities = await languageDetectorAPI.capabilities();
    console.log("Language Detector Capabilities:", capabilities);

    if (capabilities.capabilities === "no") {
      console.error("Language Detector API is not usable on this browser.");
      return NextResponse.json(
        { error: "Language detection not supported" },
        { status: 500 }
      );
    }

    // ✅ Step 3: Initialize the detector
    let detector: LanguageDetector;
    if (capabilities.capabilities === "readily") {
      detector = await languageDetectorAPI.create();
    } else {
      detector = await languageDetectorAPI.create({
        monitor(monitor: LanguageDetectorMonitor) {
          monitor.addEventListener("downloadprogress", (e: ProgressEvent) => {
            console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
          });
        },
      });

      console.log("Waiting for the model to be ready...");
      await detector.ready;
    }

    // ✅ Step 4: Run Language Detection
    const results: LanguageDetectionResult[] = await detector.detect(text);
    console.log("Detection Results:", results);

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: "Language could not be detected" },
        { status: 500 }
      );
    }

    // ✅ Step 5: Get the most confident detected language
    const { detectedLanguage, confidence } = results[0];
    console.log(
      `Detected Language: ${detectedLanguage} (Confidence: ${confidence})`
    );

    const response = NextResponse.json({
      language: detectedLanguage,
      confidence,
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
