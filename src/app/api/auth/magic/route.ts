import { NextResponse } from 'next/server';
import { MagicAdminSDK } from '@magic-sdk/admin';

const magicAdmin = new MagicAdminSDK(process.env.MAGIC_SECRET_KEY);

export async function POST(req) {
  try {
    const didToken = req.headers.get('authorization')?.split('Bearer ')[1];
    magicAdmin.token.validate(didToken);
    const metadata = await magicAdmin.users.getMetadataByToken(didToken);
    // Set session (e.g., cookie or next-auth)
    // For next-auth, return NextResponse.json({ success: true, user: metadata }); and use signIn in client
    return NextResponse.json({ success: true, user: metadata });
  } catch (error) {
  console.error('Auth failed', error);
  return NextResponse.json({ error: 'Auth failed' }, { status: 401 });
  }
}