/**
 * GET /api/auth/discord
 * Discord OAuth2 のログイン開始エンドポイント。
 * CSRF 対策の state を生成して Cookie に保存し、Discord の認可画面へリダイレクトする。
 */

import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { buildAuthorizeUrl } from '@/lib/discord';
import { OAUTH_STATE_COOKIE } from '@/lib/session';

// crypto / Discord への外部通信を行うため Node ランタイムを明示する。
export const runtime = 'nodejs';

export async function GET() {
  const state = randomBytes(16).toString('hex');

  cookies().set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10分
  });

  return NextResponse.redirect(buildAuthorizeUrl(state));
}
