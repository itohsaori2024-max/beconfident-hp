/**
 * GET /api/auth/discord/callback
 * Discord OAuth2 のコールバック。
 *   1. state を検証（CSRF 対策）
 *   2. 認可コードをアクセストークンに交換
 *   3. Discord ユーザー情報（名前・アイコン）を取得
 *   4. Supabase の profiles に upsert
 *   5. セッション Cookie を発行
 *   6. プロフィール未完成（都道府県コード未設定）なら設定画面へ、完成済みならトップへ
 */

import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  exchangeCodeForToken,
  fetchDiscordUser,
  fetchUserGuilds,
  buildAvatarUrl,
  resolveDisplayName,
} from '@/lib/discord';
import { upsertProfileFromDiscord } from '@/lib/supabase';
import { setSessionCookie, OAUTH_STATE_COOKIE } from '@/lib/session';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const appUrl = serverEnv.appUrl;

  // ユーザーが同意をキャンセルした場合など
  if (error) {
    return NextResponse.redirect(`${appUrl}/?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/?error=missing_code_or_state`);
  }

  // --- CSRF: Cookie に保存した state と一致するか検証 ---
  const cookieState = cookies().get(OAUTH_STATE_COOKIE)?.value;
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_state`);
  }
  // 使い終わった state Cookie は破棄
  cookies().delete(OAUTH_STATE_COOKIE);

  try {
    // --- トークン交換 → ユーザー取得 ---
    const token = await exchangeCodeForToken(code);
    const discordUser = await fetchDiscordUser(token.access_token);

    // --- 塾サーバーのメンバーか確認（DISCORD_GUILD_ID 設定時のみ） ---
    const guildId = serverEnv.discordGuildId;
    if (guildId) {
      const guilds = await fetchUserGuilds(token.access_token);
      const isMember = guilds.some((g) => g.id === guildId);
      if (!isMember) {
        return NextResponse.redirect(`${appUrl}/?error=not_member`);
      }
    }

    const displayName = resolveDisplayName(discordUser);
    const avatarUrl = buildAvatarUrl(discordUser);

    // --- Supabase へ保存（prefecture_code は既存値を保持／新規は null） ---
    const profile = await upsertProfileFromDiscord({
      discord_id: discordUser.id,
      discord_username: discordUser.username,
      display_name: displayName,
      avatar_url: avatarUrl,
    });

    // --- セッション発行 ---
    setSessionCookie({
      discordId: discordUser.id,
      displayName,
      avatarUrl,
      issuedAt: Math.floor(Date.now() / 1000),
    });

    // --- 必須項目（都道府県コード）が未設定ならプロフィール設定へ ---
    const destination = profile.prefecture_code ? '/' : '/profile/setup';
    return NextResponse.redirect(`${appUrl}${destination}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown_error';
    console.error('[discord/callback] 認証処理に失敗:', message);
    return NextResponse.redirect(`${appUrl}/?error=auth_failed`);
  }
}
