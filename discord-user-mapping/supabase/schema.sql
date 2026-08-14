-- =====================================================================
-- Discord User Mapping — Supabase スキーマ
-- Supabase の SQL Editor に貼り付けて実行してください。
-- =====================================================================

-- updated_at 自動更新用のトリガー関数
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles テーブル
-- Discord アカウント 1件につき 1レコード。
-- prefecture_code は必須項目だが、初回ログイン直後は null を許容し、
-- 設定画面で入力してもらう運用とする（アプリ側で必須バリデーション）。
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key default gen_random_uuid(),
  discord_id       text not null unique,
  discord_username text not null,
  display_name     text not null,
  avatar_url       text,
  -- 都道府県コード（JIS X 0401、"01"〜"47"）
  prefecture_code  text
    check (prefecture_code is null or prefecture_code ~ '^(0[1-9]|[1-3][0-9]|4[0-7])$'),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists profiles_discord_id_idx on public.profiles (discord_id);
create index if not exists profiles_prefecture_code_idx on public.profiles (prefecture_code);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security (RLS)
-- 認証は独自の Discord OAuth（サーバー側で service_role キー使用）で行うため、
-- クライアント（anon キー）からの直接書き込みは禁止する。
-- サーバーの service_role は RLS をバイパスして読み書きできる。
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

-- anon / authenticated からの直接アクセスは許可しない（ポリシー未定義 = 全拒否）。
-- 必要になったら SELECT ポリシー等をここに追加する。
