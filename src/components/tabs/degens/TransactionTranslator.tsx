import React, { useState } from "react";
import { TabItemProps } from "@/types";
import {
  Loader2,
  Search,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface TransactionAnalysis {
  summary: string;
  details: {
    type: string;
    description: string;
    impact: string;
  }[];
  programs: string[];
  risk_assessment: {
    level: "low" | "medium" | "high";
    warnings: string[];
  };
}

const TransactionTranslator: React.FC<TabItemProps> = () => {
  const [transactionId, setTransactionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<TransactionAnalysis | null>(null);

  const validateTransactionId = (id: string): boolean => {
    // Solana transaction signatures are typically base58 encoded and 88 characters long
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{88}$/;
    return base58Regex.test(id);
  };

  const analyzeTransaction = async () => {
    if (!validateTransactionId(transactionId)) {
      setError("Please enter a valid Solana transaction signature");
      return;
    }

    setIsLoading(true);
    setError("");
    setAnalysis(null);

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
                content:
                  "You are a Solana blockchain expert who explains transactions in simple terms. Provide analysis in the specified JSON format only.",
              },
              {
                role: "user",
                content: `Analyze this Solana transaction: ${transactionId}
              
              Explain what the transaction does, its purpose, and any potential risks.
              Return the analysis in this exact JSON format:
              {
                "summary": "Brief overview of what the transaction does",
                "details": [
                  {
                    "type": "category of action",
                    "description": "detailed explanation",
                    "impact": "what this means for the user"
                  }
                ],
                "programs": ["list of programs involved"],
                "risk_assessment": {
                  "level": "low/medium/high",
                  "warnings": ["list of potential risks"]
                }
              }`,
              },
            ],
            temperature: 0.5,
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze transaction");
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      setAnalysis(result);
    } catch (err) {
      console.error("Analysis error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to analyze transaction"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <RefreshCw className="text-[#B1B762]" />
        Solana Transaction Translator
      </h3>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter Solana transaction signature"
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
          className="bg-[#B1B762] text-white px-4 py-2 rounded hover:bg-opacity-80 flex items-center justify-center gap-2 w-full"
          onClick={analyzeTransaction}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Analyzing Transaction...
            </>
          ) : (
            <>
              <ArrowRight size={20} />
              Translate Transaction
            </>
          )}
        </button>
      </div>

      {analysis && (
        <div className="space-y-6">
          <div className="p-4 border border-[#B1B762] rounded">
            <h4 className="text-lg font-semibold mb-2">Transaction Summary</h4>
            <p className="text-sm">{analysis.summary}</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Details</h4>
            {analysis.details.map((detail, index) => (
              <div key={index} className="p-4 border border-[#B1B762] rounded">
                <h5 className="font-semibold text-[#B1B762]">{detail.type}</h5>
                <p className="mt-2 text-sm">{detail.description}</p>
                <p className="mt-2 text-sm italic">Impact: {detail.impact}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border border-[#B1B762] rounded">
              <h4 className="font-semibold mb-2">Programs Involved</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {analysis.programs.map((program, index) => (
                  <li key={index}>{program}</li>
                ))}
              </ul>
            </div>

            <div
              className={`p-4 border rounded ${
                analysis.risk_assessment.level === "high"
                  ? "border-red-500 bg-red-500/10"
                  : analysis.risk_assessment.level === "medium"
                  ? "border-yellow-500 bg-yellow-500/10"
                  : "border-green-500 bg-green-500/10"
              }`}
            >
              <h4 className="font-semibold mb-2">Risk Assessment</h4>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    analysis.risk_assessment.level === "high"
                      ? "bg-red-500"
                      : analysis.risk_assessment.level === "medium"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                >
                  {analysis.risk_assessment.level.toUpperCase()} RISK
                </span>
              </div>
              {analysis.risk_assessment.warnings.length > 0 && (
                <ul className="list-disc list-inside text-sm space-y-1">
                  {analysis.risk_assessment.warnings.map((warning, index) => (
                    <li key={index} className="text-red-400">
                      {warning}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTranslator;
