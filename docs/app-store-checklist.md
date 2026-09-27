# App Store 提出チェックリスト

コードで対応済みの項目には ✅、あなたが外部（App Store Connect・ウェブ等）で用意する必要がある項目には ⬜ を付けています。

## 1. プライバシーポリシー

- ⬜ [docs/privacy-policy.html](privacy-policy.html) の【　】部分（運営者名・連絡先メール）を埋めて、どこかにホスティングする
  - 簡単な方法：このリポジトリをGitHubに置き、GitHub Pagesで公開（`https://<user>.github.io/<repo>/privacy-policy.html`）
  - または Notion / 自分のドメインなど、URLが公開されていて審査官が開ける場所ならどこでもよい
- ⬜ 公開したURLを2箇所に反映する
  - `src/app/settings.tsx` の `PRIVACY_URL`
  - App Store Connect の「App情報」→「プライバシーポリシーURL」

## 2. App Privacy（プライバシー"栄養成分表示"）

App Store Connect の「App プライバシー」で聞かれる質問への回答（実装内容に基づく）：

| データの種類 | 収集 | 用途 | 本人への紐づけ |
|---|---|---|---|
| 識別子（広告ID） | あり | 広告、分析 | トラッキングに使用（ATT許可時） |
| 購入履歴 | あり（App Store経由・expo-iap） | App機能 | 本人に紐づく |
| ユーザーコンテンツ（該当なし） | なし | - | - |
| 連絡先情報 | なし | - | - |
| 位置情報（おおまかな位置のみ、広告用） | あり（Google広告SDK経由） | 広告 | 本人に紐づかない場合あり |

- ⬜ 「トラッキングに使用されるデータ」に広告ID を含める（ATTでNoを選んだユーザー分は自動的にトラッキングされません）
- ⬜ Game Center のプレイヤーID・スコアは「App機能に使用」「本人に紐づく」として申告

## 3. 年齢制限（Age Rating）questionnaire

- ⬜ 賭博的要素・暴力表現・ユーザー生成コンテンツ：すべて「なし」
- ⬜ 広告あり：はい
- ⬜ アプリ内課金あり：はい（すべて非消耗型・買い切り、得点が有利になるものはなし）
- 想定レーティング：4+

## 4. Game Center（App Store Connect）

- ⬜ App ID で Game Center を有効化（EASビルド時にも必要、[README.md](../README.md)参照）
- ⬜ リーダーボードを作成（[docs/SPEC.md](SPEC.md) §7 参照）
  - `sum10.daily`：定期リセット型・1日・高い順・整数・0〜30000
  - `sum10.timeattack`：クラシック・高い順・整数・0〜30000
- ⬜ **最初の申請バージョンにリーダーボードを紐づける**（後付けだと公開後に表示されないことがある）

## 5. In-App Purchase（App Store Connect）

外部サービス（RevenueCat等）は使わず、`expo-iap` でStoreKitに直接接続しています。サーバーでの受領確認は行わず、
App Store（StoreKit）の購入履歴をそのまま信頼する方式です（得点に影響しない商品のみのため許容）。

- ⬜ 非消耗型アプリ内課金を3つ作成し、`src/services/products.ts` の `SKU` と**完全に一致するProduct ID**にする
  - `com.souwer2.sum10.ume`（梅 広告削除）
  - `com.souwer2.sum10.take`（竹 Pro）
  - `com.souwer2.sum10.matsu`（松 サポーター）
  - Bundle IDを変更した場合は、この3つのIDと `products.ts` の両方を合わせて変更すること
- ⬜ 「配布契約」「価格」「税務」のApple側の契約が有効になっていないと、Sandboxでも商品が取得できないので確認
- ⬜ Sandboxテスターアカウントを作成し、実機で購入・復元をテスト（[SPEC.md](SPEC.md) §13）
- ⬜ 初回審査時は「アプリ内課金」もあわせて審査に出す（App本体だけ申請すると課金が別レビューになり公開が遅れることがある）

## 6. AdMob

- ⬜ AdMobで本番のアプリ・広告ユニットを作成
- ⬜ `app.json` の `iosAppId`／`androidAppId` を本番IDに差し替え
- ⬜ `src/services/ads.ts` の `PROD` を本番の広告ユニットIDに差し替え
- ✅ EEA/UK/CCPA向けの同意（UMP）フォームをコードに実装済み（`gatherConsent`）
- ⬜ AdMob管理画面の「プライバシーとメッセージ」でUMPのメッセージ（同意フォーム）を作成・公開
  - これを作らないと `AdsConsent.gatherConsent()` は何も表示しません（＝同意取得なしで広告配信＝ポリシー違反になり得ます）

## 7. ATT（トラッキング許可）

- ✅ 事前説明画面を実装済み（`src/app/att.tsx`）
- ✅ `NSUserTrackingUsageDescription` の文言を `app.json` に設定済み

## 8. App Store Connect のメタデータ

- ⬜ サポートURL（連絡先ページ、メールでも可）
- ⬜ マーケティングURL（任意）
- ⬜ スクリーンショット（6.7インチ・6.5インチ等、必須サイズ分）
- ⬜ アプリ説明文・キーワード（「Excel」「Windows」等の実在商標名を含めないこと。[SPEC.md](SPEC.md) §14 参照）
- ⬜ アプリアイコン（1024×1024、`assets/icon.png` を差し替え）
- ⬜ デモアカウント：不要（ログイン機能なし）と申告

## 9. 輸出コンプライアンス

- ✅ `app.json` に `ITSAppUsesNonExemptEncryption: false` を設定済み（標準的なHTTPS通信のみのため）

## 10. 最終確認（SPEC.mdより）

- ⬜ 実在ソフトの名称・ロゴ・アイコンを使っていない
- ⬜ Game Centerに未ログインでも遊べる（✅ コード対応済み。実機で要確認）
- ⬜ アプリ名「SUM10 パズル」が既存アプリと重複していないか確認
- ⬜ 「購入の復元」ボタンが機能する（✅ コード対応済み。Sandboxで要確認）
