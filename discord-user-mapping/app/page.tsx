import Image from 'next/image';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getProfileByDiscordId, getProfilesGroupedByPrefecture } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
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
  // DB 取得に失敗してもページ全体をクラッシュさせず、ログイン等は表示できるようにする。
  const [profile, profilesByPrefecture] = await Promise.all([
    session
      ? getProfileByDiscordId(session.discordId).catch((e) => {
          console.error('[home] プロフィール取得に失敗:', e);
          return null;
        })
      : Promise.resolve(null),
    getProfilesGroupedByPrefecture().catch((e) => {
      console.error('[home] プロフィール一覧の取得に失敗:', e);
      return {} as Record<string, Profile[]>;
    }),
  ]);

  const errorMessage = searchParams.error
    ? ERROR_MESSAGES[searchParams.error] ?? '不明なエラーが発生しました。'
    : null;

  const totalUsers = Object.values(profilesByPrefecture).reduce((n, list) => n + list.length, 0);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">さおり塾 メンバーマップ</h1>
        <p className="mt-1 text-sm text-neutral-500">
          全国の塾生を日本地図から探せます（現在 {totalUsers} 名）。
        </p>
      </header>

      {errorMessage && (
        <p className="rounded-md bg-red-100 px-4 py-3 text-center text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      {/* ログイン状態バー */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        {!session ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-neutral-500">
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
              <p className="font-semibold text-neutral-800">{session.displayName}</p>
              <p className="text-xs text-neutral-500">
                {profile?.prefecture_code
                  ? `${prefectureName(profile.prefecture_code) ?? '不明'}${profile.generation ? ` ・ ${profile.generation}` : ''}`
                  : '都道府県が未設定です'}
              </p>
            </div>
            <Link
              href="/profile/setup"
              className="rounded-md bg-brand-pink px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-pink-dark"
            >
              プロフィール編集
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-sm text-neutral-400 underline hover:text-neutral-600"
              >
                ログアウト
              </button>
            </form>
          </div>
        )}
      </section>

      {/* 日本地図 */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-end">
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-pink" />
            塾生のいる都道府県（ホバー／タップで表示）
          </p>
        </div>
        <UserMapExplorer profilesByPrefecture={profilesByPrefecture} />
      </section>
    </main>
  );
}
