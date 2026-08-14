/**
 * POST /api/auth/logout
 * セッション Cookie を破棄してトップへ戻す。
 */

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST() {
  clearSessionCookie();
  return NextResponse.redirect(`${serverEnv.appUrl}/`, { status: 303 });
}
