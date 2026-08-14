/**
 * 環境変数を型安全に読み出すためのヘルパー。
 * サーバー専用の値（シークレット）とクライアント公開値（NEXT_PUBLIC_*）を区別する。
 *
 * 値は必ず trim してから扱う。環境変数管理画面へ .env をまとめて貼り付けた際に
 * 末尾の空白・改行が紛れ込むことがあり、そのまま使うと Supabase 等が
 * 「Invalid path specified in request URL」等のエラーを返すため。
 */

/** 前後の空白・改行を除去する。 */
function clean(value: string | undefined): string | undefined {
  if (value == null) return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/** URL 値を掃除する（trim ＋ 末尾スラッシュ除去）。 */
function cleanUrl(value: string | undefined): string | undefined {
  const t = clean(value);
  return t ? t.replace(/\/+$/, '') : t;
}

function required(name: string, value: string | undefined): string {
  const v = clean(value);
  if (!v) {
    throw new Error(
      `環境変数 ${name} が設定されていません。.env.local を確認してください（.env.example を参照）。`,
    );
  }
  return v;
}

function requiredUrl(name: string, value: string | undefined): string {
  return required(name, cleanUrl(value));
}

/** サーバーサイド専用の環境変数。クライアントバンドルに含めてはいけない。 */
export const serverEnv = {
  get discordClientId() {
    return required('DISCORD_CLIENT_ID', process.env.DISCORD_CLIENT_ID);
  },
  get discordClientSecret() {
    return required('DISCORD_CLIENT_SECRET', process.env.DISCORD_CLIENT_SECRET);
  },
  get discordRedirectUri() {
    return requiredUrl('DISCORD_REDIRECT_URI', process.env.DISCORD_REDIRECT_URI);
  },
  get supabaseUrl() {
    return requiredUrl('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseServiceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get sessionSecret() {
    return required('SESSION_SECRET', process.env.SESSION_SECRET);
  },
  get appUrl() {
    return cleanUrl(process.env.NEXT_PUBLIC_APP_URL) ?? 'http://localhost:3000';
  },
};

/** クライアントからも参照できる公開環境変数。 */
export const publicEnv = {
  discordClientId: clean(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID) ?? '',
  supabaseUrl: cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? '',
  supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ?? '',
  appUrl: cleanUrl(process.env.NEXT_PUBLIC_APP_URL) ?? 'http://localhost:3000',
};
