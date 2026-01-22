'use client';

import { useState } from 'react';
import { xrplService } from '@/lib/xrpl-client';

export default function XRPLConnect({ onConnect }: { onConnect: (wallet: any) => void }) {
  const [seed, setSeed ] = useState(process.env.XRPL_TEST_SEED || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      const wallet = xrplService.createWalletFromSeed(seed);
      const balance = await xrplService.getBalance(wallet.address);
      onConnect({ ...wallet, balance });
    } catch (err) {
      setError('Connection failed: ' + (err as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded">
      <input
        type="password"
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
        placeholder="XRPL Testnet Seed"
        className="w-full p-2 border mb-2"
      />
      <button
        onClick={handleConnect}
        disabled={loading || !seed}
        className="bg-blue-500 text-white p-2 rounded"
      >
        {loading ? 'Connecting...' : 'Connect XRPL Wallet'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <p className="text-sm mt-2">For testnet—use faucet for seeds/XRP.</p>
    </div>
  );
}