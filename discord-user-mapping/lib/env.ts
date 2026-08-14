/**
 * 環境変数を型安全に読み出すためのヘルパー。
 * サーバー専用の値（シークレット）とクライアント公開値（NEXT_PUBLIC_*）を区別する。
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `環境変数 ${name} が設定されていません。.env.local を確認してください（.env.example を参照）。`,
    );
  }
  return value;
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
    return required('DISCORD_REDIRECT_URI', process.env.DISCORD_REDIRECT_URI);
  },
  get supabaseUrl() {
    return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseServiceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get sessionSecret() {
    return required('SESSION_SECRET', process.env.SESSION_SECRET);
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  },
};

/** クライアントからも参照できる公開環境変数。 */
export const publicEnv = {
  discordClientId: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? '',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
};
