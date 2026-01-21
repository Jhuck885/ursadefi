import { NextResponse } from 'next/server';  // Removed unused NextRequest
import { Client, Transaction } from 'xrpl';  // Added Transaction type

const RECEIVING_ADDRESS = process.env.NEXT_PUBLIC_XRPL_RECEIVER_ADDRESS!;
const SERVER = 'wss://s.altnet.rippletest.net:51233';

export async function GET() {
  try {
    const client = new Client(SERVER);
    await client.connect();
    const response = await client.request({
      command: 'account_tx',
      account: RECEIVING_ADDRESS,
      limit: 10,
      ledger_index_min: -1,
      ledger_index_max: -1,
      forward: false,
    });
    const txs = response.result.transactions
      .filter((tx: Transaction) =>
        tx.tx &&
        tx.tx.TransactionType === 'Payment' &&
        tx.tx.Destination === RECEIVING_ADDRESS &&
        tx.meta &&
        tx.meta.TransactionResult === 'tesSUCCESS'
      )
      .slice(0, 5);
    const formatted = txs.map((tx: Transaction) => {
      const amountDrops = typeof tx.tx.Amount === 'string' ? Number(tx.tx.Amount) : 0;
      const amountXRP = amountDrops / 1000000;
      const xrplTime = tx.tx.date || 0;
      const unixTime = (xrplTime + 946684800) * 1000;
      const date = new Date(unixTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return {
        amount: amountXRP,
        date,
        hash: tx.tx.hash,
        tag: tx.tx.DestinationTag || null,
      };
    });
    await client.disconnect();
    return NextResponse.json(formatted);
  } catch (err) {
    console.error('Payments API error', err);
    return NextResponse.json([], { status: 500 });
  }
}