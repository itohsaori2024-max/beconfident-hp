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
  /** アバター画像 URL（プロフ写真） */
  avatar_url: string | null;
  /** 必須項目：都道府県コード（JIS X 0401、"01"〜"47"）。初回ログイン直後は null。 */
  prefecture_code: string | null;
  /** 必須項目：期生情報（例「3期生」）。初回ログイン直後は空文字。 */
  generation: string;
  /** 必須項目：ビジネス内容（何を売っているか）。初回ログイン直後は空文字。 */
  business_type: string;
  /** 任意項目：Instagram の URL */
  instagram_url: string | null;
  /** 任意項目：Threads の URL */
  threads_url: string | null;
  /** 海外・その他（都道府県以外）かどうか。true のとき prefecture_code は null。 */
  is_overseas: boolean;
  /** 任意：国・地域名（例「アメリカ」）。海外の場合のみ使用。 */
  overseas_label: string | null;
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

/** プロフィール設定画面（/profile/setup）で保存する入力。 */
export interface ProfileDetailsInput {
  /** 国内の場合は都道府県コード。海外の場合は null。 */
  prefecture_code: string | null;
  generation: string;
  business_type: string;
  instagram_url: string | null;
  threads_url: string | null;
  is_overseas: boolean;
  overseas_label: string | null;
}

/** セッション Cookie に格納する最小限のユーザー情報。 */
export interface SessionPayload {
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
  /** UNIX 秒。発行時刻。 */
  issuedAt: number;
}
