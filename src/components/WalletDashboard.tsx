import { useWallet } from '@/contexts/WalletContext'

export default function WalletDashboard() {
  const { wallet, resetWallet } = useWallet()

  if (!wallet) return null

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Wallet Dashboard</h1>
          <button
            onClick={resetWallet}
            className="text-gray-400 hover:text-red-400 text-sm transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/20">
            <h2 className="text-white font-semibold mb-2">Private Balance</h2>
            <p className="text-3xl font-bold text-white">$0.00</p>
            <p className="text-gray-400 text-sm mt-1">Protected by Railgun</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl border border-white/20 transition-all duration-200">
              Shield Assets
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl border border-white/20 transition-all duration-200">
              Send Private
            </button>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-white font-medium mb-3">Recent Activity</h3>
            <div className="text-gray-400 text-sm text-center py-6">
              No transactions yet
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-blue-400 font-medium mb-2">🛡️ Privacy Protection Active</h4>
            <p className="text-blue-300 text-sm">
              Your transactions are protected by Railgun's zero-knowledge privacy system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
