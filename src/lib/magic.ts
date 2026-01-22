import { Magic } from "magic-sdk";

let magicClient: Magic | null = null;

export const getMagicClient = () => {
  if (typeof window === "undefined") return null;

  if (!magicClient) {
    const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
    if (!key) throw new Error("Magic publishable key not found");

    magicClient = new Magic(key, {
      network: "mainnet", // Magic network, not blockchain
    });
  }

  return magicClient;
};