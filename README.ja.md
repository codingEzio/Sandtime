# Sandtime

<p><img src="docs/icon.svg" width="96" height="96" alt="Sandtime"></p>

[English](README.md) · [简体中文](README.zh-Hans.md) ·
[繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md)
· [Español](README.es.md)

寿命を振り返る、個人用データが既定で空の独立 local
hourglass。人物の誕生日と目標寿命を設定し、年齢を
preview、人物／砂／motion／theme を調整します。account／remote service
は不要です。

## 画面例

![Sandtime — Demo person](docs/demo/sandtime-en.png)

実際のアプリ画面です。合成データとして Demo person、2000-01-01 生まれ、目標寿命
80 年を使用しています。表示時間は時計に応じて変わります。この画像の UI
は英語です。

## データと import

人物／設定は browser と origin に保存。Export backup で移し、site data 消去前に
backup します。Sandtime backup、Prometheus family.lifeCountdown／Hourglass
device settings、legacy profiles または API items を明示 import。Prometheus
は追加、Sandtime backup は確認後置換。重複 family import／oversize は既存 data
を変えず拒否。5MB／file、最大1000people、name200characters。approximate date
を表示し、旧 metadata の archived／pinned は backup
保持のみで一覧へ適用しません。

## Offline と設定

初回 online 後、対応 service worker／origin で offline 利用。保存は secure
origin／Web Locks が必要で、別 tab の更新後は reload。upgrade 前に旧 tabs を
reload／close。reduced-motion を尊重し System／bundled
Pixel、theme、砂／速度を選べます。

## 実行

deno bundle 対応 Deno。deno task build、preview は loopback ephemeral URL。check
は型／import／persistence model を検証します。今回 personal profile の
import／reset／live data 操作はありません。

ビルドには、変更していないプロジェクトのライセンス `dist/LICENSE.txt`
と、既存フォントの全通知・来歴をまとめた `dist/font-notices.txt` も含まれます。

## Source と権利

ソースは既存 GPL-3.0-only を保持。anatomy atlas／geometry／
adapted render は記録した owner prototype と以前のアプリケーションに由来し、README英語に
size/hash／owner確認日があります。DeparturePixelZh Compact は OFL1.1 と
component notices を保持。ビルドの公開とアプリのホスティングは別判断。

Font preparation / 字型準備 / 字体准备: see [README](README.md#font-preparation).
