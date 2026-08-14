import Image from 'next/image';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getProfileByDiscordId } from '@/lib/supabase';
import { prefectureName } from '@/lib/prefectures';
import { DiscordLoginButton } from '@/components/DiscordLoginButton';

// セッション Cookie を読むため動的レンダリングにする。
export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'セキュリティ検証に失敗しました。もう一度お試しください。',
  auth_failed: '認証処理に失敗しました。時間をおいて再度お試しください。',
  missing_code_or_state: '認証情報が不足しています。もう一度お試しください。',
  not_authenticated: 'ログインが必要です。',
  access_denied: 'ログインがキャンセルされました。',
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = getSession();
  const profile = session ? await getProfileByDiscordId(session.discordId) : null;
  const errorMessage = searchParams.error
    ? ERROR_MESSAGES[searchParams.error] ?? '不明なエラーが発生しました。'
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-12">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Discord User Mapping</h1>
        <p className="mt-2 text-sm text-discord-light/70">
          Discord アカウントでログインしてプロフィールを登録します。
        </p>
      </header>

      {errorMessage && (
        <p className="w-full rounded-md bg-red-500/15 px-4 py-3 text-center text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      {!session ? (
        <DiscordLoginButton />
      ) : (
        <section className="w-full rounded-lg bg-discord-dark p-6">
          <div className="flex items-center gap-4">
            {profile?.avatar_url && (
              <Image
                src={profile.avatar_url}
                alt=""
                width={64}
                height={64}
                className="rounded-full"
              />
            )}
            <div>
              <p className="text-lg font-semibold">{session.displayName}</p>
              <p className="text-sm text-discord-light/60">
                {profile?.prefecture_code
                  ? `都道府県: ${prefectureName(profile.prefecture_code) ?? '不明'}`
                  : '都道府県が未設定です'}
              </p>
            </div>
          </div>

          {!profile?.prefecture_code && (
            <Link
              href="/profile/setup"
              className="mt-4 inline-block rounded-md bg-discord-blurple px-4 py-2 text-sm font-semibold text-white hover:bg-discord-blurple-dark"
            >
              都道府県を設定する
            </Link>
          )}

          <form action="/api/auth/logout" method="post" className="mt-4">
            <button
              type="submit"
              className="text-sm text-discord-light/50 underline hover:text-discord-light/80"
            >
              ログアウト
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
