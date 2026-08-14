# Discord User Mapping

Discord 内で動作するユーザーマッピングアプリ。
**第一歩**として、Discord OAuth2 でログインし、ユーザーの Discord 名とアイコン画像を取得して、
プロフィール（必須項目：**都道府県コード**）を Supabase に保存する認証ロジックを実装しています。

## 技術スタック

- **Next.js 14（App Router）**
- **Tailwind CSS**
- **Supabase**（プロフィール保存）
- **Discord OAuth2**（`identify` スコープでユーザー名・アイコンを取得）
- **@discord/embedded-app-sdk**（Discord Embedded App / Webview 表示の将来対応用に導入済み）

## セットアップ

### 1. 依存関係のインストール

```bash
cd discord-user-mapping
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピーして値を設定します。

```bash
cp .env.example .env.local
```

| 変数 | 取得元 |
|------|--------|
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | [Discord Developer Portal](https://discord.com/developers/applications) の OAuth2 |
| `DISCORD_REDIRECT_URI` | Discord の OAuth2 > Redirects に登録（例: `http://localhost:3000/api/auth/discord/callback`） |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | [Supabase](https://app.supabase.com) の Project Settings > API |
| `SESSION_SECRET` | `openssl rand -hex 32` などで生成したランダム文字列 |

### 3. Supabase スキーマの適用

`supabase/schema.sql` の内容を Supabase の SQL Editor で実行し、`profiles` テーブルを作成します。

### 4. 開発サーバー起動

```bash
npm run dev
```

`http://localhost:3000` を開き、「Discord でログイン」から認証フローを確認できます。

## 認証フロー

```
[トップ] --「Discord でログイン」--> /api/auth/discord
   -> Discord 認可画面（state を Cookie に保存）
   -> /api/auth/discord/callback
        1. state 検証（CSRF 対策）
        2. 認可コード → アクセストークン交換
        3. /users/@me でユーザー名・アイコン取得
        4. Supabase profiles に upsert
        5. 署名付きセッション Cookie を発行
   -> 都道府県未設定なら /profile/setup、設定済みなら /
```

## ディレクトリ構成

```
discord-user-mapping/
├── app/
│   ├── api/auth/
│   │   ├── discord/route.ts              # OAuth2 開始
│   │   ├── discord/callback/route.ts     # コールバック（トークン交換・保存）
│   │   └── logout/route.ts               # ログアウト
│   ├── profile/setup/
│   │   ├── page.tsx                      # 都道府県設定ページ
│   │   ├── PrefectureForm.tsx            # フォーム（クライアント）
│   │   └── actions.ts                    # 保存 Server Action
│   ├── layout.tsx
│   ├── page.tsx                          # トップ（ログイン / プロフィール表示）
│   └── globals.css
├── components/
│   └── DiscordLoginButton.tsx
├── lib/
│   ├── env.ts                            # 環境変数ヘルパー
│   ├── discord.ts                        # Discord OAuth2 ヘルパー
│   ├── supabase.ts                       # Supabase クライアント & プロフィール操作
│   ├── session.ts                        # 署名付きセッション Cookie
│   ├── prefectures.ts                    # 都道府県コード（JIS X 0401）
│   └── types.ts
├── supabase/schema.sql                   # profiles テーブル定義
└── （設定ファイル群）
```

## セキュリティ上の注意

- `SUPABASE_SERVICE_ROLE_KEY` は **サーバー専用**。クライアントに露出させないこと。
- セッション Cookie は HMAC-SHA256 で**署名**しているが**暗号化はしていない**ため、機微情報は入れていない（Discord ID と表示名のみ）。
- `profiles` テーブルは RLS を有効化し、クライアント（anon キー）からの直接アクセスを禁止している。読み書きはサーバー経由のみ。

## 次のステップ（予定）

- Discord Embedded App SDK を用いたアクティビティ内表示
- ユーザー同士のマッピング（都道府県ベースのマッチング等）機能
