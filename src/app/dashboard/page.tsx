'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import Image from 'next/image';
import XRPLConnect from '@/components/XRPLConnect'; // Add this from prior (create if missing)
import { xrplService } from '@/lib/xrpl-client'; // Add this from prior (create if missing)

export default function DashboardPage() {
  const [events, setEvents] = useState<InvoiceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null); // New: Wallet state
  const [txLoading, setTxLoading] = useState(false); // New: For payment button
  const [txError, setTxError] = useState(''); // New: Errors

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabaseBrowser
        .from('invoice_events')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Events error:', error.message || error.hint || JSON.stringify(error));
        setEvents([]);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };
    fetchEvents();

    const subscription = supabaseBrowser
      .channel('public:invoice_events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invoice_events' }, (payload) => {
        setEvents((current) => [payload.new, ...current]);
      })
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(subscription);
    };
  }, []);

  const handleTestInvoice = async () => {
    if (!wallet) return;
    setTxLoading(true);
    setTxError('');
    try {
      // Example: Submit payment as test invoice (memo = invoice data; extend to MPT mint)
      const result = await xrplService.submitPayment(
        wallet,
        process.env.NEXT_PUBLIC_XRPL_RECEIVER_ADDRESS || 'rTestRecipient',
        '1000000', // 1 XRP drops
        'Test Invoice: Amount $100, Due 2026-02-01, Client: TestCo' // Memo for invoice details
      );
      console.log('Invoice payment success:', result);
      // Optional: Add to Supabase events after on-chain success
    } catch (err) {
      setTxError('Payment failed: ' + (err as Error).message);
    }
    setTxLoading(false);
  };

  if (loading) {
    return <p className="text-center py-32 text-gray-500 text-xl">Loading feed...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Invoice Feed</h2>

      {/* New: XRPL Wallet Connect Section */}
      <div className="p-4 bg-[#1e293b] rounded-lg border border-gray-800 mb-6">
        <h3 className="text-xl font-bold mb-4">Connect XRPL Wallet for Invoicing</h3>
        {!wallet ? (
          <XRPLConnect onConnect={(w) => setWallet(w)} />
        ) : (
          <div>
            <p>Connected: {wallet.address}</p>
            <p>Balance: {wallet.balance ? wallet.balance / 1000000 : 'Loading...'} XRP</p>
            <button 
              onClick={handleTestInvoice} 
              disabled={txLoading}
              className="mt-4 px-4 py-2 bg-green-500 rounded text-sm"
            >
              {txLoading ? 'Processing...' : 'Create Test Invoice (Payment/MPT)'}
            </button>
            {txError && <p className="text-red-500 mt-2">{txError}</p>}
          </div>
        )}
      </div>

      {/* Existing Feed */}
      {events.length === 0 ? (
        <div className="text-center py-32">
          <p className="text-3xl font-bold text-gray-500">No activity yet</p>
          <p className="mt-6 text-xl text-gray-400">Create an invoice to see events here like X posts</p>
        </div>
      ) : (
        events.map((event) => (
          <div key={event.id} className="p-4 bg-[#1e293b] rounded-lg border border-gray-800">
            <div className="flex items-center mb-2">
              <Image src="/1_ursadefi_logo.png" alt="UrsaDeFi" width={40} height={40} className="rounded-full" />
              <div className="ml-2">
                <p className="font-bold">UrsaDeFi User</p> {/* Fix empty bold p – add username or dynamic */}
                <p className="text-sm text-gray-400">{new Date(event.created_at).toLocaleString()}</p>
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