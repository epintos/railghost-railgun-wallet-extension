import ERC20_ABI from "@/abis/ERC20.json";
import { createArtifactStore } from "@/lib/create-artifact-store";
import {
  getEncryptionKeyFromPassword,
  setEncryptionKeyFromPassword,
} from "@/lib/encription-keys";
import {
  MerkletreeScanUpdateEvent,
  NETWORK_CONFIG,
  NetworkName,
  RailgunBalancesEvent,
  RailgunWalletInfo,
} from "@railgun-community/shared-models";
import {
  createRailgunWallet,
  loadWalletByID,
  POIList,
  refreshBalances,
  setLoggers,
  setOnBalanceUpdateCallback,
  setOnTXIDMerkletreeScanCallback,
  setOnUTXOMerkletreeScanCallback,
  startRailgunEngine,
} from "@railgun-community/wallet";
import { randomBytes } from "crypto";
import { Contract, Mnemonic } from "ethers";
import LevelDB from "level-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Set up loggers (optional)
setLoggers(
  (msg: string) => console.log(msg),
  (error: string) => console.error(error)
);

interface WalletInfo extends RailgunWalletInfo {
  balances: Record<string, bigint>;
}

interface WalletState {
  wallet: WalletInfo | null;
  isEngineStarted: boolean;
  isLoading: boolean;
  error: string | null;
}

type MapType<T> = Partial<Record<string, T>>;

const creationBlockNumberMap: MapType<number> = {
  [NetworkName.EthereumSepolia]: 11155111,
};

interface WalletContextType extends WalletState {
  initializeEngine: () => Promise<void>;
  createWallet: (password: string, mnemonic?: string) => Promise<void>;
  loadExistingWallet: (walletID: string, password?: string) => Promise<void>;
  refreshWalletBalances: (walletId: string) => Promise<void>;
  resetWallet: () => void;
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
  });
  const updateState = (updates: Partial<WalletState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const initializeEngine = async () => {
    try {
      updateState({ isLoading: true, error: null });

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
      const skipMerkletreeScans = false;

      // Array of aggregator node urls for Private Proof of Innocence (Private POI), in order of priority.
      // Only one is required. If multiple urls are provided, requests will fall back to lower priority aggregator nodes if primary request fails.
      // Please reach out in the RAILGUN builders groups for information on the public aggregator nodes run by the community.
      //
      // Private POI is a tool to give cryptographic assurance that funds
      // entering the RAILGUN smart contract are not from a known list
      // of transactions or actors considered undesirable by respective wallet providers.
      // For more information: https://docs.railgun.org/wiki/assurance/private-proofs-of-innocence
      // (additional developer information coming soon).
      const poiNodeURLs = ["https://poi-node.terminal-wallet.com"]; // TODO

      // Add a custom list to check Proof of Innocence against.
      // Leave blank to use the default list for the aggregator node provided.
      const customPOILists: POIList[] | undefined = undefined;

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

      updateState({ isEngineStarted: true, isLoading: false });
    } catch (error) {
      console.error("Engine initialization error:", error);
      updateState({
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize Railgun engine",
        isLoading: false,
      });
    }
  };

  const createWallet = async (
    password: string,
    mnemonic?: string
  ): Promise<void> => {
    if (!state.isEngineStarted) {
      throw new Error("Railgun engine not started");
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

      localStorage.setItem("railgun_wallet_id", walletInfo.id);

      updateState({
        wallet: {
          id: walletInfo.id,
          railgunAddress: walletInfo.railgunAddress,
          balances: {},
        },
        isLoading: false,
      });

      await refreshWalletBalances(walletInfo.id);
    } catch (error) {
      updateState({
        error:
          error instanceof Error ? error.message : "Failed to create wallet",
        isLoading: false,
      });
      throw error;
    }
  };

  const loadExistingWallet = async (password: string) => {
    try {
      if (!state.isEngineStarted) {
        throw new Error("Railgun engine not started");
      }

      updateState({ isLoading: true, error: null });

      const walletID = localStorage.getItem("railgun_wallet_id");
      if (!walletID) {
        throw new Error("No wallet ID found in local storage");
      }

      const encryptionKey = await getEncryptionKeyFromPassword(password);
      const railgunWallet: RailgunWalletInfo = await loadWalletByID(
        encryptionKey,
        walletID,
        false
      );
      if (!railgunWallet) {
        throw new Error("Failed to load wallet");
      }
      updateState({
        wallet: {
          id: railgunWallet.id,
          railgunAddress: railgunWallet.railgunAddress,
          balances: {},
        },
        isLoading: false,
      });
      await refreshWalletBalances(railgunWallet.id);
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : "Failed to load wallet",
        isLoading: false,
      });
    }
  };

  const refreshWalletBalances = async (walletId: string) => {
    try {
      await refreshBalances(
        NETWORK_CONFIG[NetworkName.EthereumSepolia].chain,
        walletId
      );
    } catch (error) {
      console.error("Balance refresh error:", error);
      updateState({
        error:
          error instanceof Error ? error.message : "Failed to refresh balances",
      });
    }
  };

  const resetWallet = () => {
    setState({
      wallet: null,
      isEngineStarted: true,
      isLoading: false,
      error: null,
    });
    localStorage.removeItem("railgun_wallet_id");
    localStorage.removeItem("railgun_salt");
    localStorage.removeItem("railgun_password_verifier");
  };

  useEffect(() => {
    initializeEngine().then(() => {
      console.log("done init");
      setOnBalanceUpdateCallback(
        async (balancesFormatted: RailgunBalancesEvent) => {
          console.log("setOnBalanceUpdateCallback");
          if (!state.wallet) {
            console.warn("no wallet");
            return;
          }

          if (balancesFormatted.railgunWalletID !== state.wallet.id) {
            console.warn("Balance update does not match active wallet");
            return;
          }

          const newBalances: Record<string, bigint> = {};
          const symbolPromises = balancesFormatted.erc20Amounts.map(
            async (erc20) => {
              try {
                const tokenContract = new Contract(
                  erc20.tokenAddress,
                  ERC20_ABI
                );
                const symbol: string = await tokenContract.symbol();
                newBalances[symbol] = erc20.amount;
              } catch (err) {
                console.warn(
                  `Failed to fetch symbol for token ${erc20.tokenAddress}`,
                  err
                );
                newBalances[erc20.tokenAddress] = erc20.amount; // fallback
              }
            }
          );

          await Promise.all(symbolPromises);

          state.wallet.balances = newBalances;
          updateState({ wallet: state.wallet });
        }
      );
      setOnUTXOMerkletreeScanCallback(onUTXOMerkletreeScanCallback);
      setOnTXIDMerkletreeScanCallback(onTXIDMerkletreeScanCallback);
    });

    // Cleanup on unmount
    return () => {
      // Clean up event listeners if needed
    };
  }, [state.wallet]);

  const contextValue: WalletContextType = {
    ...state,
    initializeEngine,
    createWallet,
    loadExistingWallet,
    refreshWalletBalances,
    resetWallet,
  };
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

const onUTXOMerkletreeScanCallback = (eventData: MerkletreeScanUpdateEvent) => {
  // Will get called throughout a private balance scan.
  // Handle updates on scan progress and status here, i.e. progress bar or loading indicator in the UI.
  console.log("onUTXOMerkletreeScanCallback");
};

const onTXIDMerkletreeScanCallback = (eventData: MerkletreeScanUpdateEvent) => {
  // Will get called throughout a private balance scan.
  // Handle updates on scan progress and status here, i.e. progress bar or loading indicator in the UI.
  console.log("onTXIDMerkletreeScanCallback");
};

export function useWallet() {
  const context = useContext(WalletContext);

  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
