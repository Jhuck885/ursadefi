'use client';

import { useState, useEffect } from 'react';
import { Magic } from 'magic-sdk';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

const magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push('/dashboard'); // Redirect to dashboard if logged in
    }
  }, [session, router]);

  const handleMagicLogin = async () => {
    setLoading(true);
    try {
      const didToken = await magic.auth.loginWithEmailOTP({ email });
      const res = await signIn('credentials', {
        didToken,
        redirect: false,
      });
      if (res?.ok) {
        router.push('/dashboard'); // Force redirect after success
      }
    } catch (err) {
      console.error('Magic login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn('google');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-6">
      <div className="w-full max-w-md p-4 bg-[#1e293b] rounded-lg border border-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-center">Login to UrsaDeFi</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full p-3 mb-4 bg[#1e293b] border border-gray-800 rounded-lg text-white focus:border[#1D9BF0] focus:outline-none"
        />
        <button
          onClick={handleMagicLogin}
          disabled={loading}
          className="w-full py-3 bg[#1D9BF0] rounded-full font-bold hover:bg[#1a8cd8] transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login with Email (Magic)'}
        </button>
        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 mt-4 bg[#1e293b] border border[#1D9BF0] rounded-full font-bold hover:bg[#2d3a4e] hover:border[#1D9BF0]/70 transition-colors"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
}