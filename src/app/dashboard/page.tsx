'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import Image from 'next/image';

export default function DashboardPage() {
  const [events, setEvents] = useState<InvoiceEvent[]>([]); 
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <p className="text-center py-32 text-gray-500 text-xl">Loading feed...</p>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-32">
        <p className="text-3xl font-bold text-gray-500">No activity yet</p>
        <p className="mt-6 text-xl text-gray-400">Create an invoice to see events here like X posts</p>
      </div>
    );
  }

  return (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold mb-6">Invoice Feed</h2>
    {events.map((event) => (
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
    ))}
  </div>
);
}