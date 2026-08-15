'use client';

/**
 * 都道府県ポップアップ（カード型UI）。
 * その県に所属するユーザー一覧を縦リストで表示する。複数人はスクロール。
 */

import Image from 'next/image';
import type { Profile } from '@/lib/types';
import { prefectureName } from '@/lib/prefectures';

/**
 * 表示名から「下の名前」を取り出す。
 * 「伊藤 沙織」→「沙織」のように、空白（半角/全角）で区切った最後の要素を使う。
 * 区切りが無ければ全体をそのまま返す。
 */
function givenName(fullName: string): string {
  const parts = fullName.trim().split(/[\s　]+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : fullName.trim();
}

/** 名前の頭文字（アバター未設定時のフォールバック）。 */
function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function ContactButtons({ profile }: { profile: Profile }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {/* Discord DM */}
      <a
        href={`https://discord.com/users/${profile.discord_id}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Discord で DM を開く"
        className="inline-flex items-center gap-1.5 rounded-md bg-discord-blurple px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-discord-blurple-dark"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.317 4.369A19.79 19.79 0 0016.558 3.2a.074.074 0 00-.079.037c-.34.607-.719 1.4-.984 2.02a18.27 18.27 0 00-5.487 0 12.6 12.6 0 00-.997-2.02.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C1.533 7.55.955 10.65 1.24 13.71a.082.082 0 00.031.056 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.1 13.1 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.009c.12.099.246.198.373.292a.077.077 0 01-.006.127c-.598.35-1.22.645-1.873.892a.076.076 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.032-.055c.5-3.58-.838-6.653-2.396-9.313a.06.06 0 00-.031-.028zM8.02 12.86c-1.183 0-2.157-1.086-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.211 0 2.176 1.096 2.157 2.42 0 1.334-.955 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.086-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.211 0 2.176 1.096 2.157 2.42 0 1.334-.946 2.42-2.157 2.42z" />
        </svg>
        Discord
      </a>

      {/* Instagram（登録時のみ） */}
      {profile.instagram_url && (
        <a
          href={profile.instagram_url}
          target="_blank"
          rel="noopener noreferrer"
          title="Instagram を開く"
          className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 px-2.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.68A6.16 6.16 0 1018.16 12 6.16 6.16 0 0012 5.84zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4zm6.4-10.4a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z" />
          </svg>
          Instagram
        </a>
      )}

      {/* Threads（登録時のみ） */}
      {profile.threads_url && (
        <a
          href={profile.threads_url}
          target="_blank"
          rel="noopener noreferrer"
          title="Threads を開く"
          className="inline-flex items-center gap-1.5 rounded-md bg-black px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
        >
          <svg width="14" height="14" viewBox="0 0 192 192" fill="currentColor" aria-hidden="true">
            <path d="M141.5 88.5c-.6-.3-1.3-.6-1.9-.9-1.1-20.7-12.4-32.5-31.4-32.6h-.3c-11.4 0-20.8 4.8-26.7 13.7l10.5 7.2c4.3-6.6 11.2-8 16.2-8h.2c6.3 0 11 1.8 14.1 5.4 2.2 2.6 3.7 6.2 4.5 10.7-5.8-1-12-1.3-18.7-.9-18.8 1.1-30.9 12.1-30.1 27.4.4 7.8 4.3 14.5 10.9 18.9 5.6 3.7 12.8 5.5 20.3 5.1 9.9-.5 17.7-4.3 23.1-11.2 4.1-5.2 6.7-12 7.9-20.5 4.7 2.9 8.3 6.6 10.2 11.1 3.3 7.6 3.5 20-6.7 30.2-8.9 8.9-19.6 12.7-35.9 12.8-18 -.1-31.7-5.9-40.5-17.2-8.3-10.5-12.6-25.8-12.8-45.3.2-19.5 4.5-34.8 12.8-45.3 8.8-11.3 22.5-17.1 40.5-17.2 18.1.1 32 5.9 41.4 17.3 4.6 5.6 8.1 12.6 10.4 20.8l12.3-3.3c-2.7-10.1-7-18.8-12.8-25.9-12-14.6-29.6-22.1-52.2-22.3h-.1c-22.5.2-39.8 7.7-51.4 22.4C24.4 55.9 19.4 74.2 19.2 96v.1c.2 21.8 5.2 40.1 14.9 54.4 11.6 14.7 28.9 22.2 51.4 22.4h.1c20 -.1 34.1-5.4 45.7-17 15.2-15.2 14.8-34.2 9.8-45.9-3.6-8.4-10.4-15.2-19.6-19.9zm-33.3 34c-8.3.5-16.9-3.3-17.3-11.2-.3-5.8 4.1-12.3 17.8-13.1 1.6-.1 3.1-.1 4.6-.1 5 0 9.6.5 13.8 1.4-1.6 19.5-10.7 22.6-18.9 23z" />
          </svg>
          Threads
        </a>
      )}
    </div>
  );
}

function UserCard({ profile }: { profile: Profile }) {
  return (
    <li className="flex gap-3 rounded-lg bg-neutral-50 p-3">
      {/* 丸型プロフ写真 */}
      <div className="shrink-0">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-pink/50"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-pink-soft text-lg font-bold text-brand-pink-dark">
            {initial(givenName(profile.display_name))}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-neutral-800">{givenName(profile.display_name)}</p>
          {/* 期生バッジ */}
          {profile.generation && (
            <span className="shrink-0 rounded-full bg-brand-pink-soft px-2 py-0.5 text-[11px] font-semibold text-brand-pink-dark">
              {profile.generation}
            </span>
          )}
        </div>
        {profile.business_type && (
          <p className="mt-0.5 truncate text-sm text-neutral-500">{profile.business_type}</p>
        )}
        <ContactButtons profile={profile} />
      </div>
    </li>
  );
}

export function PrefecturePopup({
  prefectureCode,
  users,
}: {
  prefectureCode: string;
  users: Profile[];
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/5 sm:w-72">
      <div className="flex items-center justify-between border-b border-neutral-100 bg-brand-pink px-4 py-2.5">
        <h3 className="font-bold text-white">{prefectureName(prefectureCode) ?? '不明'}</h3>
        <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-semibold text-white">
          {users.length}人
        </span>
      </div>
      <ul className="max-h-72 space-y-2 overflow-y-auto p-3">
        {users.map((u) => (
          <UserCard key={u.id} profile={u} />
        ))}
      </ul>
    </div>
  );
}
