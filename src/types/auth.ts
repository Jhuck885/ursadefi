export interface UserSession {
  email: string;
  magicId: string;
  isAuthenticated: boolean;
}

export interface XRPLWalletState {
  address: string | null;
  publicKey: string | null;
  isConnected: boolean;
  balance?: string;
}

export interface InvoiceData {
  amount: string;
  currency: string;
  recipient: string;
  memo?: string;
}