import LoadingSpinner from '@/components/LoadingSpinner';
import WalletDashboard from '@/components/WalletDashboard';
import WalletSetup from '@/components/WalletSetup';
import { useWallet } from '@/contexts/WalletContext';

export default function Home() {
  const { wallet, isEngineStarted, isLoading, error, loadExistingWallet } = useWallet();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-red-400 font-semibold mb-2">Error</h2>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!isEngineStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-center">
          <h1 className="text-xl font-semibold mb-2">Initializing RailGhost...</h1>
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      {!wallet ? <WalletSetup /> : <WalletDashboard />}
    </div>
  )
}
