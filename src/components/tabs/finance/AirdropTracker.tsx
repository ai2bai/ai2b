import React, { useState, useEffect } from "react";
import { TabItemProps } from "@/types";
import {
  Loader2,
  AlertTriangle,
  Gift,
  Search,
  Calendar,
  Timer,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";

interface Airdrop {
  projectName: string;
  tokenSymbol: string;
  status: "upcoming" | "active" | "ended";
  startDate: string;
  endDate: string;
  estimatedValue: string;
  eligibility: {
    requirements: string[];
    minimumHolding?: string;
    minimumTransactions?: number;
    networks: string[];
  };
  projectDescription: string;
  registrationUrl: string;
  totalAllocation: string;
  distribution: string;
}

const SYSTEM_PROMPT = `You are a cryptocurrency airdrop tracking expert for the year 2025. Return ONLY valid JSON with predicted upcoming and active airdrops for 2025.

The JSON must have this exact structure for CURRENT AND FUTURE airdrops only:
{
  "airdrops": [
    {
      "projectName": "string",
      "tokenSymbol": "string",
      "status": "upcoming" | "active" | "ended",
      "startDate": "2025-MM-DD",
      "endDate": "2025-MM-DD",
      "estimatedValue": "string",
      "eligibility": {
        "requirements": ["string"],
        "minimumHolding": "string",
        "minimumTransactions": number,
        "networks": ["Solana"]
      },
      "projectDescription": "string",
      "registrationUrl": "string",
      "totalAllocation": "string",
      "distribution": "string"
    }
  ]
}

Important Rules:
- ONLY include airdrops from 2025, with dates starting from January 2025 onwards
- Focus ONLY on projects and protocols built on the Solana blockchain
- Include realistic upcoming innovations, such as Solana DeFi platforms, AI-integrated Solana projects, or Solana-based modular solutions
- All values should reflect 2025 market conditions
- Include real trends within the Solana ecosystem, like high-speed DeFi, NFT integrations, and AI-enhanced Solana dApps`;

const USER_PROMPT = `List the current and upcoming cryptocurrency airdrops for 2025. Include ONLY:
1. Solana-based DeFi 3.0 protocols
2. AI-integrated platforms built on Solana
3. Modular or high-speed blockchain solutions on Solana
4. Solana-focused NFT or gaming platforms

Focus ONLY on projects and launches relevant to the Solana ecosystem in 2025, with realistic requirements and values for that timeframe.`;

const AirdropTracker: React.FC<TabItemProps> = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [filteredAirdrops, setFilteredAirdrops] = useState<Airdrop[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "upcoming" | "active" | "ended"
  >("all");

  const fetchAirdrops = async () => {
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
      console.log("GPT Response:", responseData);

      if (!responseData.choices?.[0]?.message?.content) {
        throw new Error("Invalid response format from GPT");
      }

      const content = responseData.choices[0].message.content;
      const parsedData = JSON.parse(content);

      if (!parsedData.airdrops || !Array.isArray(parsedData.airdrops)) {
        throw new Error("Invalid airdrops data format");
      }

      setAirdrops(parsedData.airdrops);
      setFilteredAirdrops(parsedData.airdrops);
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch airdrop data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirdrops();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAirdrops, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = airdrops;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((airdrop) => airdrop.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (airdrop) =>
          airdrop.projectName.toLowerCase().includes(search) ||
          airdrop.tokenSymbol.toLowerCase().includes(search)
      );
    }

    setFilteredAirdrops(filtered);
  }, [airdrops, statusFilter, searchTerm]);

  const checkWalletEligibility = async (airdrop: Airdrop) => {
    if (!walletAddress) {
      alert("Please enter a wallet address first");
      return;
    }
    // Here you would typically make an API call to check eligibility
    alert(
      `Checking eligibility for ${walletAddress} on ${airdrop.projectName}...`
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "text-yellow-500";
      case "active":
        return "text-green-500";
      case "ended":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#B1B762]" size={32} />
      </div>
    );
  }

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
          <Gift />
          Airdrop Tracker
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter wallet address to check eligibility..."
              className="w-full p-3 bg-black border border-[#B1B762] rounded text-white"
            />
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search airdrops..."
              className="w-full p-3 pl-10 bg-black border border-[#B1B762] rounded text-white"
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          </div>
        </div>

        <div className="flex gap-2">
          {(["all", "upcoming", "active", "ended"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded capitalize ${
                statusFilter === status
                  ? "bg-[#B1B762] text-black"
                  : "bg-black text-[#B1B762] border border-[#B1B762] hover:bg-gray-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAirdrops.map((airdrop, index) => (
          <div
            key={index}
            className="border border-[#B1B762] text-[#B1B762] rounded-lg p-4 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold">{airdrop.projectName}</h4>
                <span className="text-sm text-gray-400">
                  {airdrop.tokenSymbol}
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm capitalize ${getStatusColor(
                  airdrop.status
                )}`}
              >
                {airdrop.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Start Date</div>
                <div className="font-bold flex items-center gap-1">
                  <Calendar size={16} />
                  {airdrop.startDate}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">End Date</div>
                <div className="font-bold flex items-center gap-1">
                  <Timer size={16} />
                  {airdrop.endDate}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-400">
                Eligibility Requirements
              </div>
              <ul className="space-y-1">
                {airdrop.eligibility.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="text-green-500 mt-1" size={16} />
                    {req}
                  </li>
                ))}
                {airdrop.eligibility.minimumHolding && (
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="text-green-500 mt-1" size={16} />
                    Min. Holding: {airdrop.eligibility.minimumHolding}
                  </li>
                )}
                {airdrop.eligibility.minimumTransactions && (
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="text-green-500 mt-1" size={16} />
                    Min. Transactions: {airdrop.eligibility.minimumTransactions}
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-400">Supported Networks</div>
              <div className="flex flex-wrap gap-2">
                {airdrop.eligibility.networks.map((network, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-800 rounded-full text-xs"
                  >
                    {network}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-400">
                Allocation & Distribution
              </div>
              <div className="text-sm">
                <div>Total Allocation: {airdrop.totalAllocation}</div>
                <div>Distribution: {airdrop.distribution}</div>
                <div>Estimated Value: {airdrop.estimatedValue}</div>
              </div>
            </div>

            
          </div>
        ))}
      </div>

      {filteredAirdrops.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No airdrops found matching your criteria
        </div>
      )}
    </div>
  );
};

export default AirdropTracker;
