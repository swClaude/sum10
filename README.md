# SUM10 パズル

仕様: [docs/SPEC.md](docs/SPEC.md) ／ デザイン: [docs/design-mock.html](docs/design-mock.html)

申請前の準備: [docs/app-store-checklist.md](docs/app-store-checklist.md) ／ プライバシーポリシーのひな形: [docs/privacy-policy.html](docs/privacy-policy.html)

## 開発（Windows）

依存関係をインストール:
```bash
npm install
```

ゲームロジック（`src/game`）のテスト。カバレッジ100%必須:
```bash
npm test
```

型チェック:
```bash
npm run typecheck
```

UI確認用（広告・課金・Game Centerはダミー動作）:
```bash
npx expo start --web
```

> **Windows注意:** コマンドは1行ずつコピー＆ペーストしてください。`#`から始まる補足コメントは
> PowerShell/cmd.exeではコメント扱いされず、コマンドの一部として実行されエラーになります
> （このREADMEにはもう`#`コメント付きのコマンドはありません）。

実機検証は dev-client（Expo Go 不可）:

```bash
npx eas-cli build --profile development --platform ios
npx expo start --dev-client
```

## 本番前に差し替えるもの

| 項目 | 場所 |
|---|---|
| Bundle ID | `app.json` の `ios.bundleIdentifier`（現在 `com.souwer2.sum10`） |
| AdMob App ID | `app.json` の `react-native-google-mobile-ads.iosAppId`（現在テストID） |
| AdMob 広告ユニットID | `src/services/ads.ts` の `PROD` |
| App内課金 Product ID | `src/services/products.ts` の `SKU`（`com.souwer2.sum10.ume` 等）と一致するIDでApp Store Connectに3商品（非消耗型）を作成 |
| プライバシーポリシーURL | `src/app/settings.tsx` の `PRIVACY_URL` |
| リーダーボードID | App Store Connect で `sum10.daily` / `sum10.timeattack` を作成 |

## 構成

- `src/app/` 画面（expo-router）
- `src/game/` 純粋ロジック（UI依存なし）
- `src/state/` zustand ストア、ゲーム進行フック
- `src/services/` 広告・課金・Game Center・永続化（`*.web.ts` はWebプレビュー用スタブ）
- `src/ui/` レトロUI部品
- `modules/game-center/` Swift Expo Module（GameKit）
