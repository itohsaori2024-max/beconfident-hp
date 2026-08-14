'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { PREFECTURES } from '@/lib/prefectures';
import { savePrefecture, type SetupFormState } from './actions';

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

export function PrefectureForm({ defaultValue }: { defaultValue?: string | null }) {
  const [state, formAction] = useFormState(savePrefecture, initialState);

  return (
    <form action={formAction} className="w-full space-y-4">
      <div>
        <label htmlFor="prefecture_code" className="mb-1 block text-sm font-medium">
          都道府県 <span className="text-red-400">*必須</span>
        </label>
        <select
          id="prefecture_code"
          name="prefecture_code"
          defaultValue={defaultValue ?? ''}
          required
          className="w-full rounded-md border border-discord-light/20 bg-discord-darker px-3 py-2 text-discord-light focus:border-discord-blurple focus:outline-none"
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

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
