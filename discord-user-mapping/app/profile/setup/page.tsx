import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getSession } from '@/lib/session';
import { getProfileByDiscordId } from '@/lib/supabase';
import { PrefectureForm } from './PrefectureForm';

export const dynamic = 'force-dynamic';

export default async function ProfileSetupPage() {
  const session = getSession();
  if (!session) {
    redirect('/?error=not_authenticated');
  }

  const profile = await getProfileByDiscordId(session.discordId);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-12">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">プロフィール設定</h1>
        <p className="mt-2 text-sm text-neutral-500">
          必須項目を入力して保存してください。
        </p>
      </header>

      <section className="w-full rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          {session.avatarUrl && (
            <Image
              src={session.avatarUrl}
              alt=""
              width={56}
              height={56}
              className="rounded-full"
            />
          )}
          <p className="text-lg font-semibold text-neutral-800">{session.displayName}</p>
        </div>

        <PrefectureForm profile={profile} />
      </section>
    </main>
  );
}
