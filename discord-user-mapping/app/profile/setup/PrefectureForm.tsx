'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { PREFECTURES } from '@/lib/prefectures';
import type { Profile } from '@/lib/types';
import { saveProfileDetails, type SetupFormState } from './actions';

const initialState: SetupFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-discord-blurple px-4 py-3 font-semibold text-white transition-colors hover:bg-discord-blurple-dark disabled:opacity-50"
    >
      {pending ? '保存中…' : '保存する'}
    </button>
  );
}

const fieldClass =
  'w-full rounded-md border border-discord-light/20 bg-discord-darker px-3 py-2 text-discord-light focus:border-discord-blurple focus:outline-none';

export function PrefectureForm({ profile }: { profile: Profile | null }) {
  const [state, formAction] = useFormState(saveProfileDetails, initialState);

  return (
    <form action={formAction} className="w-full space-y-4">
      {/* 都道府県（必須） */}
      <div>
        <label htmlFor="prefecture_code" className="mb-1 block text-sm font-medium">
          都道府県 <span className="text-red-400">*必須</span>
        </label>
        <select
          id="prefecture_code"
          name="prefecture_code"
          defaultValue={profile?.prefecture_code ?? ''}
          required
          className={fieldClass}
        >
          <option value="" disabled>
            選択してください
          </option>
          {PREFECTURES.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* 期生（必須） */}
      <div>
        <label htmlFor="generation" className="mb-1 block text-sm font-medium">
          期生 <span className="text-red-400">*必須</span>
        </label>
        <input
          id="generation"
          name="generation"
          type="text"
          defaultValue={profile?.generation ?? ''}
          placeholder="例: 3期生"
          required
          maxLength={50}
          className={fieldClass}
        />
      </div>

      {/* ビジネス内容（必須） */}
      <div>
        <label htmlFor="business_type" className="mb-1 block text-sm font-medium">
          ビジネス内容（何を売っているか） <span className="text-red-400">*必須</span>
        </label>
        <input
          id="business_type"
          name="business_type"
          type="text"
          defaultValue={profile?.business_type ?? ''}
          placeholder="例: 美容サロン向けの集客コンサル"
          required
          maxLength={100}
          className={fieldClass}
        />
      </div>

      {/* Instagram URL（任意） */}
      <div>
        <label htmlFor="instagram_url" className="mb-1 block text-sm font-medium">
          Instagram URL <span className="text-discord-light/50">（任意）</span>
        </label>
        <input
          id="instagram_url"
          name="instagram_url"
          type="url"
          defaultValue={profile?.instagram_url ?? ''}
          placeholder="https://www.instagram.com/your_account"
          className={fieldClass}
        />
      </div>

      {/* Threads URL（任意） */}
      <div>
        <label htmlFor="threads_url" className="mb-1 block text-sm font-medium">
          Threads URL <span className="text-discord-light/50">（任意）</span>
        </label>
        <input
          id="threads_url"
          name="threads_url"
          type="url"
          defaultValue={profile?.threads_url ?? ''}
          placeholder="https://www.threads.net/@your_account"
          className={fieldClass}
        />
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
