import { useWallet } from "@/contexts/WalletContext";
import { useState } from "react";

export default function WalletDashboard() {
  const { wallet, refreshPrivateBalances, refreshPublicBalances, shieldToken } = useWallet();
  const [activeTab, setActiveTab] = useState<"private" | "public">("private");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "shield">(
    "dashboard"
  );
  const [shieldForm, setShieldForm] = useState({
    tokenAddress: "",
    amount: "",
    symbol: "",
    balance: "",
    decimals: 0,
  });
  const [isShielding, setIsShielding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (wallet) {
        if (activeTab === "private") {
          await refreshPrivateBalances(wallet.id);
        } else {
          await refreshPublicBalances(wallet.publicAddress);
        }
      }
    } catch (error) {
      console.error("Failed to refresh balances:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShieldAssets = (symbol: string, balance: string, tokenAddress: string, decimals: number) => {
    setCurrentView("shield");
    setShieldForm({ tokenAddress, amount: "", balance, symbol, decimals });
    setShowSuccess(false);
  };

  const handleShieldConfirm = async () => {
    setIsShielding(true);
    try {
      await shieldToken(shieldForm.tokenAddress, shieldForm.amount, shieldForm.decimals);

      setShowSuccess(true);
      setTimeout(() => {
        setCurrentView("dashboard");
        setActiveTab("private");
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to shield assets:", error);
    } finally {
      setIsShielding(false);
    }
  };

  const handleCancel = () => {
    setCurrentView("dashboard");
    setShieldForm({ tokenAddress: "", amount: "", balance: "", symbol: "", decimals: 0 });
    setShowSuccess(false);
  };

  if (!wallet) return null;

  // Shield Assets View
  if (currentView === "shield") {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">R</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Shield Asset: {shieldForm.symbol}
            </h1>
            <p className="text-sm text-gray-400">
              Move {shieldForm.symbol} from public to private
            </p>
          </div>

          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
              <p className="text-gray-400">Assets shielded successfully</p>
            </div>
          ) : (
            <>
              {/* Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Token Address
                  </label>
                  <input
                    type="text"
                    value={shieldForm.tokenAddress}
                    onChange={(e) =>
                      setShieldForm((prev) => ({
                        ...prev,
                        tokenAddress: e.target.value,
                      }))
                    }
                    placeholder="0x..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (Balance: {shieldForm.balance})
                  </label>
                  <input
                    type="text"
                    value={shieldForm.amount}
                    onChange={(e) =>
                      setShieldForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="0.0"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="text-sm font-medium text-purple-300 mb-2">
                    Recipient Address
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Assets will be shielded to your private address
                  </p>
                  <p className="text-white font-mono text-sm break-all">
                    0zk...{wallet.railgunAddress.slice(-4)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                  onClick={handleCancel}
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl border border-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShieldConfirm}
                  disabled={
                    isShielding ||
                    !shieldForm.tokenAddress ||
                    !shieldForm.amount
                  }
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
                >
                  {isShielding ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Shielding...
                    </>
                  ) : (
                    "Confirm Shield"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main Dashboard View
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

            {/* Actions - Remove Shield Assets button from private tab */}
            <div className="grid grid-cols-1 gap-4 mb-6">
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
                  {/* <h2 className="text-sm font-medium text-blue-300 mb-1">
                    Public Balance
                  </h2> */}
                  {/* <p className="text-3xl font-bold text-white">$3,700</p> */}
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
              {Object.entries(wallet.publicBalances).map(
                ([symbol, token], index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">
                          {symbol}
                        </p>
                        <p className="text-xs text-gray-400"> {token.balance.toString()}</p>
                      </div>
                      <button disabled={symbol==="ETH" || token.balance === "0.0"} onClick={() => handleShieldAssets(symbol, token.balance, token.tokenAddress, token.decimals)} className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-1.5 px-3 rounded-full">
                        Shield
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
