'use server';

/**
 * プロフィール設定画面の保存 Server Action。
 * 必須: 都道府県コード / 期生 / ビジネス内容
 * 任意: Instagram URL / Threads URL
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { updateProfileDetails } from '@/lib/supabase';
import { isValidPrefectureCode } from '@/lib/prefectures';

export interface SetupFormState {
  error?: string;
}

/** 空文字なら null に、値があればトリムして返す。 */
function normalizeOptional(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** 任意の URL 項目を検証する。未入力は許可、入力時は http(s) のみ許可。 */
function validateOptionalUrl(value: string | null, label: string): string | null {
  if (value === null) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('invalid protocol');
    }
    return value;
  } catch {
    throw new Error(`${label}は http:// または https:// で始まる有効な URL を入力してください。`);
  }
}

export async function saveProfileDetails(
  _prevState: SetupFormState,
  formData: FormData,
): Promise<SetupFormState> {
  const session = getSession();
  if (!session) {
    redirect('/?error=not_authenticated');
  }

  const prefectureCode = formData.get('prefecture_code');
  const generation = (formData.get('generation') as string | null)?.trim() ?? '';
  const businessType = (formData.get('business_type') as string | null)?.trim() ?? '';

  // --- 必須バリデーション ---
  if (!isValidPrefectureCode(prefectureCode)) {
    return { error: '都道府県を選択してください。' };
  }
  if (generation === '') {
    return { error: '期生を入力してください。' };
  }
  if (businessType === '') {
    return { error: 'ビジネス内容を入力してください。' };
  }

  // --- 任意 URL バリデーション ---
  let instagramUrl: string | null;
  let threadsUrl: string | null;
  try {
    instagramUrl = validateOptionalUrl(normalizeOptional(formData.get('instagram_url')), 'Instagram URL');
    threadsUrl = validateOptionalUrl(normalizeOptional(formData.get('threads_url')), 'Threads URL');
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'URL の形式が正しくありません。' };
  }

  await updateProfileDetails(session.discordId, {
    prefecture_code: prefectureCode,
    generation,
    business_type: businessType,
    instagram_url: instagramUrl,
    threads_url: threadsUrl,
  });

  redirect('/');
}
