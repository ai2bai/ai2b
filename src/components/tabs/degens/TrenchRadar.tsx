import React, { useState } from "react";
import { Loader2, Search, Shield, AlertTriangle } from "lucide-react";

interface DexTokenData {
  name: string;
  symbol: string;
  price: number;
  liquidityUSD: number;
  volume24h: number;
  priceChange24h: number;
}

interface ContractAnalysis {
  name: string;
  address: string;
  metrics: {
    security: number;
    reliability: number;
    performance: number;
    maintainability: number;
    transparency: number;
  };
  audit_findings: {
    description: string;
    severity: "low" | "medium" | "high";
    impact: string;
    recommendation: string;
  }[];
  vulnerabilities: {
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
    location?: string;
  }[];
  code_quality: {
    score: number;
    issues: {
      type: string;
      description: string;
      severity: "low" | "medium" | "high";
    }[];
  };
}

const TrenchRadar: React.FC = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [tokenData, setTokenData] = useState<DexTokenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);

  const validateContractAddress = (address: string): boolean => {
    return address.length > 0;
  };

  const fetchTokenData = async (address: string) => {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/search?q=${address}`
      );
      if (!response.ok) throw new Error("Failed to fetch token data.");

      const data = await response.json();
      if (!data.pairs || data.pairs.length === 0)
        throw new Error("Token not found.");

      const token = data.pairs[0];
      return {
        name: token.baseToken.name,
        symbol: token.baseToken.symbol,
        price: parseFloat(token.priceUsd),
        liquidityUSD: parseFloat(token.liquidity.usd),
        volume24h: parseFloat(token.volume.h24),
        priceChange24h: parseFloat(token.priceChange.h24),
      } as DexTokenData;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const fetchAnalysis = async () => {
    if (!validateContractAddress(contractAddress)) {
      setError("Please enter a valid Solana contract address");
      return;
    }

    setIsLoading(true);
    setError("");
    setAnalysis(null);
    setTokenData(null);

    try {
      // Fetch token data from Dexscreener
      const tokenData = await fetchTokenData(contractAddress);
      setTokenData(tokenData);

      // Fetch contract analysis from OpenAI
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
                content: `
                You are a blockchain expert. Analyze the provided Solana contract address and return a detailed JSON response. 
                The JSON should include:
                - "name": Name of the contract.
                - "address": The contract address.
                - "metrics": An object with "security", "reliability", "performance", "maintainability", and "transparency" (scores from 0-100).
                - "audit_findings": An array of findings, each with "description", "severity" (low, medium, high), "impact", and "recommendation".
                - "vulnerabilities": An array of vulnerabilities, each with "type", "description", "severity", and "location" (optional).
                - "code_quality": An object with "score" (0-100) and "issues" (array of "type", "description", "severity").
              `,
              },
              {
                role: "user",
                content: `Analyze this Solana contract: ${contractAddress}`,
              },
            ],
            temperature: 0.5,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to analyze the contract");

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-bold flex items-center gap-2 text-[#B1B762]">
        <Shield/>
        Solana Contract Radar
      </h3>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="Enter Solana contract address"
            className="w-full p-2 pr-10 bg-black border border-[#B1B762] rounded font-mono text-sm"
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
          onClick={fetchAnalysis}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Fetching Data...
            </>
          ) : (
            <>
              <Search size={20} />
              Analyze Contract
            </>
          )}
        </button>
      </div>

      {tokenData && (
        <div className="space-y-6">
          <div className="p-4 border border-[#B1B762] rounded">
            <h4 className="text-lg font-semibold">Token Information</h4>
            <p className="text-sm">Name: {tokenData.name}</p>
            <p className="text-sm">Symbol: {tokenData.symbol}</p>
            <p className="text-sm">Price: ${tokenData.price.toFixed(2)}</p>
            <p className="text-sm">
              Liquidity: ${tokenData.liquidityUSD.toLocaleString()}
            </p>
            <p className="text-sm">
              24h Volume: ${tokenData.volume24h.toLocaleString()}
            </p>
            <p
              className={`text-sm ${
                tokenData.priceChange24h >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              24h Change: {tokenData.priceChange24h.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <div className="p-4 border border-[#B1B762] rounded">
            <h4 className="text-lg font-semibold">Contract Analysis</h4>
            <p className="text-sm">Name: {analysis.name}</p>
            <p className="text-sm">Address: {analysis.address}</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(analysis.metrics).map(([key, value], index) => (
                <div
                  key={index}
                  className="p-4 border border-[#B1B762] rounded"
                >
                  <h5 className="font-semibold text-[#B1B762] capitalize">
                    {key}
                  </h5>
                  <p className="mt-2 text-sm">Score: {value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Audit Findings</h4>
            {analysis.audit_findings.map((finding, index) => (
              <div key={index} className="p-4 border border-[#B1B762] rounded">
                <h5 className="font-semibold text-[#B1B762]">
                  {finding.severity.toUpperCase()} Finding
                </h5>
                <p className="mt-2 text-sm">{finding.description}</p>
                <p className="mt-2 text-sm italic">Impact: {finding.impact}</p>
                <p className="mt-2 text-sm italic">
                  Recommendation: {finding.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrenchRadar;
