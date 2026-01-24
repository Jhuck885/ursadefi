'use client';

import { useForm, watch } from 'react-hook-form';
import { useState } from 'react';
import { Client } from 'xrpl';
import jsPDF from 'jspdf';

interface InvoiceData {
  clientName: string;
  amount_usd: number;
  amount_xrp: number;
  dueDate: string;
  description: string;
  isRecurring: boolean;
  recurringInterval?: 'weekly' | 'monthly';
}

export default function InvoiceForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, watch } = useForm<InvoiceData>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState<any>(null); // Integrate with ClientSessionProvider or prop for real wallet

  // Placeholder: Fetch wallet from context/provider
  useEffect(() => {
    // Simulate or hook into global wallet state
    setWallet({ address: 'rTestAddress', sign: (tx) => ({ tx_blob: 'signed_blob' }) }); // Replace with real
  }, []);

  const generatePDF = (data: InvoiceData) => {
    const doc = new jsPDF();
    doc.text('UrsaDeFi Invoice', 10, 10);
    doc.text(`Client: ${data.clientName}`, 10, 20);
    doc.text(`Amount: $${data.amount_usd} (${data.amount_xrp} XRP)`, 10, 30);
    doc.text(`Due: ${data.dueDate}`, 10, 40);
    doc.text(`Description: ${data.description}`, 10, 50);
    if (data.isRecurring) doc.text(`Recurring: Every ${data.recurringInterval}`, 10, 60);
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    doc.save('ursadefi_invoice.pdf');
    return pdfUrl; // For mint URI
  };

  const mintMPT = async (data: InvoiceData, pdfUrl: string) => {
    if (!wallet) throw new Error('Wallet not connected');
    const client = new Client('wss://s.altnet.rippletest.net:51233');
    await client.connect();
    try {
      const memoData = JSON.stringify({ ...data, pdfUrl }); // Embed data for RWA
      const prepared = await client.autofill({
        TransactionType: 'NFTokenMint',
        Account: wallet.address,
        URI: Buffer.from(pdfUrl).toString('hex'), // Or IPFS for production
        Flags: 8, // Transferable RWA
        NFTokenTaxon: 0,
        Memos: [{ Memo: { MemoData: Buffer.from(memoData).toString('hex') } }],
      });
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);
      return result;
    } finally {
      await client.disconnect();
    }
  };

  const onSubmit = async (data: InvoiceData) => {
    setLoading(true);
    setError('');
    try {
      const pdfUrl = generatePDF(data);
      const mintResult = await mintMPT(data, pdfUrl);
      console.log('Minted MPT:', mintResult);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Fields as before */}
      <div>
        <label className="block text-sm font-medium mb-1">Client Name</label>
        <input {...register('clientName', { required: true })} className="w-full p-3 bg-[#1e293b] rounded-lg border border-gray-800" />
      </div>
      {/* ... Other fields: amount_usd, amount_xrp, dueDate, description */}
      <div className="flex items-center">
        <input type="checkbox" {...register('isRecurring')} id="isRecurring" className="mr-2" />
        <label htmlFor="isRecurring">Recurring</label>
      </div>
      {watch('isRecurring') && (
        <div>
          <label className="block text-sm font-medium mb-1">Interval</label>
          <select {...register('recurringInterval', { required: true })} className="w-full p-3 bg-[#1e293b] rounded-lg border border-gray-800">
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      )}
      <button type="submit" disabled={loading || !wallet} className="w-full py-4 bg-[#1D9BF0] rounded-full font-bold">
        {loading ? 'Minting...' : 'Create & Mint Invoice'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}