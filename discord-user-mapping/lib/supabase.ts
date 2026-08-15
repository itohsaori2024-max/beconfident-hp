/**
 * Supabase クライアント。
 *
 * - `getSupabaseAdmin()` : service_role キーを使うサーバー専用クライアント。
 *   RLS をバイパスするため、必ずサーバー（Route Handler / Server Action）でのみ使用する。
 * - `createSupabaseBrowserClient()` : anon キーを使うクライアント用。RLS が適用される。
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { serverEnv, publicEnv } from './env';
import type { Profile, ProfileUpsertInput, ProfileDetailsInput } from './types';

let adminClient: SupabaseClient | null = null;

/** サーバー専用の管理クライアント（シングルトン）。 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClient;
}

/** ブラウザ用クライアント（anon キー）。 */
export function createSupabaseBrowserClient(): SupabaseClient {
  return createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Discord ログイン時にプロフィールを upsert する。
 * 既存レコードがあれば Discord 由来の情報のみ更新し、prefecture_code は保持する。
 * 新規レコードなら prefecture_code は null で作成される（後続の設定画面で必須入力）。
 */
export async function upsertProfileFromDiscord(input: ProfileUpsertInput): Promise<Profile> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        discord_id: input.discord_id,
        discord_username: input.discord_username,
        display_name: input.display_name,
        avatar_url: input.avatar_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'discord_id' },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`プロフィールの保存に失敗しました: ${error.message}`);
  }

  return data as Profile;
}

/** discord_id からプロフィールを取得する。存在しなければ null。 */
export async function getProfileByDiscordId(discordId: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('discord_id', discordId)
    .maybeSingle();

  if (error) {
    throw new Error(`プロフィールの取得に失敗しました: ${error.message}`);
  }

  return (data as Profile) ?? null;
}

/**
 * プロフィール詳細（都道府県コード・期生・ビジネス内容・SNS URL）を更新する。
 */
export async function updateProfileDetails(
  discordId: string,
  details: ProfileDetailsInput,
): Promise<Profile> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .update({
      prefecture_code: details.prefecture_code,
      generation: details.generation,
      business_type: details.business_type,
      instagram_url: details.instagram_url,
      threads_url: details.threads_url,
      is_overseas: details.is_overseas,
      overseas_label: details.overseas_label,
      updated_at: new Date().toISOString(),
    })
    .eq('discord_id', discordId)
    .select()
    .single();

  if (error) {
    throw new Error(`プロフィールの更新に失敗しました: ${error.message}`);
  }

  return data as Profile;
}

/** 海外・その他（都道府県以外）のプロフィールを取得する。 */
export async function getOverseasProfiles(): Promise<Profile[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_overseas', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`海外プロフィールの取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as Profile[];
}

/**
 * 地図表示用に、都道府県コードが設定済みの全プロフィールを取得し、
 * 都道府県コードごとにグループ化して返す（Record<code, Profile[]>）。
 */
export async function getProfilesGroupedByPrefecture(): Promise<Record<string, Profile[]>> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .not('prefecture_code', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`プロフィール一覧の取得に失敗しました: ${error.message}`);
  }

  const grouped: Record<string, Profile[]> = {};
  for (const row of (data ?? []) as Profile[]) {
    const code = row.prefecture_code;
    if (!code) continue;
    (grouped[code] ??= []).push(row);
  }
  return grouped;
}
