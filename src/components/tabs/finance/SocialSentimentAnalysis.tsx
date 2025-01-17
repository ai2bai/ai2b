import React, { useState } from "react";
import { TabItemProps } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Loader2,
  AlertTriangle,
  TrendingUp,
  Twitter,
  MessageCircle,
  Search,
  BarChart2,
} from "lucide-react";

interface SentimentData {
  sentiment_score: number;
  volume: number;
  top_mentions: Array<{
    text: string;
    likes?: number;
    retweets?: number;
    upvotes?: number;
    sentiment: "positive" | "neutral" | "negative";
  }>;
  related_topics: Array<{
    topic: string;
    count: number;
    sentiment: number;
  }>;
}

interface TimeseriesData {
  timestamp: string;
  twitter_sentiment: number;
  reddit_sentiment: number;
  volume: number;
}

const generateTimeseriesData = (): TimeseriesData[] => {
  const data: TimeseriesData[] = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(
      now.getTime() - i * 60 * 60 * 1000
    ).toISOString();
    data.push({
      timestamp,
      twitter_sentiment: Math.random() * 2 - 1,
      reddit_sentiment: Math.random() * 2 - 1,
      volume: Math.floor(Math.random() * 1000),
    });
  }
  return data;
};

const SocialSentimentAnalysis: React.FC<TabItemProps> = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentimentData, setSentimentData] = useState<{
    twitter: SentimentData | null;
    reddit: SentimentData | null;
    timeseriesData: TimeseriesData[];
  }>({
    twitter: null,
    reddit: null,
    timeseriesData: [],
  });

  const getSentimentColor = (score: number): string => {
    if (score > 0.5) return "text-green-500";
    if (score < -0.5) return "text-red-500";
    return "text-yellow-500";
  };

  const getPlatformColor = (platform: "twitter" | "reddit"): string => {
    return platform === "twitter" ? "#1DA1F2" : "#FF4500";
  };

  const analyzeSocialSentiment = async () => {
    if (!searchTerm.trim()) {
      setError("Please enter a token symbol or topic to analyze");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const gptResponse = await fetch(
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
                content:
                  "You are a crypto social media sentiment analyst. You must return analysis in valid JSON format.",
              },
              {
                role: "user",
                content: `Analyze social sentiment for ${searchTerm} in crypto communities and return a JSON object exactly matching this structure:
{
  "twitter": {
    "sentiment_score": number between -1 and 1,
    "volume": number,
    "top_mentions": [
      {
        "text": "string",
        "likes": number,
        "retweets": number,
        "sentiment": "positive" or "neutral" or "negative"
      }
    ],
    "related_topics": [
      {
        "topic": "string",
        "count": number,
        "sentiment": number between -1 and 1
      }
    ]
  },
  "reddit": {
    "sentiment_score": number between -1 and 1,
    "volume": number,
    "top_mentions": [
      {
        "text": "string",
        "upvotes": number,
        "sentiment": "positive" or "neutral" or "negative"
      }
    ],
    "related_topics": [
      {
        "topic": "string",
        "count": number,
        "sentiment": number between -1 and 1
      }
    ]
  }
}`,
              },
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!gptResponse.ok) {
        throw new Error("GPT analysis failed");
      }

      const data = await gptResponse.json();
      let content = data.choices[0].message.content;

      // Clean up any potential markdown or non-JSON content
      content = content.replace(/```json\s?|\s?```/g, "").trim();

      try {
        const analysis = JSON.parse(content);
        setSentimentData({
          twitter: analysis.twitter,
          reddit: analysis.reddit,
          timeseriesData: generateTimeseriesData(),
        });
      } catch (parseError) {
        console.error("JSON Parse error:", parseError);
        throw new Error("Failed to parse sentiment analysis results");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to analyze sentiment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-bold flex items-center gap-2 text-[#B1B762]">
        <TrendingUp />
        Social Sentiment Analysis
      </h3>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter token symbol or topic (e.g., SOL, NFT, DeFi)"
            className="w-full p-2 pr-10 bg-black border border-[#B1B762] rounded font-mono text-sm text-white"
          />
          <Search
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <button
          className="bg-[#B1B762] text-black px-4 py-2 rounded hover:bg-opacity-80 flex items-center justify-center gap-2 w-full"
          onClick={analyzeSocialSentiment}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Analyzing Sentiment...
            </>
          ) : (
            <>
              <BarChart2 size={20} />
              Analyze Sentiment
            </>
          )}
        </button>
      </div>

      {sentimentData.timeseriesData.length > 0 && (
        <div className="space-y-6 text-[#B1B762]">
          {/* Sentiment Timeline */}
          <div className="h-96 border border-[#B1B762] rounded p-4">
            <h4 className="text-lg font-semibold mb-4">Sentiment Timeline</h4>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentimentData.timeseriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleTimeString()
                  }
                />
                <YAxis domain={[-1, 1]} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="twitter_sentiment"
                  stroke="#1DA1F2"
                  fill="#1DA1F2"
                  fillOpacity={0.2}
                  name="Twitter"
                />
                <Area
                  type="monotone"
                  dataKey="reddit_sentiment"
                  stroke="#FF4500"
                  fill="#FF4500"
                  fillOpacity={0.2}
                  name="Reddit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Analysis */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Twitter Analysis */}
            {sentimentData.twitter && (
              <div className="p-4 border border-[#B1B762] rounded">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Twitter className="text-[#1DA1F2]" />
                    Twitter Sentiment
                  </h4>
                  <div
                    className={`px-2 py-1 rounded text-sm ${getSentimentColor(
                      sentimentData.twitter.sentiment_score
                    )}`}
                  >
                    Score:{" "}
                    {(sentimentData.twitter.sentiment_score * 100).toFixed(1)}%
                  </div>
                </div>
                {sentimentData.twitter.top_mentions.map((mention, index) => (
                  <div
                    key={index}
                    className="p-2 border border-gray-700 rounded mb-2"
                  >
                    <p className="text-sm">{mention.text}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span>♥ {mention.likes}</span>
                      <span>🔄 {mention.retweets}</span>
                      <span
                        className={`${
                          mention.sentiment === "positive"
                            ? "text-green-500"
                            : mention.sentiment === "negative"
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`}
                      >
                        {mention.sentiment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reddit Analysis */}
            {sentimentData.reddit && (
              <div className="p-4 border border-[#B1B762] rounded">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <MessageCircle className="text-[#FF4500]" />
                    Reddit Sentiment
                  </h4>
                  <div
                    className={`px-2 py-1 rounded text-sm ${getSentimentColor(
                      sentimentData.reddit.sentiment_score
                    )}`}
                  >
                    Score:{" "}
                    {(sentimentData.reddit.sentiment_score * 100).toFixed(1)}%
                  </div>
                </div>
                {sentimentData.reddit.top_mentions.map((mention, index) => (
                  <div
                    key={index}
                    className="p-2 border border-gray-700 rounded mb-2"
                  >
                    <p className="text-sm">{mention.text}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span>⬆ {mention.upvotes}</span>
                      <span
                        className={`${
                          mention.sentiment === "positive"
                            ? "text-green-500"
                            : mention.sentiment === "negative"
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`}
                      >
                        {mention.sentiment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Topics */}
          <div className="p-4 border border-[#B1B762] rounded">
            <h4 className="text-lg font-semibold mb-4">Related Topics</h4>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ...(sentimentData.twitter?.related_topics || []),
                ...(sentimentData.reddit?.related_topics || []),
              ].map((topic, index) => (
                <div key={index} className="p-2 border border-gray-700 rounded">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{topic.topic}</div>
                    <div
                      className={`text-sm ${getSentimentColor(
                        topic.sentiment
                      )}`}
                    >
                      {(topic.sentiment * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Mentions: {topic.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialSentimentAnalysis;
