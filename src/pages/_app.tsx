import { WalletProvider } from '@/contexts/WalletContext'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  const [isExtension, setIsExtension] = useState(false)

  useEffect(() => {
    // Check if running as Chrome extension
    const isExt = typeof window !== 'undefined' && window.chrome && window.chrome.runtime && window.chrome.runtime.id
    setIsExtension(!!isExt)
  }, [])

  return (
    <WalletProvider>
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${isExtension ? 'w-[360px] h-[600px]' : ''}`}>
        <Component {...pageProps} />
      </div>
    </WalletProvider>
  )
}
