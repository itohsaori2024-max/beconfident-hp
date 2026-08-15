'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { PREFECTURES, OVERSEAS_VALUE } from '@/lib/prefectures';
import type { Profile } from '@/lib/types';
import { saveProfileDetails, type SetupFormState } from './actions';

const initialState: SetupFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-brand-pink px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-pink-dark disabled:opacity-50"
    >
      {pending ? '保存中…' : '保存する'}
    </button>
  );
}

const fieldClass =
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-800 focus:border-brand-pink focus:outline-none focus:ring-1 focus:ring-brand-pink';

export function PrefectureForm({ profile }: { profile: Profile | null }) {
  const [state, formAction] = useFormState(saveProfileDetails, initialState);
  const [location, setLocation] = useState<string>(
    profile?.is_overseas ? OVERSEAS_VALUE : profile?.prefecture_code ?? '',
  );
  const isOverseas = location === OVERSEAS_VALUE;

  return (
    <form action={formAction} className="w-full space-y-4">
      {/* 居住地：都道府県 or 海外（必須） */}
      <div>
        <label htmlFor="prefecture_code" className="mb-1 block text-sm font-medium">
          お住まい <span className="text-red-400">*必須</span>
        </label>
        <select
          id="prefecture_code"
          name="prefecture_code"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
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
          <option value={OVERSEAS_VALUE}>海外・その他</option>
        </select>
      </div>

      {/* 国・地域名（海外を選んだ場合のみ・任意） */}
      {isOverseas && (
        <div>
          <label htmlFor="overseas_label" className="mb-1 block text-sm font-medium">
            国・地域名 <span className="text-neutral-400">（任意）</span>
          </label>
          <input
            id="overseas_label"
            name="overseas_label"
            type="text"
            defaultValue={profile?.overseas_label ?? ''}
            placeholder="例: アメリカ / USA"
            maxLength={50}
            className={fieldClass}
          />
        </div>
      )}

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
