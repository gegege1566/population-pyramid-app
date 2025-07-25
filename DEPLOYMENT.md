# Population Pyramid Simulation - デプロイメントガイド

## Netlify での一般公開手順（推奨）

### 1. プロジェクトの準備
```bash
# 依存関係をインストール
npm install

# プロダクションビルドを作成
npm run build
```

### 2. Netlifyアカウントの作成
1. [Netlify](https://www.netlify.com/) にアクセス
2. 「Sign up」でアカウント作成

### 3. デプロイ方法

#### 方法A: ドラッグ&ドロップ（最も簡単）
1. Netlifyダッシュボードにアクセス
2. `build` フォルダをブラウザにドラッグ&ドロップ
3. 自動でURLが生成される

#### 方法B: Netlify CLI
```bash
# Netlify CLIをインストール
npm install -g netlify-cli

# Netlifyにログイン
netlify login

# デプロイ
netlify deploy --prod --dir=build
```

#### 方法C: GitHubと連携（自動デプロイ）
1. GitHubにプロジェクトをプッシュ
2. Netlifyで「New site from Git」を選択
3. GitHubリポジトリを連携
4. ビルド設定:
   - Build command: `npm run build`
   - Publish directory: `build`

### 4. カスタムドメイン（オプション）
1. Netlifyダッシュボードで「Domain settings」
2. 「Add custom domain」でドメインを設定

## その他のホスティングオプション

### Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 環境設定

### 本番環境用の設定
`public/.env.production` を作成（必要に応じて）:
```
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_ENVIRONMENT=production
```

## パフォーマンス最適化

### 1. ビルドサイズの最適化
```bash
# バンドルサイズを分析
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

### 2. 画像の最適化
- 使用していない画像ファイルを削除
- WebP形式への変換を検討

## セキュリティ考慮事項

### 1. APIキーの保護
- 環境変数を使用してAPIキーを保護
- `.env.local` ファイルはGitにコミットしない

### 2. HTTPS の確保
- Netlify/Vercelは自動でHTTPS証明書を提供

## モニタリング

### 1. アクセス解析
- Google Analytics の設定
- Netlify Analytics の利用

### 2. エラー監視
- Sentry などのエラートラッキングツール

## 推奨デプロイメント方法

**初心者向け**: Netlifyドラッグ&ドロップ
**開発者向け**: GitHub + Netlify自動デプロイ
**企業利用**: AWS S3 + CloudFront

## コスト

- **Netlify**: 無料プランで十分（月100GB転送量）
- **Vercel**: 無料プランで十分
- **GitHub Pages**: 完全無料
- **AWS**: 従量課金（月数百円程度）

## サポートとメンテナンス

定期的なアップデート:
```bash
# 依存関係の更新
npm update

# セキュリティ監査
npm audit fix

# 再ビルド・再デプロイ
npm run build
netlify deploy --prod --dir=build
```