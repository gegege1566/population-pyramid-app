# 都道府県別人口ピラミッドアプリ

過去から未来までの都道府県別人口ピラミッドを表示するWebアプリケーションです。

## 📊 主な機能

- **インタラクティブな人口ピラミッド**: D3.jsを使用した美しい可視化
- **都道府県選択**: ドロップダウンメニューと地域別選択
- **年代選択**: 2020-2050年の時系列データ表示（過去データ + 将来推計）
- **統計情報**: 年齢構成比、従属人口指数などの詳細統計
- **レスポンシブデザイン**: PC・タブレット・スマートフォン対応

## 🛠 技術構成

- **フロントエンド**: React 19 + TypeScript
- **可視化**: D3.js
- **スタイリング**: Tailwind CSS
- **データ取得**: e-Stat API（政府統計の総合窓口）
- **ストレージ**: ローカルJSON + APIハイブリッド方式

## 🚀 開始方法

### 1. 前提条件

- Node.js 16以上
- npm または yarn
- e-Stat APIキー（無料登録）

### 2. e-Stat APIキーの取得

1. [e-Stat公式サイト](https://www.e-stat.go.jp/)にアクセス
2. 「API機能」→「利用登録」を選択
3. 無料アカウントを作成
4. APIキーを取得（32文字の英数字）

### 3. インストールと設定

```bash
# リポジトリをクローン
git clone <repository-url>
cd population-pyramid-new

# 依存パッケージをインストール
npm install

# 環境変数を設定
cp .env.example .env
# .envファイルを編集してAPIキーを設定
REACT_APP_ESTAT_API_KEY=your-32-character-api-key-here
```

### 4. データの取得（オプション）

#### 将来推計データの取得

2025-2050年の将来推計人口データをe-Stat APIから取得：

```bash
# テスト用（東京、大阪、愛知のみ）
node scripts/fetchFutureDataOptimized.js

# 全都道府県データを取得する場合は、スクリプト内のtestPrefectures配列をコメントアウト
```

#### 過去データの取得

2020-2024年の過去データ（既に含まれていますが、更新する場合）：

```bash
# 全都道府県のデータを取得
node scripts/fetchAllData.js

# 特定の都道府県のみ取得（例：東京都）
node scripts/fetchAllData.js pref 13
```

### 5. アプリケーションの起動

```bash
# 開発サーバーを起動
npm start

# ブラウザで http://localhost:3000 にアクセス
```

## 📁 プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
│   ├── PopulationPyramid.tsx    # 人口ピラミッド可視化
│   ├── PrefectureSelector.tsx   # 都道府県選択UI
│   ├── YearSelector.tsx         # 年度選択UI
│   └── StatsPanel.tsx           # 統計情報パネル
├── data/               # 静的データ
│   ├── prefectures.ts          # 都道府県情報
│   └── population/             # 人口データ（JSON）
├── hooks/              # カスタムフック
│   └── usePopulationData.ts    # データ取得フック
├── services/           # サービスクラス
│   ├── estatApi.ts             # e-Stat API連携
│   └── localDataService.ts    # ローカルデータ管理
├── types/              # TypeScript型定義
│   └── population.ts           # 人口データ型
└── utils/              # ユーティリティ
    └── populationAnalysis.ts   # 統計計算
```

## 🎯 使用方法

### 基本操作

1. **都道府県選択**: 左サイドバーから都道府県を選択
2. **年度選択**: 年度セレクターまたはスライダーで表示年度を変更
3. **ピラミッド表示**: メインエリアに人口ピラミッドが表示
4. **統計確認**: サイドバー下部で詳細統計を確認

### 人口ピラミッドの見方

- **左側（青）**: 男性人口
- **右側（ピンク）**: 女性人口
- **縦軸**: 年齢階級（5歳刻み）
- **横軸**: 人口数
- **ツールチップ**: バーにマウスオーバーで詳細表示

### 統計指標の説明

- **年少人口率**: 0-14歳の人口比率
- **生産年齢人口率**: 15-64歳の人口比率
- **老年人口率**: 65歳以上の人口比率
- **従属人口指数**: (年少+老年)/生産年齢×100

## 🔧 カスタマイズ

### データソースの変更

`src/services/localDataService.ts`でデータ取得ロジックをカスタマイズできます。

### 可視化の調整

`src/components/PopulationPyramid.tsx`でD3.jsによる描画をカスタマイズできます。

### スタイリング

Tailwind CSSクラスを使用してスタイルを調整できます。

## 📚 データについて

### データソース

- **提供**: 政府統計の総合窓口（e-Stat）
- **統計表**: 人口推計（総務省統計局）
- **更新頻度**: 年次
- **対象期間**: 2020年〜2050年（過去データ + 将来推計）

### データ形式

```typescript
interface PopulationData {
  year: number;           // 年度
  prefecture: string;     // 都道府県名
  prefectureCode: string; // 都道府県コード
  ageGroup: string;       // 年齢階級（例：25-29）
  gender: 'male' | 'female'; // 性別
  population: number;     // 人口数
}
```

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します。

## 📄 ライセンス

MIT License

## 🙏 謝辞

- データ提供: [政府統計の総合窓口（e-Stat）](https://www.e-stat.go.jp/)
- 可視化ライブラリ: [D3.js](https://d3js.org/)
- UIフレームワーク: [React](https://reactjs.org/) + [Tailwind CSS](https://tailwindcss.com/)

---

**注意**: APIキーは機密情報です。公開リポジトリにコミットしないよう注意してください。