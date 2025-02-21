export {};

declare global {
  interface Window {
    ai?: {
      languageDetector?: {
        capabilities: () => Promise<{ capabilities: string }>;
        create: (options?: { monitor?: (m: Event) => void }) => Promise<{
          detect: (
            text: string
          ) => Promise<{ detectedLanguage: string; confidence: number }[]>;
          ready?: Promise<void>;
        }>;
      };
      summarizer?: {
        capabilities: () => Promise<{ available: "yes" | "no" | "readily" }>;
        create: (options: SummarizerOptions) => Promise<{
          ready?: Promise<void>;
          summarize: (text: string) => AsyncIterable<string>;
        }>;
      };
      translator?: {
        capabilities: () => Promise<{
          languagePairAvailable: (from: string, to: string) => string;
        }>;
        create: (options: {
          sourceLanguage: string;
          targetLanguage: string;
          monitor?: (m: Event) => void; // Use Event instead of any
        }) => Promise<{
          ready?: Promise<void>;
          translate: (text: string) => AsyncIterable<string>;
        }>;
      };
    };
  }
}

interface SummarizerOptions {
  sharedContext?: string;
  type?: "summary" | "paraphrase" | "key-points";
  format?: "plain-text" | "markdown";
  length?: "short" | "medium" | "long";
}
