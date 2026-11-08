# Sandtime

<p><img src="docs/icon.svg" width="96" height="96" alt="Sandtime"></p>

[English](README.md) · [简体中文](README.zh-Hans.md) ·
[繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md)
· [Español](README.es.md)

獨立的本機沙漏網頁。為不同人物設定出生日期與預期壽命，預覽年齡，調整人物、沙粒、動畫速度和主題。無須帳號；資料儲存在目前瀏覽器。

## 字型準備

原始碼不含字型。下載 [v0.1.1 網頁版](https://github.com/codingEzio/DeparturePixelZh-OSS/releases/download/v0.1.1/DeparturePixelZh-0.1.1-web.zip)，執行 `python3 scripts/prepare_font.py /path/to/DeparturePixelZh-0.1.1-web.zip`，再執行 `deno task build`。腳本驗證 ZIP 與字型的 SHA-256；缺檔或雜湊不符時建置失敗。字型留在本機並由 Git 忽略；建置後可離線使用。 既有相符的正規檔案會重用；其他既有目標會保留並顯示錯誤。 安全準備需要 Python 支援 `O_NOFOLLOW`、`O_NONBLOCK`，且檔案系統支援硬連結；不支援時會失敗，不覆蓋目標。Termux 與 Windows 尚未測試。

元件聲明見 `assets/fonts/`。Font Logos 與 Material Design 包含標誌；此原始碼及字型發行版未解決個別圖示的權利與商標限制。使用及再散布前須確認各圖示的權利。

## 畫面示例

![Sandtime — Demo person](docs/demo/sandtime-en.png)

真實應用程式截圖，使用合成資料：Demo person，出生於 2000-01-01，設定壽命為 80
年。顯示的時間隨時鐘變化。此截圖使用英文介面。

## 資料與備份

設定可匯出為 JSON 備份。匯入支援 Sandtime 備份、包含 `family.lifeCountdown` 與
Hourglass 裝置設定的 Prometheus 設定匯出，以及舊 Hourglass 人物 JSON。Prometheus
人物會加入現有資料；Sandtime
備份會在確認後取代本機資料。重複匯入家人記錄會被拒絕；原始檔案不會被修改。清除瀏覽器資料或更換瀏覽器前請先匯出備份。

每個匯入檔案上限為 5 MB；Sandtime 最多支援 1,000 人，名稱最長 200
個字元。超出上限或重複的匯入會被拒絕，不會更改現有資料。舊資料的封存和置頂狀態保留在備份中，但目前不套用於人物清單。

儲存需要支援 Web Locks
的安全網址。若其他分頁更改資料，請重新載入後再編輯或匯出。升級前請重新載入或關閉舊版
Sandtime 分頁，因為舊版不使用鎖定。

## 執行與授權

需要支援 `deno bundle` 的 Deno。執行 `deno task build`，再執行
`deno task preview`，使用印出的本機網址。`deno task check` 檢查型別與匯入模型。

程式採 GPL-3.0-only。擁有者已於 2026-10-27
確認可重新散布所提供的解剖圖像；來源與雜湊見英文
README。儲存庫不包含個人設定或記錄。

建置產物同時包含原樣的專案授權
`dist/LICENSE.txt`，以及完整現有字型聲明與來源記錄 `dist/font-notices.txt`。

## 儲存庫與發布

此儲存庫提供原始碼；發布建置產物或託管應用程式需另行決定。
