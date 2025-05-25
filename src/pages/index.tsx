import LoadingSpinner from '@/components/LoadingSpinner';
import PasswordPrompt from '@/components/PasswordPrompt';
import WalletDashboard from '@/components/WalletDashboard';
import WalletSetup from '@/components/WalletSetup';
import { useWallet } from '@/contexts/WalletContext';
import { useEffect, useState } from 'react';

export default function Home() {
  const { wallet, isEngineStarted, isLoading, error, loadExistingWallet, resetWallet } = useWallet();
  const [hasCheckedLocalStorage, setHasCheckedLocalStorage] = useState(false);
  const [hasExistingWallet, setHasExistingWallet] = useState(false);

  useEffect(() => {
    if (isEngineStarted && !wallet && !hasCheckedLocalStorage) {
      const walletID = localStorage.getItem("railgun_wallet_id");
      setHasExistingWallet(!!walletID);
      setHasCheckedLocalStorage(true);
    }
  }, [isEngineStarted, wallet, hasCheckedLocalStorage]);

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

  if (hasExistingWallet && !wallet) {
    return <PasswordPrompt onUnlock={loadExistingWallet} onReset={() => resetWallet()} />;
  }

  return (
    <div className="min-h-screen p-4">
      {!wallet ? <WalletSetup /> : <WalletDashboard />}
    </div>
  )
}
