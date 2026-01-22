cp src/app/dashboard/page.tsx src/app/dashboard/page.tsx.backup
cat << EOF > src/app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import XRPLConnect from '@/components/XRPLConnect';
import { xrplService } from '@/lib/xrpl-client';

export default function DashboardPage() {
  const [wallet, setWallet] = useState(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');
  const [uri, setUri] = useState('{"amount":100,"due":"2026-02-01","client":"TestCo"}');

  const handleMintMPT = async () => {
    if (!wallet) return;
    setTxLoading(true);
    setTxError('');
    try {
      const result = await xrplService.mintMPTInvoice(wallet, uri);
      console.log('MPT Invoice mint success:', result);
    } catch (err) {
      setTxError('Mint failed: ' + (err as Error).message);
    }
    setTxLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Invoice Dashboard</h2>

      <div className="p-4 bg-[#1e293b] rounded-lg border border-gray-800 mb-6">
        <h3 className="text-xl font-bold mb-4">Connect XRPL Wallet & Mint MPT Invoice</h3>
        {!wallet ? (
          <XRPLConnect onConnect={(w) => setWallet(w)} />
        ) : (
          <div>
            <p>Connected: {wallet.address}</p>
            <p>Balance: {wallet.balance ? wallet.balance / 1000000 : 'Loading...'} XRP</p>
            <input
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder="Invoice URI/JSON"
              className="w-full p-2 border mb-2"
            />
            <button 
              onClick={handleMintMPT} 
              disabled={txLoading || !uri}
              className="mt-4 px-4 py-2 bg-green-500 rounded text-sm"
            >
              {txLoading ? 'Minting...' : 'Mint Test MPT Invoice'}
            </button>
            {txError && <p className="text-red-500 mt-2">{txError}</p>}
          </div>
        )}
      </div>

      <div className="text-center py-32">
        <p className="text-3xl font-bold text-gray-500">No invoices yet</p>
        <p className="mt-6 text-xl text-gray-400">Mint an MPT invoice above to get started</p>
      </div>
    </div>
  );
}