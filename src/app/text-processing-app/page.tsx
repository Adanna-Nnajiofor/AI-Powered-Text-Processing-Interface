"use client";
import { useState, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";

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
      const response = await fetch("/api/detect-language", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      return data.language || "Unknown";
    } catch {
      console.error("Language detection error");
      return "Unknown";
    }
  };

  const summarizeText = async (index: number) => {
    setLoading(true);
    try {
      const message = messages[index];
      if (message.text.length <= 150 || message.language !== "English") return;
      const response = await fetch("/api/summarize", {
        method: "POST",
        body: JSON.stringify({ text: message.text }),
      });
      const data = await response.json();
      message.summary = data.summary;
      setMessages([...messages]);
    } catch {
      setError("Failed to summarize text.");
    }
    setLoading(false);
  };

  const translateText = async (index: number) => {
    setLoading(true);
    try {
      const message = messages[index];
      const response = await fetch("/api/translate", {
        method: "POST",
        body: JSON.stringify({ text: message.text, targetLang: selectedLang }),
      });
      const data = await response.json();
      message.translation = data.translation;
      setMessages([...messages]);
    } catch {
      setError("Failed to translate text.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4 bg-gray-100">
      {/* Error Message */}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* Output Area */}
      <div
        className="flex-grow overflow-y-auto border p-4 bg-white rounded-md"
        aria-live="polite"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className="mb-4 p-2 bg-gray-200 rounded-md"
            tabIndex={-1}
            ref={index === messages.length - 1 ? lastMessageRef : null}
          >
            <p className="text-gray-800">{msg.text}</p>
            <p className="text-sm text-gray-500">Language: {msg.language}</p>
            {msg.text.length > 150 && msg.language === "English" && (
              <button
                type="button"
                className="text-blue-500 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => summarizeText(index)}
              >
                Summarize
              </button>
            )}
            <div className="mt-2">
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
                className="ml-2 text-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                onClick={() => translateText(index)}
              >
                Translate
              </button>
            </div>
            {msg.summary && (
              <p className="text-sm mt-2 text-blue-600">
                Summary: {msg.summary}
              </p>
            )}
            {msg.translation && (
              <p className="text-sm mt-2 text-green-600">
                Translation: {msg.translation}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="mt-4 flex items-center border p-2 bg-white rounded-md">
        <textarea
          className="flex-grow p-2 outline-none focus:ring-2 focus:ring-blue-500"
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
