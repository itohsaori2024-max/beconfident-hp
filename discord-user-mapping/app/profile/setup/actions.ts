'use server';

/**
 * プロフィールの必須項目「都道府県コード」を保存する Server Action。
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { updatePrefectureCode } from '@/lib/supabase';
import { isValidPrefectureCode } from '@/lib/prefectures';

export interface SetupFormState {
  error?: string;
}

export async function savePrefecture(
  _prevState: SetupFormState,
  formData: FormData,
): Promise<SetupFormState> {
  const session = getSession();
  if (!session) {
    redirect('/?error=not_authenticated');
  }

  const prefectureCode = formData.get('prefecture_code');

  // 必須バリデーション
  if (!isValidPrefectureCode(prefectureCode)) {
    return { error: '都道府県を選択してください。' };
  }

  await updatePrefectureCode(session.discordId, prefectureCode);

  redirect('/');
}
