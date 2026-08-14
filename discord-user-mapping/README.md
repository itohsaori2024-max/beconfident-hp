# Discord User Mapping

<!-- Vercel: Next.js / Root Directory = discord-user-mapping -->

Discord 内で動作するユーザーマッピングアプリ。
**第一歩**として、Discord OAuth2 でログインし、ユーザーの Discord 名とアイコン画像を取得して、
プロフィール（必須項目：**都道府県コード**）を Supabase に保存する認証ロジックを実装しています。

## 技術スタック

- **Next.js 14（App Router）**
- **Tailwind CSS**
- **Supabase**（プロフィール保存）
- **Discord OAuth2**（`identify` スコープでユーザー名・アイコンを取得）
- **@discord/embedded-app-sdk**（Discord Embedded App / Webview 表示の将来対応用に導入済み）
- **@svg-maps/japan**（日本地図の SVG パスデータのみ。描画・スタイル・ポップアップは自前の React で制御）

## プロフィール項目

| 項目 | カラム | 種別 |
|------|--------|------|
| 都道府県 | `prefecture_code`（JIS X 0401） | 必須 |
| 名前 | `display_name`（Discord 表示名） | 自動取得 |
| プロフ写真 | `avatar_url` | 自動取得 |
| 期生 | `generation` | 必須 |
| ビジネス内容 | `business_type` | 必須 |
| Discord ID | `discord_id` | 自動取得 |
| Instagram URL | `instagram_url` | 任意 |
| Threads URL | `threads_url` | 任意 |

## 日本地図（メイン機能）

トップ画面（`app/page.tsx`）にインタラクティブな日本地図を表示します。

- 登録ユーザーがいる都道府県をハイライト＋件数ドットで表示
- **ホバー**（PC 主体）／**タップ**（スマホ・Discord Webview）でポップアップを表示
- ポップアップ内：都道府県名・丸型プロフ写真・名前・**期生バッジ**・ビジネス内容・連絡先ボタン
  （Discord DM `https://discord.com/users/{discord_id}`、Instagram・Threads は登録時のみ表示）
- 同一都道府県に複数人いる場合は縦リスト＋スクロール表示

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

- **新規構築**: `supabase/schema.sql` を Supabase の SQL Editor で実行し、`profiles` テーブルを作成します。
- **既存テーブルの拡張**: 既に旧スキーマで作成済みの場合は `supabase/migrations/0002_extend_profiles.sql` を実行して、`generation` / `business_type` / `instagram_url` / `threads_url` を追加します（既存行があっても安全に流せます）。

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

## Vercel へのデプロイ

このアプリは Vercel で公開できます。

1. Vercel で GitHub リポジトリ（`beconfident-hp`）をインポート
2. **Root Directory** を `discord-user-mapping` に設定
3. **Production Branch** をこのアプリのブランチに設定
4. 環境変数（`.env.example` の各項目）を Vercel の Environment Variables に登録
   - `DISCORD_REDIRECT_URI` と `NEXT_PUBLIC_APP_URL` は本番ドメイン（例 `https://<project>.vercel.app`）に合わせる
5. Discord Developer Portal の OAuth2 Redirects に本番の callback URL を追加
6. デプロイ

## 次のステップ（予定）

- Discord Embedded App SDK を用いたアクティビティ内表示
- ユーザー同士のマッピング（都道府県ベースのマッチング等）機能
