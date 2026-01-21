// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

// Browser client (client components)
export const supabaseBrowser = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server client factory (server components & route handlers)
export const supabaseServer = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    }
  );
};