import { Client, Wallet, Payment, convertStringToHex } from "xrpl";

const TESTNET_URL = process.env.NEXT_PUBLIC_XRPL_NETWORK || "wss://s.altnet.rippletest.net:51233";

export class XRPLService {
  private client: Client;

  constructor() {
    this.client = new Client(TESTNET_URL);
  }

  async connect() {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.client.isConnected()) {
      await this.client.disconnect();
    }
  }

  async getBalance(address: string): Promise<string> {
    await this.connect();
    const response = await this.client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated",
    });
    return response.result.account_data.Balance;
  }

  async submitPayment(
    wallet: Wallet,
    destination: string,
    amount: string,
    memo?: string
  ) {
    await this.connect();
    const payment: Payment = {
      TransactionType: "Payment",
      Account: wallet.address,
      Destination: destination,
      Amount: amount,
      Memos: memo
        ? [
            {
              Memo: {
                MemoData: convertStringToHex(memo),
                MemoType: convertStringToHex("invoice"),
              },
            },
          ]
        : undefined,
    };
    const prepared = await this.client.autofill(payment);
    const signed = wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);
    return result;
  }

  // For dev/testing with seed
  createWalletFromSeed(seed: string): Wallet {
    return Wallet.fromSeed(seed);
  }

  // Generate new testnet wallet
  async fundTestWallet(): Promise<Wallet> {
    await this.connect();
    const { wallet } = await this.client.fundWallet();
    return wallet;
  }
}

export const xrplService = new XRPLService();