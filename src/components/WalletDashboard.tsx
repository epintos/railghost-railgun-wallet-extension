import { useWallet } from "@/contexts/WalletContext";
import { useState } from "react";

export default function WalletDashboard() {
  const { wallet, refreshWalletBalances } = useWallet();
  const [activeTab, setActiveTab] = useState<"private" | "public">("private");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data
  const privateTokens = [
    { symbol: "ETH", balance: "0.5", value: "$1000" },
    { symbol: "USDC", balance: "500", value: "$500" },
  ];

  const publicTokens = [
    { symbol: "ETH", balance: "1.2", value: "$2400" },
    { symbol: "DAI", balance: "1000", value: "$1000" },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (wallet) {
        await refreshWalletBalances(wallet.id);
      }
    } catch (error) {
      console.error("Failed to refresh balances:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!wallet) return null;

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
        {/* Header with logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">R</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Railgun Wallet</h1>

          {/* Tabs */}
          <div className="flex justify-center space-x-6 mb-6">
            <button
              className={`text-sm font-medium ${
                activeTab === "private"
                  ? "text-white border-b-2 border-purple-500 pb-1"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("private")}
            >
              Private
            </button>
            <button
              className={`text-sm font-medium ${
                activeTab === "public"
                  ? "text-white border-b-2 border-blue-500 pb-1"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("public")}
            >
              Public
            </button>
          </div>
        </div>

        {activeTab === "private" ? (
          <>
            {/* Private Balance */}
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 mb-6 border border-purple-500/20">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-sm font-medium text-purple-300 mb-1">
                    Private Balance
                  </h2>
                  <p className="text-3xl font-bold text-white">$1,100</p>
                  <p className="text-xs text-gray-400 mt-2">
                    0zk...{wallet.railgunAddress.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="text-purple-300 hover:text-white disabled:opacity-50"
                >
                  {isRefreshing ? (
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Private Tokens */}
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              PRIVATE TOKENS
            </h3>
            <div className="space-y-3 mb-6">
              {Object.entries(wallet.balances).map(
                ([symbol, balance], index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">
                          {symbol} {balance.toString()}
                        </p>
                        <p className="text-xs text-gray-400">—</p>{" "}
                        {/* Replace with value if available */}
                      </div>
                      <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-1.5 px-3 rounded-full">
                        Send
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200">
                Shield Assets
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl border border-white/20 transition-all duration-200">
                Receive
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Public Balance */}
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-6 mb-6 border border-blue-500/20">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-sm font-medium text-blue-300 mb-1">
                    Public Balance
                  </h2>
                  <p className="text-3xl font-bold text-white">$3,700</p>
                  <p className="text-xs text-gray-400 mt-2">
                    0x...{wallet.railgunAddress.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="text-blue-300 hover:text-white disabled:opacity-50"
                >
                  {isRefreshing ? (
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Public Tokens */}
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              PUBLIC TOKENS
            </h3>
            <div className="space-y-3 mb-6">
              {publicTokens.map((token, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">
                        {token.symbol} {token.balance}
                      </p>
                      <p className="text-xs text-gray-400">{token.value}</p>
                    </div>
                    <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-1.5 px-3 rounded-full">
                      Shield
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200">
                Send
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl border border-white/20 transition-all duration-200">
                Receive
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
