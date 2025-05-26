import ERC20_ABI from "@/abis/ERC20.json";
import { createArtifactStore } from "@/lib/create-artifact-store";
import {
  getEncryptionKeyFromPassword,
  setEncryptionKeyFromPassword,
} from "@/lib/encription-keys";
import { getBalance, getETHBalance, sendTransaction } from "@/lib/erc20-tokens";
import {
  EVMGasType,
  getEVMGasTypeForTransaction,
  MerkletreeScanUpdateEvent,
  NETWORK_CONFIG,
  NetworkName,
  RailgunBalancesEvent,
  RailgunERC20AmountRecipient,
  RailgunWalletInfo,
  TransactionGasDetails,
  TXIDVersion,
} from "@railgun-community/shared-models";
import {
  createRailgunWallet,
  gasEstimateForShield,
  getShieldPrivateKeySignatureMessage,
  getWalletMnemonic,
  loadWalletByID,
  POIList,
  populateShield,
  refreshBalances,
  setLoggers,
  setOnBalanceUpdateCallback,
  setOnTXIDMerkletreeScanCallback,
  setOnUTXOMerkletreeScanCallback,
  startRailgunEngine,
} from "@railgun-community/wallet";
import { randomBytes } from "crypto";
import { Contract, ethers, keccak256, Mnemonic, Wallet } from "ethers";
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

type TokenBalanceInfo = {
  tokenAddress: string;
  decimals: number;
  balance: string;
};

export interface WalletInfo extends RailgunWalletInfo {
  balances: Record<string, TokenBalanceInfo>;
  publicBalances: Record<string, TokenBalanceInfo>;
  publicAddress: string;
  mnemonic: string;
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
  refreshPrivateBalances: (walletId: string) => Promise<void>;
  refreshPublicBalances(
    publicAddress: string
  ): Promise<Record<string, TokenBalanceInfo>>;
  resetWallet: () => void;
  shieldToken: (
    tokenAddress: string,
    amount: string,
    decimals: number
  ) => Promise<void>;
}
const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

const supportedTokens = [
  {
    symbol: "LINK",
    address: "0x779877a7b0d9e8603169ddbd7836e478b4624789",
    decimals: 18,
  },
  {
    symbol: "WETH",
    address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    decimals: 18,
  },
  {
    symbol: "USDC",
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
  }
];

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

      const encriptionKey = await setEncryptionKeyFromPassword(password);
      const walletInfo: RailgunWalletInfo = await createRailgunWallet(
        encriptionKey,
        mnemonic,
        creationBlockNumberMap
      );

      const publicWallet = Wallet.fromPhrase(mnemonic);

      localStorage.setItem("railgun_wallet_id", walletInfo.id);
      const publicBalances = await refreshPublicBalances(publicWallet.address);

      updateState({
        wallet: {
          id: walletInfo.id,
          railgunAddress: walletInfo.railgunAddress,
          balances: {},
          publicBalances: publicBalances,
          mnemonic,
          publicAddress: publicWallet.address,
        },
        isLoading: false,
      });

      await refreshPrivateBalances(walletInfo.id);
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
      const mnemonic = await getWalletMnemonic(encryptionKey, walletID);
      const railgunWallet: RailgunWalletInfo = await loadWalletByID(
        encryptionKey,
        walletID,
        false
      );
      if (!railgunWallet) {
        throw new Error("Failed to load wallet");
      }
      const publicWallet = Wallet.fromPhrase(mnemonic);
      console.log("Loaded wallet:", publicWallet.address);
      const publicBalances = await refreshPublicBalances(publicWallet.address);
      updateState({
        wallet: {
          id: railgunWallet.id,
          railgunAddress: railgunWallet.railgunAddress,
          balances: {},
          publicBalances: publicBalances,
          mnemonic,
          publicAddress: publicWallet.address,
        },
        isLoading: false,
      });
      await refreshPrivateBalances(railgunWallet.id);
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : "Failed to load wallet",
        isLoading: false,
      });
    }
  };

  const refreshPublicBalances = async (
    publicAddress: string
  ): Promise<Record<string, TokenBalanceInfo>> => {
    const balances: Record<string, TokenBalanceInfo> = {};
    for (const token of supportedTokens) {
      const balance = await getBalance(
        token.address,
        publicAddress,
        token.decimals
      );
      balances[token.symbol] = {
        tokenAddress: token.address,
        decimals: token.decimals,
        balance,
      };
    }
    balances["ETH"] = {
      tokenAddress: "ETH",
      decimals: 18,
      balance: await getETHBalance(publicAddress),
    };

    if (state.wallet) {
      state.wallet.publicBalances = balances;
      updateState({ wallet: state.wallet });
    }
    return balances;
  };

  const refreshPrivateBalances = async (walletId: string) => {
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

  const shieldToken = async (
    tokenAddress: string,
    amount: string,
    decimals: number
  ) => {
    if (!state.wallet) {
      throw new Error("No active wallet to shield tokens");
    }
    updateState({ isLoading: true, error: null });

    try {
      const publicWallet = Wallet.fromPhrase(state.wallet.mnemonic);
      const shieldSignatureMessage = getShieldPrivateKeySignatureMessage();
      const shieldPrivateKey = keccak256(
        await publicWallet.signMessage(shieldSignatureMessage)
      );
      const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
        {
          tokenAddress,
          amount: ethers.parseUnits(amount, decimals),
          recipientAddress: state.wallet.railgunAddress,
        },
      ];

      const { gasEstimate } = await gasEstimateForShield(
        TXIDVersion.V2_PoseidonMerkle,
        NetworkName.EthereumSepolia,
        shieldPrivateKey,
        erc20AmountRecipients,
        [], // nftAmountRecipients
        publicWallet.address
      );

      const evmGasType: EVMGasType = getEVMGasTypeForTransaction(
        NetworkName.EthereumSepolia,
        true // Always true for Shield transactions
      );
      let gasDetails: TransactionGasDetails;

      switch (evmGasType) {
        case EVMGasType.Type0:
        case EVMGasType.Type1:
          gasDetails = {
            evmGasType,
            gasEstimate,
            gasPrice: BigInt("0x100000"), // TODO
          };
          break;
        case EVMGasType.Type2:
          gasDetails = {
            evmGasType,
            gasEstimate,
            maxFeePerGas: BigInt("0x100000"), // TODO
            maxPriorityFeePerGas: BigInt("0x010000"), // TODO
          };
          break;
      }

      const { transaction } = await populateShield(
        TXIDVersion.V2_PoseidonMerkle,
        NetworkName.EthereumSepolia,
        shieldPrivateKey,
        erc20AmountRecipients,
        [], // nftAmountRecipients
        gasDetails
      );

      // Public wallet to shield from.
      transaction.from = publicWallet.address;
      await sendTransaction(state.wallet.mnemonic, transaction);
    } catch (error) {
      updateState({
        error:
          error instanceof Error ? error.message : "Failed to shield token",
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    initializeEngine().then(() => {
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

          const newBalances: Record<string, TokenBalanceInfo> = {};
          const symbolPromises = balancesFormatted.erc20Amounts.map(
            async (erc20) => {
              try {
                const tokenContract = new Contract(
                  erc20.tokenAddress,
                  ERC20_ABI
                );
                const symbol: string = await tokenContract.symbol();
                const decimals: string = await tokenContract.decimals();
                newBalances[symbol] = {
                  tokenAddress: erc20.tokenAddress,
                  decimals: parseInt(decimals, 10),
                  balance: ethers.formatUnits(
                    erc20.amount,
                    parseInt(decimals, 10)
                  ),
                };
              } catch (err) {
                console.warn(
                  `Failed to fetch symbol for token ${erc20.tokenAddress}`,
                  err
                );
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
    refreshPrivateBalances,
    refreshPublicBalances,
    resetWallet,
    shieldToken,
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
