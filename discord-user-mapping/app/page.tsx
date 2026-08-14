import Image from 'next/image';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getProfileByDiscordId, getProfilesGroupedByPrefecture } from '@/lib/supabase';
import { prefectureName } from '@/lib/prefectures';
import { DiscordLoginButton } from '@/components/DiscordLoginButton';
import { UserMapExplorer } from '@/components/UserMapExplorer';

// セッション Cookie / DB を読むため動的レンダリングにする。
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
  const [profile, profilesByPrefecture] = await Promise.all([
    session ? getProfileByDiscordId(session.discordId) : Promise.resolve(null),
    getProfilesGroupedByPrefecture(),
  ]);

  const errorMessage = searchParams.error
    ? ERROR_MESSAGES[searchParams.error] ?? '不明なエラーが発生しました。'
    : null;

  const totalUsers = Object.values(profilesByPrefecture).reduce((n, list) => n + list.length, 0);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Discord User Mapping</h1>
        <p className="mt-1 text-sm text-discord-light/70">
          全国の登録メンバーを日本地図から探せます（現在 {totalUsers} 名）。
        </p>
      </header>

      {errorMessage && (
        <p className="rounded-md bg-red-500/15 px-4 py-3 text-center text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      {/* ログイン状態バー */}
      <section className="rounded-lg bg-discord-dark p-4">
        {!session ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-discord-light/70">
              ログインしてあなたのプロフィールを地図に登録しましょう。
            </p>
            <DiscordLoginButton />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            {profile?.avatar_url && (
              <Image
                src={profile.avatar_url}
                alt=""
                width={48}
                height={48}
                className="rounded-full"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{session.displayName}</p>
              <p className="text-xs text-discord-light/60">
                {profile?.prefecture_code
                  ? `${prefectureName(profile.prefecture_code) ?? '不明'}${profile.generation ? ` ・ ${profile.generation}` : ''}`
                  : '都道府県が未設定です'}
              </p>
            </div>
            <Link
              href="/profile/setup"
              className="rounded-md bg-discord-blurple px-3 py-1.5 text-sm font-semibold text-white hover:bg-discord-blurple-dark"
            >
              プロフィール編集
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-sm text-discord-light/50 underline hover:text-discord-light/80"
              >
                ログアウト
              </button>
            </form>
          </div>
        )}
      </section>

      {/* 日本地図 */}
      <section className="rounded-lg bg-discord-dark p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">日本地図</h2>
          <p className="flex items-center gap-1.5 text-xs text-discord-light/60">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-discord-green" />
            登録者あり（ホバー／タップで表示）
          </p>
        </div>
        <UserMapExplorer profilesByPrefecture={profilesByPrefecture} />
      </section>
    </main>
  );
}
