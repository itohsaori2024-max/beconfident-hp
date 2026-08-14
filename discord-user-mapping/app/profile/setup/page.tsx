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
        <h1 className="text-2xl font-bold">プロフィール設定</h1>
        <p className="mt-2 text-sm text-discord-light/70">
          必須項目の都道府県を選択して保存してください。
        </p>
      </header>

      <section className="w-full rounded-lg bg-discord-dark p-6">
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
          <p className="text-lg font-semibold">{session.displayName}</p>
        </div>

        <PrefectureForm profile={profile} />
      </section>
    </main>
  );
}
