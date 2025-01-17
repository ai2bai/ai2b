import React, { useState, useEffect } from "react";
import { TabItemProps } from "@/types";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  score: number;
  lastActive: string;
  isVerified: boolean;
}

const Leaderboards: React.FC<TabItemProps> = () => {
  const { connection } = useConnection();
  const [searchWallet, setSearchWallet] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [sortConfig, setSortConfig] = useState<{
    key: keyof LeaderboardEntry;
    direction: "asc" | "desc";
  }>({ key: "rank", direction: "asc" });

  // Simulate fetching leaderboard data
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      // In a real application, this would be an API call
      const mockData: LeaderboardEntry[] = [
        {
          rank: 1,
          walletAddress: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH", // Binance Hot Wallet
          score: 2500000,
          lastActive: "2024-03-20",
          isVerified: true,
        },
        {
          rank: 2,
          walletAddress: "3uTzTX5GBSfbW7eM9R9k95H7Txe32Qw3Z25MtyD2dzwC", // FTX Estate Wallet
          score: 1800000,
          lastActive: "2024-03-20",
          isVerified: true,
        },
        {
          rank: 3,
          walletAddress: "CV7UxUwQD3qT8XkAQfwkNJ5jnJF2zzcHyWo2lamtp8w", // Solana Foundation
          score: 1500000,
          lastActive: "2024-03-20",
          isVerified: true,
        },
        {
          rank: 4,
          walletAddress: "StakeP9sorZoqwNNFSYNc5mdaeTLJqNBmWTr4pSt7TEJ", // Marinade Stake Pool
          score: 1200000,
          lastActive: "2024-03-19",
          isVerified: true,
        },
        {
          rank: 5,
          walletAddress: "8BdpX3dXzrkwxPS6NpP5wGj8XkqnqzeC4XVzBxD6B8mj", // Phantom Team Wallet
          score: 1000000,
          lastActive: "2024-03-19",
          isVerified: true,
        },
        {
          rank: 6,
          walletAddress: "EhYXq3ANp5nAerUpbSgd7VK2RRcxK1zNuSQ9Zh5zNy6C", // Magic Eden
          score: 950000,
          lastActive: "2024-03-19",
          isVerified: true,
        },
        {
          rank: 7,
          walletAddress: "JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo", // Jupiter Exchange
          score: 880000,
          lastActive: "2024-03-18",
          isVerified: true,
        },
        {
          rank: 8,
          walletAddress: "DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1", // Orca Protocol
          score: 820000,
          lastActive: "2024-03-18",
          isVerified: true,
        },
        {
          rank: 9,
          walletAddress: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", // Marinade Finance
          score: 750000,
          lastActive: "2024-03-18",
          isVerified: true,
        },
        {
          rank: 10,
          walletAddress: "RaydiumPooling1111111111111111111111111111111", // Raydium Protocol
          score: 700000,
          lastActive: "2024-03-17",
          isVerified: true,
        },
      ];
      setLeaderboardData(mockData);
    };

    fetchLeaderboardData();
  }, []);

  const handleSort = (key: keyof LeaderboardEntry) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    const sortedData = [...leaderboardData].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setLeaderboardData(sortedData);
  };

  const handleSearch = async () => {
    if (!searchWallet.trim()) {
      setError("Please enter a wallet address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const publicKey = new PublicKey(searchWallet);
      const balance = await connection.getBalance(publicKey);
      // Add wallet to leaderboard logic here
    } catch (err) {
      setError("Invalid wallet address or error fetching data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold text-[#B1B762]">Leaderboard</h2>

        <div className="flex flex-col justify-center items-center">
      <p className="text-8xl lg:text-9xl tracking-wider font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-16"
      style={{ 
        fontSize: '150px',
        fontWeight: 900,
        color: '#B1B762',         
        textAlign: 'center',
        lineHeight: '1',
        letterSpacing: '0.05em',
        
      }}>
      Coming Soon</p>
</div>
        
      </div>
    </div>
  );
};

export default Leaderboards;
