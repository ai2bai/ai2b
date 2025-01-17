import React, { useEffect, useState } from "react";
import { TabItemProps } from "@/types";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import WalletButton from "@/components/tabs/education/WalletButton";

interface WalletHistory {
  address: string;
  firstConnection: string;
  lastConnection: string;
}

const UserProfile: React.FC<TabItemProps> = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number>(0);
  const [daysConnected, setDaysConnected] = useState<number>(0);
  const [isFirstTime, setIsFirstTime] = useState<boolean>(true);

  useEffect(() => {
    if (publicKey) {
      // Get wallet balance
      const getBalance = async () => {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      };
      getBalance();

      // Check and update wallet history
      const walletHistory = localStorage.getItem("walletHistory");
      const currentTime = new Date().toISOString();

      if (walletHistory) {
        const history: WalletHistory = JSON.parse(walletHistory);
        if (history.address === publicKey.toString()) {
          setIsFirstTime(false);
          // Update last connection time
          history.lastConnection = currentTime;
          localStorage.setItem("walletHistory", JSON.stringify(history));

          // Calculate days connected
          const firstConnection = new Date(history.firstConnection);
          const today = new Date();
          const diffTime = Math.abs(
            today.getTime() - firstConnection.getTime()
          );
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysConnected(diffDays);
        } else {
          // New wallet connection
          const newHistory: WalletHistory = {
            address: publicKey.toString(),
            firstConnection: currentTime,
            lastConnection: currentTime,
          };
          localStorage.setItem("walletHistory", JSON.stringify(newHistory));
          setDaysConnected(1);
        }
      } else {
        // First time ever connecting
        const newHistory: WalletHistory = {
          address: publicKey.toString(),
          firstConnection: currentTime,
          lastConnection: currentTime,
        };
        localStorage.setItem("walletHistory", JSON.stringify(newHistory));
        setDaysConnected(1);
      }
    }
  }, [publicKey, connection]);

  return (
    <div className="space-y-6">
      {/* Wallet Connect Button */}
      <div className="flex flex-row items-center justify-center">
        <WalletButton />
      </div>

      {publicKey && (
        <div className="mt-4 space-y-4">
          {/* Wallet Info Card */}
          <div className="p-6 border border-[#B1B762] rounded-md bg-black/20">
            <div className="space-y-4">
              {isFirstTime && (
                <div className="bg-[#B1B762] text-black px-4 py-2 rounded-md text-sm mb-4">
                  Welcome! This is your first time connecting this wallet.
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-[#B1B762] text-lg font-semibold">
                  Wallet Details
                </h3>
                <p className="text-sm font-mono break-all text-white">
                  Address: {publicKey.toString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/40 rounded-md">
                  <p className="text-sm text-gray-400">Balance</p>
                  <p className="text-xl font-semibold text-[#B1B762]">
                    {balance.toFixed(4)} SOL
                  </p>
                </div>

                <div className="p-4 bg-black/40 rounded-md">
                  <p className="text-sm text-gray-400">Days Connected</p>
                  <p className="text-xl font-semibold text-[#B1B762]">
                    {daysConnected} {daysConnected === 1 ? "day" : "days"}
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                First connected:{" "}
                {new Date(
                  JSON.parse(
                    localStorage.getItem("walletHistory") || "{}"
                  ).firstConnection
                ).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
