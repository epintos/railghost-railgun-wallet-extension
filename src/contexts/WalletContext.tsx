import { createArtifactStore } from "@/lib/create-artifact-store";
import { setEncryptionKeyFromPassword } from "@/lib/set-encryption-key-from-password";
import {
  NETWORK_CONFIG,
  NetworkName,
  RailgunWalletInfo
} from "@railgun-community/shared-models";
import {
  createRailgunWallet,
  loadWalletByID,
  POIList,
  refreshBalances,
  setLoggers,
  startRailgunEngine
} from "@railgun-community/wallet";
import { randomBytes } from "crypto";
import { Mnemonic } from "ethers";
import LevelDB from "level-js";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

// Set up loggers (optional)
setLoggers(
  (msg: string) => console.log(msg),
  (error: string) => console.error(error)
);

interface WalletState {
  wallet: RailgunWalletInfo | null
  isEngineStarted: boolean
  isLoading: boolean
  error: string | null
  balances: Record<string, bigint>
}

type MapType<T> = Partial<Record<string, T>>;

const creationBlockNumberMap: MapType<number> = {
  [NetworkName.EthereumSepolia]: 11155111,
};

interface WalletContextType extends WalletState {
  initializeEngine: () => Promise<void>
  createWallet: (password: string, mnemonic?: string) => Promise<void>
  loadExistingWallet: (walletID: string, password?: string) => Promise<void>
  refreshWalletBalances: () => Promise<void>
  resetWallet: () => void
}
const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [state, setState] = useState<WalletState>({
    wallet: null,
    isEngineStarted: false,
    isLoading: false,
    error: null,
    balances: {}
  })
  const updateState = (updates: Partial<WalletState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const initializeEngine = async () => {
    try {
      updateState({ isLoading: true, error: null })
      
      // Name for your wallet implementation.
      // Encrypted and viewable in private transaction history.
      // Maximum of 16 characters, lowercase.
      const walletSource = "quickstart demo";

      // LevelDOWN compatible database for storing encrypted wallets.
      const dbPath = "engine.db";
      const db = new LevelDB(dbPath);

      // Whether to forward Engine debug logs to Logger.
      const shouldDebug = true;

      // Persistent store for downloading large artifact files required by Engine.
      const artifactStore = createArtifactStore();

      // Whether to download native C++ or web-assembly artifacts.
      // True for mobile. False for nodejs and browser.
      const useNativeArtifacts = false;

      // Whether to skip merkletree syncs and private balance scans.
      // Only set to TRUE in shield-only applications that don't
      // load private wallets or balances.
      const skipMerkletreeScans = false; // TODO

      // Array of aggregator node urls for Private Proof of Innocence (Private POI), in order of priority.
      // Only one is required. If multiple urls are provided, requests will fall back to lower priority aggregator nodes if primary request fails.
      // Please reach out in the RAILGUN builders groups for information on the public aggregator nodes run by the community.
      //
      // Private POI is a tool to give cryptographic assurance that funds
      // entering the RAILGUN smart contract are not from a known list
      // of transactions or actors considered undesirable by respective wallet providers.
      // For more information: https://docs.railgun.org/wiki/assurance/private-proofs-of-innocence
      // (additional developer information coming soon).
      const poiNodeURLs = ["..."]; // TODO

      // Add a custom list to check Proof of Innocence against.
      // Leave blank to use the default list for the aggregator node provided.
      const customPOILists: POIList[] = [];

      // Set to true if you would like to view verbose logs for private balance and TXID scans
      const verboseScanLogging = false;


      await startRailgunEngine(
        walletSource,
        db,
        shouldDebug,
        artifactStore,
        useNativeArtifacts,
        skipMerkletreeScans,
        poiNodeURLs,
        customPOILists,
        verboseScanLogging
      );


      // // Set up event listeners
      // EngineEvent.on(EngineEvent.Type.WalletCreated, (eventData: WalletCreatedEvent) => {
      //   console.log('Wallet created:', eventData.walletID)
      // })

      // EngineEvent.on(EngineEvent.Type.RailgunBalancesUpdated, (eventData: RailgunBalancesEvent) => {
      //   updateState({ 
      //     balances: eventData.balances.reduce((acc, balance) => {
      //       acc[balance.tokenAddress] = balance.amount
      //       return acc
      //     }, {} as Record<string, bigint>)
      //   })
      // })
      updateState({ isEngineStarted: true, isLoading: false })
    } catch (error) {
      console.error('Engine initialization error:', error)
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to initialize Railgun engine',
        isLoading: false 
      })
    }
  }

  const createWallet = async (
    password: string,
    mnemonic?: string,
  ): Promise<void> => {
    if (!state.isEngineStarted) {
        throw new Error('Railgun engine not started')
      }
    try {
      mnemonic =
        mnemonic || Mnemonic.fromEntropy(randomBytes(16)).phrase.trim();
      updateState({ isLoading: true, error: null });

      // Create new Railgun wallet
      const encriptionKey = await setEncryptionKeyFromPassword(password);
      const walletInfo: RailgunWalletInfo = await createRailgunWallet(
        encriptionKey,
        mnemonic,
        creationBlockNumberMap
      );

      updateState({
        wallet: {
          id: walletInfo.id,
          railgunAddress: walletInfo.railgunAddress,
        },
        isLoading: false,
      });

    } catch (error) {
      updateState({
        error:
          error instanceof Error ? error.message : "Failed to create wallet",
        isLoading: false,
      });
      throw error;
    }
  };

  const loadExistingWallet = async (walletID: string, password: string = '') => {
    try {
      if (!state.isEngineStarted) {
        throw new Error('Railgun engine not started')
      }

      updateState({ isLoading: true, error: null })

      const railgunWallet: RailgunWalletInfo = await loadWalletByID(password, walletID, true)
      if (!railgunWallet) {
        throw new Error('Failed to load wallet')
      }

      updateState({
        wallet: {
          id: railgunWallet.id,
          railgunAddress: railgunWallet.railgunAddress,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Wallet loading error:', error)
      updateState({
        error: error instanceof Error ? error.message : 'Failed to load wallet',
        isLoading: false
      })
    }
  }

  const refreshWalletBalances = async () => {
    try {
      if (!state.wallet?.railgunAddress) {
        return
      }

      await refreshBalances(NETWORK_CONFIG[NetworkName.EthereumSepolia].chain, state.wallet.id);
    } catch (error) {
      console.error('Balance refresh error:', error)
      updateState({
        error: error instanceof Error ? error.message : 'Failed to refresh balances'
      })
    }
  }

  const resetWallet = () => {
    setState({
      wallet: null,
      isEngineStarted: false,
      isLoading: false,
      error: null,
      balances: {}
    })
  }

  useEffect(() => {
    initializeEngine()
    
    // Cleanup on unmount
    return () => {
      // Clean up event listeners if needed
    }
  }, [])

  const contextValue: WalletContextType = {
    ...state,
    initializeEngine,
    createWallet,
    loadExistingWallet,
    refreshWalletBalances,
    resetWallet
  }
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
