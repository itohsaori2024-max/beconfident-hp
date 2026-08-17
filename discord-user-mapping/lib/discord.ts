/**
 * Discord OAuth2 のサーバーサイドヘルパー。
 * 認可 URL の生成、認可コードのトークン交換、ユーザー情報の取得を行う。
 * ドキュメント: https://discord.com/developers/docs/topics/oauth2
 */

import { serverEnv } from './env';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * OAuth2 で要求するスコープ。
 * - identify: ユーザー名・アイコンを取得
 * - guilds: 参加サーバー一覧を取得（塾サーバーのメンバーか確認するため）
 */
export const DISCORD_SCOPES = ['identify', 'guilds'] as const;

/**
 * Discord の認可画面へのURLを生成する。
 * @param state CSRF 対策用のランダムな state 値
 */
export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: serverEnv.discordClientId,
    redirect_uri: serverEnv.discordRedirectUri,
    response_type: 'code',
    scope: DISCORD_SCOPES.join(' '),
    state,
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

/**
 * 認可コードをアクセストークンに交換する。
 * @param code Discord から返ってきた認可コード
 */
export async function exchangeCodeForToken(code: string): Promise<DiscordTokenResponse> {
  const body = new URLSearchParams({
    client_id: serverEnv.discordClientId,
    client_secret: serverEnv.discordClientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: serverEnv.discordRedirectUri,
  });

  const res = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord トークン交換に失敗しました (${res.status}): ${text}`);
  }

  return (await res.json()) as DiscordTokenResponse;
}

/** Discord API が返す /users/@me のレスポンス（抜粋）。 */
export interface DiscordUser {
  id: string;
  /** 新ユーザー名システムのユーザー名（例: "taro"） */
  username: string;
  /** レガシーの4桁識別子。新システムでは "0"。 */
  discriminator: string;
  /** 表示名（グローバルネーム）。未設定なら null。 */
  global_name: string | null;
  /** アバターのハッシュ。未設定なら null。 */
  avatar: string | null;
}

/**
 * アクセストークンでログインユーザーの情報を取得する。
 */
export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord ユーザー取得に失敗しました (${res.status}): ${text}`);
  }

  return (await res.json()) as DiscordUser;
}

/**
 * Discord ユーザーのアバター画像 URL を組み立てる。
 * アバター未設定の場合はデフォルトアバターを返す。
 * https://discord.com/developers/docs/reference#image-formatting
 */
export function buildAvatarUrl(user: DiscordUser, size = 256): string {
  if (user.avatar) {
    // アニメーションアバター（"a_" 始まり）は gif、それ以外は png
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=${size}`;
  }

  // デフォルトアバター。新ユーザー名システムでは (id >> 22) % 6 で決まる。
  const index = Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

/** 表示に使う名前を決める（global_name を優先、なければ username）。 */
export function resolveDisplayName(user: DiscordUser): string {
  return user.global_name?.trim() || user.username;
}

/** Discord API が返す参加サーバー（guild）の抜粋。 */
export interface DiscordGuild {
  id: string;
  name: string;
}

/** ログインユーザーが参加しているサーバー一覧を取得する（guilds スコープが必要）。 */
export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const res = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord サーバー一覧の取得に失敗しました (${res.status}): ${text}`);
  }

  return (await res.json()) as DiscordGuild[];
}
