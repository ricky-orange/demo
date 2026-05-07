# 主動式 ETF 跟單雷達

本資料夾是一個可直接開啟的靜態前端原型，用來監控台灣主動式 ETF 每日持股變化。

## 開啟方式

### 公開靜態網站模式

如果你要放 GitHub Pages、Cloudflare Pages、Netlify、Vercel 靜態網站，建議每天在本機執行：

```powershell
update_static_data.bat
```

如果要用 Windows 工作排程器每天自動執行，請用不會停在 `pause` 的版本：

```powershell
daily_update_static_data.bat
```

執行紀錄會寫在：

`logs/daily_update.log`

或產生一個可直接上傳的 `dist` 資料夾：

```powershell
build_static_site.bat
```

靜態網站只需要上傳：

```text
index.html
styles.css
app.js
data/snapshots.json
```

公開網域上會自動進入靜態模式，只讀 `data/snapshots.json`，不會呼叫 `/api/refresh`，也不需要 Python server。

若要推到 GitHub repo `ricky-orange/demo`，可安裝 Git for Windows 後執行：

```powershell
publish_to_github.bat
```

### 本機即時刷新模式

建議用本機伺服器開啟，這樣前端才能在你打開網頁時自動抓取最新實際資料：

```powershell
python scripts/server.py 8765
```

Windows 也可以直接雙擊：

`start_dashboard.bat`

然後再開：

`open_dashboard.bat`

然後開啟：

`http://127.0.0.1:8765/index.html`

這個伺服器提供 `/api/refresh`，網頁載入時會呼叫它，伺服器端會執行 `scripts/fetch_etfinfo_holdings.py` 並更新 `data/snapshots.json`。

若直接開 `index.html` 或使用 `python -m http.server`，瀏覽器不能直接執行 Python，只能讀取既有 `data/snapshots.json`；抓不到快照時會回退成內建示範資料。

如果畫面顯示「內建示範資料」：

- 確認網址是 `http://127.0.0.1:8765/index.html`，不是 `file:///.../index.html`。
- 確認啟動的是 `python scripts/server.py 8765`，不是 `python -m http.server`。
- 確認是在本專案資料夾啟動伺服器。
- 瀏覽器按 `Ctrl+F5` 強制重新整理。

## 已做功能

- 每日成分股快照：指定日期與 ETF，查看完整持股、權重、持股數與相對前日狀態。
- 持股異動偵測：今日對前一交易日，自動分類新增、清空、加碼、減碼、不變。
- 跨 ETF 持股重疊：比較 2 到 4 檔 ETF 的共同持股、獨有持股與兩兩重疊矩陣。
- 個股追蹤：輸入股票代號，查看哪些 ETF 持有、權重增減與總持股規模趨勢。
- 同步加碼：指定觀察天數與 ETF 家數門檻，找出多家 ETF 同步增持的股票。
- 新增雷達：列出昨天沒有、今天新增進入持股清單的股票。
- 賣出雷達：列出昨天到今天減碼或清空的股票。

## 資料更新流程

頁面會優先讀取：

`data/snapshots.json`

找不到這個檔案時，才會使用 `app.js` 的示範快照資料。每日資料建議流程：

### 方式 A：自動抓公開整理資料

使用 `python scripts/server.py 8765` 時，打開網頁會自動執行抓取。也可以手動執行 ETF 資訊網抓取器，從公開頁面抓主動式 ETF 最新持股，依最新 AUM 取前 10 檔，寫入 `data/snapshots.json`：

```powershell
python scripts/fetch_etfinfo_holdings.py --output data/snapshots.json --limit 10
```

輸出檔會記錄 `source`、`sourceUrl`、`updatedAt` 與 `fetchWarnings`，前端會直接顯示資料來源與抓取警告。第一次執行通常只有最新一日快照；之後每天執行一次，工具會保留既有快照，累積出持股異動歷史。

指定 ETF 代號：

```powershell
python scripts/fetch_etfinfo_holdings.py --codes 00981A,00982A,00980A --output data/snapshots.json
```

### 方式 B：自行下載投信 CSV

1. 到各投信官網 ETF 專區下載每日持股或申購買回清單。
2. 將 CSV 放到一個資料夾，例如 `raw_holdings`。
3. 執行匯入工具：

```powershell
python scripts/import_holdings.py --input raw_holdings --output data/snapshots.json --source "投信官網每日揭露"
```

匯入工具支援常見欄位名稱，例如 `資料日`、`ETF代號`、`股票代號`、`股票名稱`、`持股數`、`權重`。

`data/snapshots.json` 格式如下：

```js
{
  "updatedAt": "2026-05-07T09:30:00",
  "source": "投信官網每日揭露",
  "snapshots": {
    "2026-04-23": {
      "00981A": [
        { "code": "2330", "name": "台積電", "shares": 7131000, "weight": 8.55 }
      ]
    }
  }
}
```

也可以使用扁平 CSV。每日只要有 `date`、`etfCode`、`stockCode`、`stockName`、`shares`、`weight`，前端就能算出各雷達結果。

範例 JSON 可看：

`data/snapshots.example.json`

範例 CSV 可看：

`data/raw_holdings.example.csv`

## 顏色規則

已採用台股習慣：

- 漲、加碼、新增：紅色
- 跌、減碼、清空：綠色
