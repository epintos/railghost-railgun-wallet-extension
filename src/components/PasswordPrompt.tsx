import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface PasswordPromptProps {
  onUnlock: (password: string) => Promise<void>;
  onReset: () => void;
}

export default function PasswordPrompt({ onUnlock, onReset }: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onUnlock(password);
    } catch (err) {
      setError('Incorrect password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="wallet-container">
        <h1 className="wallet-title">Unlock Wallet</h1>
        <p className="wallet-text">
          An existing wallet was found. Please enter your password to unlock it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="wallet-input"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="wallet-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Unlock Wallet'}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="wallet-button-secondary"
          >
            Reset Wallet
          </button>
        </form>
      </div>
    </div>
  );
}
