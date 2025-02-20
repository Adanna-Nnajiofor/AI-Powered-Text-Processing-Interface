import { NextResponse } from "next/server";

const TRANSLATE_TOKEN = process.env.NEXT_PUBLIC_ORIGIN_TRIAL_TRANSLATE!;

// Define AI Translator Types
interface TranslatorCapabilities {
  languagePairAvailable: (
    source: string,
    target: string
  ) => "yes" | "no" | "after-download";
}

interface Translator {
  translate: (text: string) => Promise<string>;
  ready?: Promise<void>;
}

interface TranslatorAPI {
  capabilities: () => Promise<TranslatorCapabilities>;
  create: (options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (monitor: {
      addEventListener: (
        event: string,
        callback: (e: ProgressEvent) => void
      ) => void;
    }) => void;
  }) => Promise<Translator>;
}

interface GlobalAI {
  ai?: { translator?: TranslatorAPI };
}

export async function POST(request: Request) {
  try {
    const { text, sourceLanguage, targetLanguage } = await request.json();

    // Validate input
    if (!text || !sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: "Text, sourceLanguage, and targetLanguage are required." },
        { status: 400 }
      );
    }

    // ✅ Step 1: Check AI Translator API Availability
    const globalAI = globalThis as unknown as GlobalAI;
    const translatorAPI = globalAI.ai?.translator;

    if (!translatorAPI) {
      return NextResponse.json(
        { error: "Translator API is not available in this browser." },
        { status: 500 }
      );
    }

    // ✅ Step 2: Check if Language Pair is Available
    const translatorCapabilities = await translatorAPI.capabilities();
    const availability = translatorCapabilities.languagePairAvailable(
      sourceLanguage,
      targetLanguage
    );

    if (availability === "no") {
      return NextResponse.json(
        {
          error: `Translation from ${sourceLanguage} to ${targetLanguage} is not supported.`,
        },
        { status: 500 }
      );
    }

    // ✅ Step 3: Create Translator
    const translator = await translatorAPI.create({
      sourceLanguage,
      targetLanguage,
      monitor: (monitor) => {
        monitor.addEventListener("downloadprogress", (e: ProgressEvent) => {
          console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
        });
      },
    });

    // Wait for model download if needed
    if (availability === "after-download") {
      await translator.ready;
    }

    // ✅ Step 4: Perform Translation
    const translatedText = await translator.translate(text);

    // ✅ Step 5: Attach Origin-Trial Header & Send Response
    const response = NextResponse.json({ translatedText });
    response.headers.set("Origin-Trial", TRANSLATE_TOKEN);

    return response;
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate text." },
      { status: 500 }
    );
  }
}
