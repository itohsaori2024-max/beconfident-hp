-- =====================================================================
-- Migration 0002: profiles テーブルの拡張
-- 追加カラム:
--   generation    text  必須（期生情報。例「3期生」）
--   business_type text  必須（ビジネス内容。何を売っているか）
--   instagram_url text  任意（Instagram URL）
--   threads_url   text  任意（Threads URL）
--
-- 既存行があっても安全に流せるよう「nullable で追加 → backfill → NOT NULL」
-- の順で適用する。Supabase の SQL Editor に貼り付けて実行してください。
-- =====================================================================

-- 1. まず nullable で追加
alter table public.profiles
  add column if not exists generation    text,
  add column if not exists business_type text,
  add column if not exists instagram_url text,
  add column if not exists threads_url   text;

-- 2. 既存行を暫定値（空文字）で backfill（新規環境では対象0件）
update public.profiles set generation    = '' where generation    is null;
update public.profiles set business_type = '' where business_type is null;

-- 3. 必須項目に NOT NULL 制約を付与
alter table public.profiles
  alter column generation    set not null,
  alter column business_type set not null;

-- 4. 任意 URL 項目に軽いバリデーション（null か http(s):// 始まり）
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_instagram_url_chk'
  ) then
    alter table public.profiles
      add constraint profiles_instagram_url_chk
      check (instagram_url is null or instagram_url ~ '^https?://');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_threads_url_chk'
  ) then
    alter table public.profiles
      add constraint profiles_threads_url_chk
      check (threads_url is null or threads_url ~ '^https?://');
  end if;
end $$;
