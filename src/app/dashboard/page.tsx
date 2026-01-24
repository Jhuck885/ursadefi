'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import XRPLConnect from '@/components/XRPLConnect'; // Adjust path if needed
import { Client } from 'xrpl'; // Simplified import (add AccountTxTransaction if needed elsewhere)

interface InvoiceEvent {
  id: string;
  created_at: string;
  message: string;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<InvoiceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');
  const RECEIVING_ADDRESS = process.env.NEXT_PUBLIC_XRPL_RECEIVER_ADDRESS!;

  useEffect(() => {
    if (!wallet) {
      setLoading(false); // Stop loading if no wallet
      return;
    }

    const fetchEvents = async () => {
      try {
        const client = new Client('wss://s.altnet.rippletest.net:51233');
        await client.connect();
        const response = await client.request({
          command: 'account_tx',
          account: RECEIVING_ADDRESS,
          limit: 20,
          ledger_index_min: -1,
          ledger_index_max: -1,
          forward: false,
        });
        const { transactions } = response.result || { transactions: [] };
        const formattedEvents: InvoiceEvent[] = transactions
          .filter((tx) => tx.tx?.TransactionType === 'Payment' && tx.validated && tx.tx?.Memos) // Reinstated memos for invoice relevance
          .map((tx) => {
            const memoData = tx.tx?.Memos?.[0]?.Memo?.MemoData
              ? Buffer.from(tx.tx.Memos[0].Memo.MemoData, 'hex').toString()
              : 'Payment received';
            const xrplTime = tx.tx?.date || 0;
            const date = new Date((xrplTime + 946684800) * 1000).toLocaleString();
            return {
              id: tx.tx?.hash || '',
              created_at: date,
              message: `Invoice event: ${memoData}`,
            };
          });
        setEvents(formattedEvents);
        await client.disconnect();
      } catch (err: unknown) {
        console.error('Events fetch failed', err instanceof Error ? err.message : String(err));
        setEvents([]); // Force empty on error
      } finally {
        setLoading(false); // Always resolve loading
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 60000);
    return () => clearInterval(interval);
  }, [wallet, RECEIVING_ADDRESS]);

  const handleTestInvoice = async () => {
    if (!wallet) return;
    setTxLoading(true);
    setTxError('');
    try {
      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();
      const prepared = await client.autofill({
        TransactionType: 'Payment',
        Account: wallet.address,
        Amount: '1000000', // 1 XRP drops
        Destination: RECEIVING_ADDRESS,
        Memos: [{ Memo: { MemoData: Buffer.from('Test Invoice: Amount $100, Due 2026-02-01, Client: TestCo').toString('hex') } }],
      });
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);
      console.log('Test payment success:', result);
      await client.disconnect();
    } catch (err: unknown) {
      setTxError('Payment failed: ' + (err instanceof Error ? err.message : String(err)));
    }
    setTxLoading(false);
  };

  if (loading) {
    return <p className="text-center py-32 text-gray-500 text-xl">Loading feed...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Invoice Feed</h2>

      <div className="p-4 bg-[#1e293b] rounded-lg border border-gray-800 mb-6">
        <h3 className="text-xl font-bold mb-4">Connect XRPL Wallet for Invoicing</h3>
        {!wallet ? (
          <XRPLConnect onConnect={(w) => setWallet(w)} />
        ) : (
          <div>
            <p>Connected: {wallet.address}</p>
            <button
              onClick={handleTestInvoice}
              disabled={txLoading}
              className="mt-4 px-4 py-2 bg-green-500 rounded text-sm"
            >
              {txLoading ? 'Processing...' : 'Send Test Invoice Payment'}
            </button>
            {txError && <p className="text-red-500 mt-2">{txError}</p>}
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-32">
          <p className="text-3xl font-bold text-gray-500">No activity yet</p>
          <p className="mt-6 text-xl text-gray-400">Create an invoice or send a test payment to see events here</p>
        </div>
      ) : (
        events.map((event) => (
          <div key={event.id} className="p-4 bg-[#1e293b] rounded-lg border border-gray-800">
            <div className="flex items-center mb-2">
              <Image src="/1_ursadefi_logo.png" alt="UrsaDeFi" width={40} height={40} className="rounded-full" />
              <div className="ml-2">
                <p className="font-bold">UrsaDeFi User</p>
                <p className="text-sm text-gray-400">{event.created_at}</p>
              </div>
            </div>
            <p>{event.message}</p>
            <div className="mt-4 flex space-x-4">
              <button className="px-4 py-2 bg-[#1D9BF0] rounded-full text-sm">View Invoice</button>
              <button className="px-4 py-2 bg-[#1D9BF0] rounded-full text-sm">Share on X</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}