import React, { useState, useEffect } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TokenListProvider, TokenInfo } from "@solana/spl-token-registry";
import {
  Loader2,
  Search,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Wallet,
} from "lucide-react";

interface TokenData {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  price: number;
  valueUSD: number;
  logoURI?: string;
}

interface WalletData {
  address: string;
  solBalance: number;
  tokens: TokenData[];
  totalValueUSD: number;
  lastUpdated: Date;
}

interface PriceCache {
  [key: string]: {
    price: number;
    timestamp: number;
  };
}

interface TokenMetadataCache {
  [key: string]: {
    data: any;
    timestamp: number;
  };
}

const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PRICE_CACHE: PriceCache = {};
const TOKEN_METADATA_CACHE: TokenMetadataCache = {};
const PRIMARY_COLOR = "#FF0000";

const SolanaWalletTracker: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [tokenList, setTokenList] = useState<Map<string, TokenInfo>>(new Map());

  const connection = new Connection(SOLANA_RPC_URL, "confirmed");

  useEffect(() => {
    // Load Solana token list
    new TokenListProvider().resolve().then((tokens) => {
      const tokenMap = tokens
        .filterByClusterSlug("mainnet-beta")
        .getList()
        .reduce((map, token) => {
          map.set(token.address, token);
          return map;
        }, new Map<string, TokenInfo>());
      setTokenList(tokenMap);
    });
  }, []);

  const fetchTokenMetadata = async (mintAddress: string) => {
    const now = Date.now();
    if (
      TOKEN_METADATA_CACHE[mintAddress] &&
      now - TOKEN_METADATA_CACHE[mintAddress].timestamp < CACHE_DURATION
    ) {
      return TOKEN_METADATA_CACHE[mintAddress].data;
    }
  };

  const fetchTokenPrice = async (address: string): Promise<number> => {
    const now = Date.now();
    if (
      PRICE_CACHE[address] &&
      now - PRICE_CACHE[address].timestamp < CACHE_DURATION
    ) {
      return PRICE_CACHE[address].price;
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${address}&vs_currencies=usd`
      );
      const data = await response.json();
      const price = data[address.toLowerCase()]?.usd || 0;
      PRICE_CACHE[address] = { price, timestamp: now };
      return price;
    } catch (error) {
      console.error("Error fetching token price:", error);
      return 0;
    }
  };

  const fetchSolPrice = async (): Promise<number> => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
      );
      const data = await response.json();
      return data.solana.usd;
    } catch (error) {
      console.error("Error fetching SOL price:", error);
      return 0;
    }
  };

  const fetchWalletData = async () => {
    if (!walletAddress.trim()) {
      setError("Please enter a wallet address");
      return;
    }

    try {
      const pubKey = new PublicKey(walletAddress);
    } catch {
      setError("Please enter a valid Solana wallet address");
      return;
    }

    setIsLoading(true);
    setIsTokenLoading(true);
    setError("");

    try {
      const pubKey = new PublicKey(walletAddress);

      // Fetch SOL balance
      const solBalance = await connection.getBalance(pubKey);
      const solPrice = await fetchSolPrice();
      const solBalanceInSol = solBalance / LAMPORTS_PER_SOL;
      const solValueUSD = solBalanceInSol * solPrice;

      // Fetch token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        pubKey,
        {
          programId: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
        }
      );

      const tokens: TokenData[] = await Promise.all(
        tokenAccounts.value.map(async (tokenAccount) => {
          const accountData = tokenAccount.account.data.parsed.info;
          const mintAddress = accountData.mint;
          const tokenInfo = tokenList.get(mintAddress);
          const tokenMetadata = await fetchTokenMetadata(mintAddress);

          const price = await fetchTokenPrice(mintAddress);
          const balance = accountData.tokenAmount.uiAmount;
          const valueUSD = balance * price;

          return {
            mint: mintAddress,
            symbol: tokenInfo?.symbol || tokenMetadata?.symbol || "Unknown",
            name: tokenInfo?.name || tokenMetadata?.name || "Unknown Token",
            balance,
            decimals: accountData.tokenAmount.decimals,
            price,
            valueUSD,
            logoURI: tokenInfo?.logoURI || tokenMetadata?.icon,
          };
        })
      );

      // Sort tokens by value
      tokens.sort((a, b) => b.valueUSD - a.valueUSD);

      const totalTokenValue = tokens.reduce(
        (acc, token) => acc + token.valueUSD,
        0
      );
      const totalValueUSD = totalTokenValue + solValueUSD;

      const walletDetails: WalletData = {
        address: walletAddress,
        solBalance: solBalanceInSol,
        tokens,
        totalValueUSD,
        lastUpdated: new Date(),
      };

      setWalletData(walletDetails);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch wallet data. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsTokenLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && walletData) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            fetchWalletData();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, walletData]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      fetchWalletData();
    }
  };

  return (
    <div className="space-y-6 bg-black text-white p-6 min-h-screen">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#B1B762] flex items-center gap-2">
          <Wallet className="text-[#B1B762]" />
          Solana Wallet Tracker
        </h3>        
      </div>

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

      {walletData && (
        <div className="space-y-6 mt-4">
          <div className="p-4 border border-[#B1B762] rounded bg-black/50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold">Wallet Overview</h4>
                <p className="text-sm mt-2 flex items-center gap-2">
                  Address: {walletData.address}
                  <a
                    href={`https://solscan.io/account/${walletData.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B1B762] hover:text-[#B1B762]"
                  >
                    <ExternalLink size={14} />
                  </a>
                </p>
              </div>
              <div className="text-xs text-gray-400">
                Last updated: {walletData.lastUpdated.toLocaleTimeString()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-red-900/10 rounded border border-[#B1B762]">
                <div className="text-sm text-gray-400">SOL Balance</div>
                <div className="text-xl font-bold">
                  {walletData.solBalance.toFixed(4)} SOL
                </div>
              </div>
              <div className="p-3 bg-red-900/10 rounded border border-[#B1B762]">
                <div className="text-sm text-gray-400">Total Value (USD)</div>
                <div className="text-xl font-bold">
                  ${walletData.totalValueUSD.toLocaleString()}
                </div>
              </div>
            </div>
          </div>        
        </div>
      )}
    </div>
  );
};

export default SolanaWalletTracker;
