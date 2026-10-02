# 內部報價系統 POC

## 這份概念驗證做什麼

內部人員依固定價目開報價。價目分成大分類，底下是小項。小項單價固定，計價基準只有三種：按件（unit）、按月（month）、按週（week）。每張報價改的是該基準的數量。系統產生報價編號、計算分類小計與總額，並下載 Excel。

價目來自專案根目錄的 Ranger 4S 報價活頁簿。參考檔沒有週費小項，所以種子資料只有 unit 與 month。畫面仍可填週數；一旦價目加入 week 小項，算法同樣是週數乘以固定單價。

假設條款、付款條件、簽署欄與公司標誌留在 Excel 範本，不在畫面上編輯。

## 如何安裝與啟動

在專案根目錄：

```bash
npm install
npm test
npm run dev
```

瀏覽器打開 http://localhost:5173 。API 在 http://127.0.0.1:3001 。

先登入。預設使用者名稱是 `Damien`，密碼是 `12345678`。這階段只做畫面登入，沒有正式帳號系統。右上或左側可以切換 English 與繁體中文。

`npm test` 會用 SFK 範例數量核對總額 **2,040,700**。

畫面操作：

1. 在左側按 **載入範例**。只有有範例數量的小項會被勾選，總額應為 HK$2,040,700。
2. 小項預設不勾選。勾選後才能改數量，金額依固定單價計算。
3. 按 **儲存報價**。第一張 SFK 報價編號是 `KR-30032026SFK-011`，並出現在左側。
4. 再存一次，編號是 `KR-30032026SFK-012`。點左側的報價可立刻載回表單。
5. 按 **Excel** 下載該張報價。

SQLite 檔在 `server/data/quotation.db`。刪除這個檔再啟動，會重新寫入價目，SFK 流水號也回到 011 之前。

## 報價編號

格式是 `KR-{ddMMyyyy}{客戶簡碼}-{三位流水號}`。

簡碼只保留英數並轉成大寫。同一簡碼的下一張加 1。範例日期 2026-03-30、簡碼 SFK、流水號 11，編號就是 `KR-30032026SFK-011`。參考活頁簿儲存格上的日期序號是 2026-04-14，編號文字仍是 30 Mar 2026；這份 POC 讓日期與編號一致，範例用 2026-03-30。

## 價目與 Excel

單價存在 SQLite。報價畫面不能改價。儲存時把單價與計價基準快照到該張報價，之後改種子價目不會改舊單。

金額：

- unit：件數 × 固定單價
- month：月數 × 固定單價
- week：週數 × 固定單價
- 標成 Rate only 的小項不計入總額
- 總額 = 各大分類小計 − 特別折扣

下載時用 ExcelJS 讀取 `server/templates/quotation.xlsx`，寫入抬頭、合約月數、各小項數量、單位（unit / month / week）、固定單價與折扣。金額公式保留。參考檔另一張試算表不會出現在下載檔。

表頭的月數或週數可一次套用到所有 month 或 week 小項，套用後仍可逐項改。unit 小項要逐項填。

## 現在與之後的技術

現在是 React、Node.js、TypeScript、Hono、Drizzle、SQLite。PostgreSQL 與 Cloudflare Workers 留到之後。Hono 與 Drizzle 是為了那次遷移時少改路由與查詢。這次 POC 沒有登入。

---

# Internal Quotation System POC

## What this proof of concept does

Staff prepare a quotation from a fixed price list. The list is a set of big categories, and each category contains smaller items. An item has a fixed price and one charge basis: unit, month, or week. Each quotation changes how many of that basis to count. The system assigns a quotation number, calculates category subtotals and the total, and downloads Excel.

The price list comes from the Ranger 4S workbook in the project root. That file has no weekly items, so the seed data uses unit and month only. The screen can still enter weeks. When a weekly item is added to the price list, the amount is still weeks times the fixed price.

Assumptions, payment terms, signature blocks, and the company logo stay in the Excel template.

## Install and run

From the project root:

```bash
npm install
npm test
npm run dev
```

Open http://localhost:5173 . The API listens on http://127.0.0.1:3001 .

Sign in first. The default username is `Damien` and the password is `12345678`. This stage only checks that sign-in on the page. Use the language button to switch between English and Traditional Chinese.

`npm test` checks the SFK sample quantities against the total **2,040,700**.

In the app:

1. In the left bar, choose **Load sample**. Only items with a sample count are ticked. The total should be HK$2,040,700.
2. Items start unticked. Tick an item to edit its count. The amount follows the fixed price.
3. Choose **Save quotation**. The first SFK number is `KR-30032026SFK-011`, and it appears in the left bar.
4. Save again. The next number is `KR-30032026SFK-012`. Choose a saved quotation in the left bar to load it back into the form.
5. Choose **Excel** to download that quotation.

The SQLite file is `server/data/quotation.db`. Delete it and start again to reseed the price list and return the SFK sequence to the number before 011.

## Quotation number

The format is `KR-{ddMMyyyy}{customer short code}-{3-digit sequence}`.

The short code keeps letters and digits and is stored in uppercase. The next quotation for the same short code adds 1. Date 2026-03-30, short code SFK, and sequence 11 produce `KR-30032026SFK-011`. The reference workbook's date serial is 2026-04-14, while its quotation number still says 30 Mar 2026. This POC keeps the date and the number together, so the sample uses 2026-03-30.

## Price list and Excel

Unit prices live in SQLite. The quotation screen does not edit them. Saving stores a snapshot of the price and charge basis on that quotation, so a later seed change does not rewrite old quotations.

Amounts:

- unit: count × fixed price
- month: number of months × fixed price
- week: number of weeks × fixed price
- Rate only items are excluded from the total
- Total = category subtotals − special discount

Download reads `server/templates/quotation.xlsx` with ExcelJS and writes the header, contract months, each item count, the basis label (unit, month, or week), the fixed price, and the discount. Amount formulas stay in the sheet. The reference file's second worksheet is not included.

The header month or week value can fill every month item or every week item. Those counts can still be edited one by one. Unit counts are entered per item.

## Current and later technology

The POC runs on React, Node.js, TypeScript, Hono, Drizzle, and SQLite. PostgreSQL and Cloudflare Workers come later. Hono and Drizzle are there so that move can keep the same routes and queries. This POC does not include sign-in.
