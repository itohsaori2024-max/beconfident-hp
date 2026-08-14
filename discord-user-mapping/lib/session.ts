/**
 * 軽量なセッション管理。
 *
 * この第一歩では専用の認証基盤を導入せず、HMAC-SHA256 で署名した Cookie に
 * 最小限のユーザー情報を格納する。改ざんは署名検証で検出できるが、値自体は
 * 暗号化していないため機微情報は入れない（Discord ID と表示名のみ）。
 *
 * Cookie 名: `dum_session`
 * 形式: base64url(JSON).base64url(HMAC)
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { serverEnv } from './env';
import type { SessionPayload } from './types';

export const SESSION_COOKIE = 'dum_session';
export const OAUTH_STATE_COOKIE = 'dum_oauth_state';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7日間

function base64urlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(data: string): string {
  return createHmac('sha256', serverEnv.sessionSecret).update(data).digest('base64url');
}

/** ペイロードを署名付き文字列にシリアライズする。 */
export function serializeSession(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const encoded = base64urlEncode(json);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

/** 署名付き文字列を検証してペイロードに戻す。不正なら null。 */
export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf8');
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

/** セッション Cookie を書き込む。 */
export function setSessionCookie(payload: SessionPayload): void {
  cookies().set(SESSION_COOKIE, serializeSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/** 現在のセッションを取得する（Server Component / Route Handler 用）。 */
export function getSession(): SessionPayload | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

/** セッション Cookie を削除する（ログアウト）。 */
export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}
