import { Client } from 'xrpl';
import { NextResponse } from 'next/server';
const RECEIVING_ADDRESS = process.env.NEXT_PUBLIC_XRPL_RECEIVER_ADDRESS || 'rNb4AKqA6QwhD8Nfff7rVxg5RPmyTE1vVn';
const XRPL_SERVER = process.env.XRPL_SERVER || 'wss://s.altnet.rippletest.net:51233/';
export async function GET() {
const client = new Client(XRPL_SERVER);
try {
await client.connect();
const response = await client.request({
command: 'account_tx',
account: RECEIVING_ADDRESS,
limit: 50,
});
const txs = response.result.transactions
.filter((transaction) => transaction.tx && transaction.tx.TransactionType === 'Payment' && transaction.tx.Destination === RECEIVING_ADDRESS && transaction.tx.Amount)
.map((transaction) => ({
id: transaction.tx!.hash,
amount: Number((transaction.tx as any).Amount) / 1000000,
date: new Date(transaction.tx!.date! * 1000 + 946684800000).toISOString(),
}));
return NextResponse.json(txs);
} catch (error) {
console.error('Payments error:', error);
return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
} finally {
await client.disconnect();
}
}