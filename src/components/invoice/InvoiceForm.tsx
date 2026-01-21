'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabaseBrowser } from '@/lib/supabase';
import { generateInvoicePDF } from './InvoicePDF';
import QRCode from 'qrcode';

const schema = z.object({
  invoiceNumber: z.string().optional(),
  clientName: z.string().min(1, 'Client name required'),
  amount_xrp: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Positive number required'),
  dueDate: z.string().min(1, 'Due date required'),
  description: z.string().min(1, 'Description required'),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['weekly', 'monthly']).optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  onSuccess: () => void;
};

export default function InvoiceForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isRecurring: false },
  });

  // @ts-expect-error Hook Form watch incompatible with Compiler
  // eslint-disable-next-line react-hooks/incompatible-library
  const isRecurring = watch('isRecurring');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setMessage('');

    const amountXRP = Number(data.amount_xrp);

    const { data: newInvoice, error: invoiceError } = await supabaseBrowser
      .from('invoices')
      .insert({
        ...(data.invoiceNumber && { invoice_number: data.invoiceNumber }), // Optional, null if blank
        client_name: data.clientName,
        amount: amountXRP,
        due_date: data.dueDate,
        description: data.description,
        status: 'pending',
        is_recurring: data.isRecurring,
        recurring_interval: data.recurringInterval,
      })
      .select('*')
      .single();

    if (invoiceError || !newInvoice) {
      setMessage(`Error: ${invoiceError?.message}`);
      setLoading(false);
      return;
    }

    const generateTag = () => {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0];
    };

    const destinationTag = generateTag();

    await supabaseBrowser
      .from('invoices')
      .update({ destination_tag: destinationTag })
      .eq('id', newInvoice.id);

    let metadataTxHash = '';
    try {
      const res = await fetch('/api/invoice/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: newInvoice.id,
          description: data.description,
          timestamp: new Date().toISOString(),
          clientName: data.clientName,
          amount_xrp: amountXRP.toFixed(2),
          isRecurring: data.isRecurring,
          recurringInterval: data.recurringInterval,
        }),
      });
      if (res.ok) {
        const parsed = await res.json();
        metadataTxHash = parsed.txHash || '';
      } else {
        setMessage(`Metadata failed: ${await res.text()}`);
      }
    } catch (err: Error) {
      setMessage(`Metadata error: ${err.message}`);
    }

    const receivingAddress = process.env.NEXT_PUBLIC_XRPL_RECEIVER_ADDRESS || '';
    const paymentUri = `xrp:${receivingAddress}?dt=${destinationTag}&amount=${amountXRP.toFixed(6)}`;

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(paymentUri, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 300,
        color: { dark: '#ffffff', light: '#00000000' },
      });
    } catch (err: Error) {
      setMessage('QR failed: ' + err.message);
    }

    generateInvoicePDF({
      id: String(newInvoice.id),
      clientName: data.clientName,
      dueDate: data.dueDate,
      description: data.description,
      amount_xrp: amountXRP,
      destination_tag: destinationTag,
      receivingAddress,
      qrDataUrl,
      metadataTxHash,
      issuedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      isRecurring: data.isRecurring,
      recurringInterval: data.recurringInterval,
    });

    setMessage('Invoice created successfully!');
    reset();
    onSuccess();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-inter">
      <div>
        <input {...register('invoiceNumber')} placeholder="Invoice Number (optional)" className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white" disabled={loading} />
      </div>
      <div>
        <input {...register('clientName')} placeholder="Client Name" className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white" disabled={loading} />
        {errors.clientName && <p className="text-red-400 mt-1">{errors.clientName.message}</p>}
      </div>
      <div>
        <textarea {...register('description')} placeholder="Description" rows={4} className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white" disabled={loading} />
        {errors.description && <p className="text-red-400 mt-1">{errors.description.message}</p>}
      </div>
      <div>
        <input {...register('amount_xrp')} placeholder="Amount (XRP)" className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white" disabled={loading} />
        {errors.amount_xrp && <p className="text-red-400 mt-1">{errors.amount_xrp.message}</p>}
      </div>
      <div>
        <input {...register('dueDate')} type="date" className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white" disabled={loading} />
        {errors.dueDate && <p className="text-red-400 mt-1">{errors.dueDate.message}</p>}
      </div>
      <div className="flex items-center space-x-2">
        <input type="checkbox" {...register('isRecurring')} id="isRecurring" className="h-4 w-4" disabled={loading} />
        <label htmlFor="isRecurring" className="text-gray-400">Recurring</label>
      </div>
      {isRecurring ? (
        <div>
          <select {...register('recurringInterval')} className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white" disabled={loading}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      ) : null}
      <button type="submit" disabled={loading} className="w-full py-4 bg-[#1D9BF0] hover:bg-[#1a8cd8] rounded-xl font-medium disabled:opacity-70 transition">
        {loading ? 'Creating...' : 'Create Invoice'}
      </button>
      {message && (
        <p className={`text-center font-medium ${message.includes('error') || message.includes('failed') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
    </form>
  );
}