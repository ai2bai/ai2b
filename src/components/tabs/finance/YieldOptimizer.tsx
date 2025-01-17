import React, { useState, useEffect } from "react";
import { TabItemProps } from "@/types";
import { Loader2, AlertTriangle, TrendingUp, Search } from "lucide-react";

interface Protocol {
  name: string;
  apy: number;
  tvl: number;
  token: string;
  chain: string;
  riskScore: number;
  lockPeriod: number;
  rewardTokens: string[];
}

const SYSTEM_PROMPT = `You are a Solana DeFi protocol and yield farming expert. Your task is to provide accurate, up-to-date information about Solana-based DeFi protocols, their yields, risks, and metrics.

Please provide the data in the following strict JSON format:
{
  "protocols": [
    {
      "name": string,
      "apy": number,
      "tvl": number,
      "token": string,
      "chain": "Solana",
      "riskScore": number (1-10),
      "lockPeriod": number (days),
      "rewardTokens": string[]
    }
  ]
}

Important guidelines:
1. Focus ONLY on Solana protocols like Raydium, Orca, Marinade, Jupiter, etc.
2. APY rates should be realistic for current Solana ecosystem
3. Risk scores should consider:
   - Protocol age and track record on Solana
   - Smart contract audits
   - Past security incidents
   - Complexity of protocol
4. TVL values must be current and realistic for Solana protocols
5. Include only active, verified Solana protocols
6. Return exactly 10 protocols
7. Values must be accurate and reflect current Solana market conditions`;

const USER_PROMPT = `Provide the current top 10 Solana DeFi yield farming and lending protocols with their latest metrics. Include:
1. Major Solana lending platforms
2. Leading Solana DEX protocols
3. Liquid staking solutions on Solana
4. Popular Solana yield aggregators
Make sure all numbers, especially APY and TVL, are realistic and current for the Solana ecosystem.`;

const YieldOptimizer: React.FC<TabItemProps> = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [filteredProtocols, setFilteredProtocols] = useState<Protocol[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProtocolData = async () => {
    try {
      setLoading(true);
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
                content: SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: USER_PROMPT,
              },
            ],
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const responseData = await response.json();

      if (!responseData.choices?.[0]?.message?.content) {
        throw new Error("Invalid response format from GPT");
      }

      const content = responseData.choices[0].message.content;

      try {
        const parsedData = JSON.parse(content);

        if (!parsedData.protocols || !Array.isArray(parsedData.protocols)) {
          throw new Error("Invalid protocols data format");
        }

        const validProtocols = parsedData.protocols.map(
          (protocol: any): Protocol => ({
            name: String(protocol.name || ""),
            apy: Number(protocol.apy || 0),
            tvl: Number(protocol.tvl || 0),
            token: String(protocol.token || ""),
            chain: "Solana", // Always set to Solana
            riskScore: Number(protocol.riskScore || 5),
            lockPeriod: Number(protocol.lockPeriod || 0),
            rewardTokens: Array.isArray(protocol.rewardTokens)
              ? protocol.rewardTokens.map(String)
              : [],
          })
        );

        setProtocols(validProtocols);
        setFilteredProtocols(validProtocols);
      } catch (parseError) {
        console.error("Parse Error:", parseError);
        throw new Error("Failed to parse protocol data");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch protocol data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocolData();
    const interval = setInterval(fetchProtocolData, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = protocols.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.token.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProtocols(filtered);
    } else {
      setFilteredProtocols(protocols);
    }
  }, [protocols, searchTerm]);

  const formatTVL = (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  };

  const getRiskColor = (score: number): string => {
    if (score <= 3) return "text-green-500";
    if (score <= 6) return "text-yellow-500";
    return "text-red-500";
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-500 gap-2">
        <AlertTriangle size={24} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-[#B1B762]">
          <TrendingUp />
          Solana Yield Optimizer
        </h3>
      </div>
      <div className="flex flex-col justify-center items-center">
        <p
          className="text-8xl lg:text-9xl tracking-wider font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-16"
          style={{
            fontSize: "150px",
            fontWeight: 900,
            color: "#B1B762",
            textAlign: "center",
            lineHeight: "1",
            letterSpacing: "0.05em",
          }}
        >
          Coming Soon
        </p>
      </div>
    </div>
  );
};

export default YieldOptimizer;
