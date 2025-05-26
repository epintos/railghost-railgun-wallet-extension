import { ethers } from "ethers";

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
];

const provider: ethers.Provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth_sepolia');

/**
 * Get the symbol of an ERC20 token.
 * @param tokenAddress The ERC20 token contract address.
 * @param provider An ethers.js provider instance.
 * @returns The token symbol, or throws on failure.
 */
export async function getTokenSymbol(
  tokenAddress: string,
): Promise<string> {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await contract.symbol();
}
