import ERC20_ABI from "@/abis/ERC20.json";
import { ethers, Wallet } from "ethers";
const provider: ethers.Provider = new ethers.JsonRpcProvider(
  "https://ethereum-sepolia-rpc.publicnode.com"
);

// Get the symbol of an ERC20 token
export const getTokenSymbol = async (tokenAddress: string): Promise<string> => {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await contract.symbol();
};

// Get the decimals of an ERC20 token
export const getTokenDecimals = async (tokenAddress: string): Promise<number> => {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const decimals = await contract.decimals();
  return decimals;
};

// Send a transaction using a wallet from a mnemonic
export const sendTransaction = async (
  mnemonic: string,
  transaction: ethers.TransactionRequest
): Promise<ethers.TransactionResponse> => {
  const wallet = new Wallet(mnemonic, provider);
  return await wallet.sendTransaction(transaction);
};

// Get the ERC20 balance of a wallet
export const getBalance = async (
  tokenAddress: string,
  walletAddress: string,
  decimals: number
): Promise<string> => {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const balance = await contract.balanceOf(walletAddress);
  return ethers.formatUnits(balance, decimals);
};

// Get the ETH balance of a wallet
export const getETHBalance = async (walletAddress: string): Promise<string> => {
  try {
    const balanceWei = await provider.getBalance(walletAddress);
    return ethers.formatEther(balanceWei);
  } catch (error) {
    console.error("Failed to get ETH balance:", error);
    return "0";
  }
};
