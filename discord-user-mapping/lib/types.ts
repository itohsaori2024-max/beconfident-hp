/**
 * アプリ全体で共有する型定義。
 */

/** Supabase `profiles` テーブルの行。 */
export interface Profile {
  /** 主キー（uuid）。Supabase が自動採番。 */
  id: string;
  /** Discord のユーザーID（スノーフレーク）。一意。 */
  discord_id: string;
  /** Discord のユーザー名（username） */
  discord_username: string;
  /** 表示名（global_name もしくは username） */
  display_name: string;
  /** アバター画像 URL */
  avatar_url: string | null;
  /** 必須項目：都道府県コード（JIS X 0401、"01"〜"47"）。初回ログイン直後は null。 */
  prefecture_code: string | null;
  created_at: string;
  updated_at: string;
}

/** プロフィール作成／更新時に upsert する入力。 */
export interface ProfileUpsertInput {
  discord_id: string;
  discord_username: string;
  display_name: string;
  avatar_url: string | null;
  prefecture_code?: string | null;
}

/** セッション Cookie に格納する最小限のユーザー情報。 */
export interface SessionPayload {
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
  /** UNIX 秒。発行時刻。 */
  issuedAt: number;
}
