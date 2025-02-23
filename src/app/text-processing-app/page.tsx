"use client";
import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaMoon, FaSun } from "react-icons/fa";
import { motion } from "framer-motion";

interface Message {
  text: string;
  language: string;
  summary?: string;
  translation?: string;
}

const TextProcessingApp = () => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedLang, setSelectedLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastMessageRef = useRef<HTMLDivElement | null>(null);

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setError("");
    setLoading(true);

    const newMessage: Message = { text, language: "Detecting..." };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setText("");

    try {
      const detectedLanguage = await detectLanguage(text);

      // Update the last message instead of adding a new one
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[updatedMessages.length - 1] = {
          ...newMessage,
          language: detectedLanguage,
        };
        return updatedMessages;
      });

      setTimeout(() => lastMessageRef.current?.focus(), 100);
    } catch {
      setError("Failed to detect language. Try again.");
    }

    setLoading(false);
  };

  const detectLanguage = async (text: string) => {
    try {
      if (!window.ai?.languageDetector) {
        console.warn("Language Detector API is not available.");
        return "Unknown";
      }

      const languageDetectorCapabilities =
        await window.ai.languageDetector.capabilities();
      const canDetect = languageDetectorCapabilities.capabilities;

      let detector;
      if (canDetect === "no") {
        console.error("Language detector is not usable.");
        return "Unknown";
      }

      if (canDetect === "readily") {
        detector = await window.ai.languageDetector.create();
      } else {
        detector = await window.ai.languageDetector.create({
          monitor(m) {
            // Ensure `m` has the correct type
            if (m instanceof Event && "loaded" in m && "total" in m) {
              m.target?.addEventListener("progress", (e) => {
                const progressEvent = e as ProgressEvent;
                console.log(
                  `Downloaded ${progressEvent.loaded} of ${progressEvent.total} bytes.`
                );
              });
            }
          },
        });
        await detector.ready;
      }

      const results = await detector.detect(text);
      return results.length > 0 ? results[0].detectedLanguage : "Unknown";
    } catch (error) {
      console.error("Language detection error:", error);
      return "Unknown";
    }
  };

  const summarizeText = async (index: number) => {
    setLoading(true);
    setError("");

    try {
      const message = messages[index];

      if (message.text.length <= 150 || message.language !== "en") {
        setLoading(false);
        return;
      }

      // Ensure Summarizer API is available
      if (!window.ai?.summarizer) {
        setError("Summarizer API is not available.");
        setLoading(false);
        return;
      }

      const summarizerAPI = window.ai.summarizer;
      const { available } = await summarizerAPI.capabilities();

      if (available === "no") {
        setError("Summarizer API is not usable.");
        setLoading(false);
        return;
      }

      // Define Summarizer Options
      const options = {
        sharedContext: "General text summarization",
        type: "key-points",
        format: "plain-text",
        length: "medium",
      } as const;

      // Initialize Summarizer
      const summarizer = await summarizerAPI.create(options);

      // Wait for model to be ready
      await summarizer.ready;

      // ✅ Corrected Summarization Call
      let result = "";
      for await (const chunk of summarizer.summarize(message.text)) {
        result += chunk;
      }

      // Update message with summary
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[index] = { ...message, summary: result };
        return updatedMessages;
      });
    } catch (error) {
      console.error("Summarization error:", error);
      setError("Failed to summarize text.");
    }

    setLoading(false);
  };

  const translateText = async (index: number) => {
    setLoading(true);
    setError("");

    try {
      const message = messages[index];

      // Check if AI Translator API is available
      const aiTranslator = self.ai?.translator;
      if (!aiTranslator) {
        setError("Translator API is not available.");
        setLoading(false);
        return;
      }

      // Check if language pair is available
      const translatorCapabilities = await aiTranslator.capabilities();
      const available = translatorCapabilities.languagePairAvailable(
        "en",
        selectedLang
      );

      if (available === "no") {
        setError("Translation is not available for the selected language.");
        setLoading(false);
        return;
      }

      // Create the translator
      const translator = await aiTranslator.create({
        sourceLanguage: "en",
        targetLanguage: selectedLang,
      });

      if (!translator || typeof translator.translate !== "function") {
        setError("Translator initialization failed or method missing.");
        setLoading(false);
        return;
      }

      if (!translator) {
        setError("Translator initialization failed.");
        setLoading(false);
        return;
      }

      if (typeof translator.translate !== "function") {
        setError("Translation function is missing.");
        setLoading(false);
        return;
      }

      // 🔥 Fix: Accumulate async iterable output into a string
      let result = "";
      const translationOutput = await translator.translate(message.text);

      // If translationOutput is a string, no need to iterate
      if (typeof translationOutput === "string") {
        result = translationOutput;
      } else {
        for await (const chunk of translationOutput) {
          result += chunk;
        }
      }

      // Update the messages array
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[index] = { ...message, translation: result };
        return updatedMessages;
      });
    } catch (error) {
      console.error("Translation error:", error);
      setError("Failed to translate text.");
    }

    setLoading(false);
  };

  return (
    <div
      className={`flex flex-col h-screen max-w-2xl mx-auto p-4 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      {/* Header */}
      <header className="text-center mb-4">
        <h1 className="text-2xl font-bold">Multilingual Chat Application</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          A real-time chat interface with language translation, summarization
          and translation with dark mode.
        </p>
      </header>

      {/* Dark Mode Toggle */}
      <button
        type="button"
        className="self-end p-2 mb-2 bg-gray-300 dark:bg-gray-700 rounded-full"
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? (
          <FaSun className="text-yellow-500" />
        ) : (
          <FaMoon className="text-gray-800" />
        )}
      </button>

      {/* Error Message */}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* Output Area */}
      <div
        className="flex-grow overflow-y-auto border p-4 bg-white dark:bg-gray-800 rounded-md"
        aria-live="polite"
      >
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 p-2 bg-gray-200 dark:bg-gray-700 rounded-md"
            tabIndex={-1}
            ref={index === messages.length - 1 ? lastMessageRef : null}
          >
            <p className="text-gray-700 dark:text-gray-200 hover:text-gray-900">
              {msg.text}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-white bg-gray-600 dark:bg-gray-500 px-2 py-1 rounded-md inline-block mt-2 mr-4">
              Language: {msg.language}
            </p>
            {msg.text.length > 150 && msg.language === "en" && (
              <button
                type="button"
                className="mt-2 px-3 py-1 text-white font-semibold bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-md transition duration-300 ease-in-out shadow-md "
                onClick={() => summarizeText(index)}
              >
                🔍 Summarize
              </button>
            )}
            <div className="mt-2 gap-2">
              <select
                aria-label="Select language"
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="border rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="pt">Portuguese</option>
                <option value="es">Spanish</option>
                <option value="ru">Russian</option>
                <option value="tr">Turkish</option>
                <option value="fr">French</option>
              </select>
              <button
                type="button"
                className="ml-2 px-3 py-1 text-white font-semibold bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 rounded-md transition duration-300 ease-in-out shadow-md mr-4"
                onClick={() => translateText(index)}
              >
                🌍 Translate
              </button>
            </div>
            {msg.summary && (
              <p className="text-sm mt-4 text-blue-600">
                Summary: {msg.summary}
              </p>
            )}
            {msg.translation && (
              <p className="text-sm mt-4 text-green-600 hover:text-green-800">
                Translation: {msg.translation}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Input Area */}
      <div className="mt-4 flex items-center border p-2 bg-white dark:bg-gray-800 rounded-md">
        <textarea
          className="flex-grow p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your text here..."
          aria-label="Text input"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        />
        <button
          type="button"
          onClick={handleSend}
          className="ml-2 p-2 bg-blue-500 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          aria-label="Send message"
        >
          {loading ? "..." : <FaPaperPlane />}
        </button>
      </div>
    </div>
  );
};

export default TextProcessingApp;
