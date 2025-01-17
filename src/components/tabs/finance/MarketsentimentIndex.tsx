import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bitcoin,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const mockHistoricalData = Array.from({ length: 30 }, (_, i) => ({
  timestamp: new Date(
    Date.now() - (29 - i) * 24 * 60 * 60 * 1000
  ).toLocaleDateString(),
  value: 40 + Math.random() * 40,
}));

const MarketSentimentIndex = () => {
  const [timeframe, setTimeframe] = useState("30d");

  const getFearGreedColor = (value: number) => {
    if (value <= 20) return "#FF4444";
    if (value <= 40) return "#FFA500";
    if (value <= 60) return "#FFEB3B";
    if (value <= 80) return "#4CAF50";
    return "#2196F3";
  };

  const fearGreedValue = 61;
  const fearGreedClass = "Greed";
  const marketCapChange = -3.8;
  const volume = "378.09B";
  const btcDominance = 54.95;
  const ethDominance = 11.02;
  const defiMarketCap = "47.8B";
  const defiVolume = "2.91B";

  return (
    <div className="space-y-6 p-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2 text-[#B1B762]">
          <Activity  />
          Market Sentiment Analysis
        </h3>
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-[#B1B762] p-4 rounded">
          <h4 className="text-sm text-[#B1B762]/50 mb-2">Fear & Greed Index</h4>
          <div className="flex items-center justify-between">
            <span
              className="text-3xl font-bold"
              style={{ color: getFearGreedColor(fearGreedValue) }}
            >
              {fearGreedValue}
            </span>
            <span className="text-sm px-2 py-1 rounded bg-green-500/20 text-green-500">
              {fearGreedClass}
            </span>
          </div>
          <div className="text-xs text-[#B1B762]/50 mt-2">
            Next update in: 10592
          </div>
        </div>

        <div className="border border-[#B1B762] text-[#B1B762] p-4 rounded">
          <h4 className="text-sm text-[#B1B762]/50 mb-2">24h Market Cap Change</h4>
          <div className="flex items-center gap-2">
            <TrendingDown className="text-red-500" size={20} />
            <span className="text-2xl font-bold text-red-500">
              {marketCapChange}%
            </span>
          </div>
          <div className="text-sm text-[#B1B762]/50 mt-2">Volume: ${volume}</div>
        </div>

        {/* Market Dominance */}
        <div className="p-4 rounded border border-[#B1B762] text-[#B1B762]">
          <h4 className="text-sm text-[#B1B762]/50 mb-2">Market Dominance</h4>
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-1">
                <Bitcoin size={16} />
                <span className="text-2xl font-bold">{btcDominance}%</span>
              </div>
              <span className="text-xs text-[#B1B762]/50">BTC</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold">{ethDominance}%</span>
              </div>
              <span className="text-xs text-[#B1B762]/50">ETH</span>
            </div>
          </div>
        </div>

        {/* DeFi Overview */}
        <div className="border border-[#B1B762] text-[#B1B762] p-4 rounded">
          <h4 className="text-sm text-[#B1B762]/50 mb-2">DeFi Overview</h4>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-[#B1B762]/50">Market Cap:</span>
              <span className="text-lg font-bold ml-2">${defiMarketCap}</span>
            </div>
            <div>
              <span className="text-xs text-[#B1B762]/50">24h Volume:</span>
              <span className="text-lg font-bold ml-2">${defiVolume}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Chart */}
      <div className="border border-[#B1B762] text-[#B1B762] p-4 rounded">
        <h4 className="text-sm text-[#B1B762]/50 mb-4">
          Historical Fear & Greed Index
        </h4>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockHistoricalData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.1)"
              />
              <XAxis
                dataKey="timestamp"
                stroke="#fff"
                tick={{ fill: "#fff" }}
              />
              <YAxis stroke="#fff" tick={{ fill: "#fff" }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#B1B762"
                strokeWidth={2}
                dot={false}
                fill="rgba(188, 11, 29, 0.1)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MarketSentimentIndex;
