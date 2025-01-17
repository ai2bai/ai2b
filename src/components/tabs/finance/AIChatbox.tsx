import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const AIChatbox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem("market_chat_messages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      const scrollOptions = {
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth" as ScrollBehavior,
      };
      setTimeout(() => chatBoxRef.current?.scrollTo(scrollOptions), 100);
    }
  }, [messages, streamedResponse]);

  useEffect(() => {
    try {
      localStorage.setItem("market_chat_messages", JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save messages to localStorage:", error);
    }
  }, [messages]);

  const processStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder
  ) => {
    let finalContent = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line === "[DONE]") return finalContent;

          if (line.startsWith("data: ")) {
            try {
              const jsonString = line.replace("data: ", "").trim();
              const parsed = JSON.parse(jsonString);
              const content = parsed?.choices?.[0]?.delta?.content || "";
              finalContent += content;
              setStreamedResponse(finalContent);
            } catch (err) {
              console.warn("Skipping malformed JSON:", err);
            }
          }
        }
      }
      return finalContent;
    } catch (error) {
      throw new Error("Stream processing failed: " + error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are an AI assistant for AI2B - a comprehensive Web3 and DeFi analysis platform.
            
            Project Identity:
            - Name: AI2B (ai2b)
            - Motto: "2B or Not 2B"
            - Core Purpose: Providing advanced tools and insights for Web3 research, trading, and learning
            
            Platform Overview:
            AI2B is a sophisticated platform that combines blockchain analytics, financial tools, and educational resources, accessible through Solana-based wallet authentication (e.g., Phantom Wallet).
            
            Core Sections and Features:
            
            1. Research Hub - Advanced Analytics Tools:
               • Github Checker: Repository analysis and verification
               • Wallet Checker: Blockchain wallet analysis and tracking
               • Image Checker: Visual content analysis and verification
            
            2. Degen Zone - Trading Intelligence:
               • Trench Radar: Market movement analysis
               • KOLS Wallet Tracker: Key opinion leaders' wallet monitoring
               • AgentDeployment: Coming soon feature for automated trading strategies
            
            3. Financial Tools - DeFi Utilities:
               • AI Chatbox: Intelligent trading and analysis assistant
               • Market Sentiment Index: Real-time market mood tracking
               • Social Sentiment Analysis: Social media trend analysis
               • Yield Optimizer: DeFi yield strategy optimization
               • Bridge: Cross-chain transfer facilitator
               • Airdrop Tracker: Potential airdrop opportunity monitoring
            
            4. Learning Center - Educational Platform:
               • User Profiles: Personalized learning tracking
               • Leaderboards: Community engagement and achievements
            
            Authentication:
            Users connect and authenticate using Solana-compatible wallets like Phantom Wallet, ensuring secure and seamless access to platform features.
            
            As an AI assistant, you should:
            - Provide expert insights across all platform features
            - Understand and explain the interconnection between different tools
            - Help users navigate between sections based on their needs
            - Maintain awareness of both basic and advanced platform functionalities
            - Guide users in maximizing the platform's potential for their Web3 journey
            
            Remember: Your responses should align with AI2B's mission of empowering users in the Web3 space through comprehensive tools and analysis.`,
              },
              ...messages.map(({ role, content }) => ({ role, content })),
              { role: userMessage.role, content: userMessage.content },
            ],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body available");

      const finalContent = await processStream(reader, new TextDecoder());

      const assistantMessage: Message = {
        role: "assistant",
        content: finalContent,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      console.error("Chat completion error:", error);
    } finally {
      setIsLoading(false);
      setStreamedResponse("");
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-bold text-[#B1B762]">
        AI Chatbox: Market Speculation and Analysis
      </h3>

      <div
        className="p-4 rounded h-64 overflow-y-auto border border-[#B1B762]"
        ref={chatBoxRef}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.timestamp}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-4 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`p-2 inline-block rounded ${
                  message.role === "user"
                    ? "bg-[#B1B762] text-black"
                    : "border border-[#B1B762] text-[#B1B762]"
                }`}
              >
                {message.content}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-left"
            >
              <div className="p-2 inline-block rounded border border-[#B1B762] text-[#B1B762]">
                {streamedResponse || "..."}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about market trends..."
          className="flex-1 p-2 bg-black border border-[#B1B762] rounded text-white"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="bg-[#B1B762] text-black px-4 py-2 rounded hover:bg-opacity-80 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default AIChatbox;
