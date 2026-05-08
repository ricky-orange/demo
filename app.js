(() => {
  let dates = [
    "2026-04-13",
    "2026-04-14",
    "2026-04-15",
    "2026-04-16",
    "2026-04-17",
    "2026-04-20",
    "2026-04-21",
    "2026-04-22",
    "2026-04-23"
  ];

  let etfs = [
    { code: "00981A", name: "主動統一台股增長", short: "統一增長", color: "#18bfff", aum: 148 },
    { code: "00400A", name: "國泰台股動能高息", short: "國泰動能", color: "#36e29b", aum: 132 },
    { code: "00982A", name: "群益台灣精選強棒", short: "群益強棒", color: "#ffbf3c", aum: 126 },
    { code: "00991A", name: "復華台灣未來50", short: "復華未來", color: "#9c7cff", aum: 119 },
    { code: "00985A", name: "野村台灣增強", short: "野村增強", color: "#30d6c9", aum: 104 },
    { code: "00980A", name: "野村台灣智慧", short: "野村智慧", color: "#ff8a2a", aum: 96 },
    { code: "00988A", name: "統一全球創新", short: "統一全球", color: "#eba0ad", aum: 88 },
    { code: "00992A", name: "群益科技創新", short: "群益科創", color: "#6ed6ff", aum: 82 },
    { code: "00983A", name: "中信成長高股息", short: "中信成長", color: "#d6ad60", aum: 77 },
    { code: "00989A", name: "凱基台灣優選", short: "凱基優選", color: "#5cc68a", aum: 71 }
  ];

  let stocks = [
    ["2330", "台積電", "semiconductor"],
    ["2383", "台光電", "pcb"],
    ["2454", "聯發科", "ic"],
    ["3017", "奇鋐", "thermal"],
    ["2308", "台達電", "power"],
    ["2345", "智邦", "network"],
    ["3653", "健策", "thermal"],
    ["2360", "致茂", "equipment"],
    ["2379", "瑞昱", "ic"],
    ["2357", "華碩", "pc"],
    ["6223", "旺矽", "probe"],
    ["6669", "緯穎", "server"],
    ["5439", "高技", "pcb"],
    ["3264", "欣銓", "test"],
    ["6488", "環球晶", "wafer"],
    ["3035", "智原", "ic"],
    ["3661", "世芯-KY", "ic"],
    ["6446", "藥華藥", "bio"],
    ["6274", "台燿", "pcb"],
    ["1504", "東元", "electric"],
    ["1519", "華城", "electric"],
    ["2301", "光寶科", "power"],
    ["3231", "緯創", "server"],
    ["2353", "宏碁", "pc"],
    ["3019", "亞光", "optic"],
    ["8299", "群聯", "storage"],
    ["5269", "祥碩", "ic"],
    ["6415", "矽力*-KY", "analog"],
    ["5871", "中租-KY", "finance"],
    ["2603", "長榮", "shipping"],
    ["2615", "萬海", "shipping"],
    ["2884", "玉山金", "finance"],
    ["2891", "中信金", "finance"],
    ["2882", "國泰金", "finance"],
    ["3008", "大立光", "optic"],
    ["2059", "川湖", "server"],
    ["8046", "南電", "pcb"],
    ["6531", "愛普*", "memory"],
    ["6409", "旭隼", "power"],
    ["4966", "譜瑞-KY", "ic"],
    ["1815", "富喬", "materials"],
    ["2474", "可成科技", "case"],
    ["6691", "洋基工程", "engineering"],
    ["6781", "AES-KY", "battery"],
    ["3022", "威強電", "industrial"],
    ["3529", "力旺", "ip"],
    ["3189", "景碩", "substrate"],
    ["1590", "亞德客-KY", "automation"]
  ].map(([code, name, theme]) => ({ code, name, theme }));

  let stockMap = new Map(stocks.map((stock) => [stock.code, stock]));
  let latestDate = dates[dates.length - 1];
  let snapshots = {};
  let dataSource = {
    kind: "demo",
    label: "內建示範資料",
    detail: "尚未找到 data/snapshots.json",
    warnings: ["讀不到 data/snapshots.json，請先執行 scripts/fetch_etfinfo_holdings.py 抓取實際資料。"]
  };
  const commonCore = [
    "2330",
    "2383",
    "2454",
    "3017",
    "2308",
    "2345",
    "3653",
    "2360",
    "2379",
    "2357",
    "6223",
    "6669",
    "5439",
    "3264",
    "6488"
  ];

  const etfExtra = {
    "00981A": ["3035", "3661", "3008", "2059", "6274", "1504", "3231"],
    "00400A": ["2301", "1519", "6409", "2891", "2882", "5871", "2615"],
    "00982A": ["8299", "5269", "6415", "8046", "3189", "3529", "6274"],
    "00991A": ["3231", "2059", "1504", "1519", "2603", "2884", "5871"],
    "00985A": ["3661", "6446", "3019", "5269", "6531", "3022", "6691"],
    "00980A": ["2301", "6409", "1590", "6781", "2615", "2884", "2891"],
    "00988A": ["6446", "3008", "8299", "4966", "6531", "6781", "6691"],
    "00992A": ["3035", "3661", "3529", "8046", "3189", "6415", "5269"],
    "00983A": ["5871", "2884", "2891", "2882", "2603", "1504", "1519"],
    "00989A": ["2059", "3231", "6274", "3019", "6691", "3022", "1590"]
  };

  const baseWeight = {
    "2330": 8.4,
    "2383": 5.4,
    "2454": 4.7,
    "3017": 3.3,
    "2308": 4.1,
    "2345": 3.4,
    "3653": 2.7,
    "2360": 2.1,
    "2379": 2.3,
    "2357": 1.8,
    "6223": 1.7,
    "6669": 1.2,
    "5439": 0.52,
    "3264": 0.44,
    "6488": 0.28,
    "3035": 1.5,
    "3661": 1.8,
    "6446": 1.7,
    "6274": 1.4,
    "1504": 1.2,
    "1519": 1.25,
    "2301": 1.45,
    "3231": 1.55,
    "2353": 0.82,
    "3019": 1.05,
    "8299": 1.4,
    "5269": 1.35,
    "6415": 1.18,
    "5871": 1.52,
    "2603": 1.06,
    "2615": 0.92,
    "2884": 1.25,
    "2891": 1.48,
    "2882": 1.36,
    "3008": 1.46,
    "2059": 1.38,
    "8046": 1.12,
    "6531": 0.98,
    "6409": 1.2,
    "4966": 0.48,
    "1815": 0.3,
    "2474": 0.72,
    "6691": 0.78,
    "6781": 0.84,
    "3022": 0.64,
    "3529": 0.92,
    "3189": 0.95,
    "1590": 0.9
  };

  const syncTrends = {
    "2383": { start: 2, daily: 0.24, etfs: ["00981A", "00400A", "00982A", "00991A", "00985A", "00980A", "00992A", "00989A"] },
    "2454": { start: 2, daily: 0.2, etfs: ["00981A", "00400A", "00982A", "00985A", "00988A", "00992A", "00989A"] },
    "3017": { start: 3, daily: 0.17, etfs: ["00981A", "00982A", "00991A", "00985A", "00992A", "00989A"] },
    "2345": { start: 3, daily: 0.15, etfs: ["00981A", "00400A", "00985A", "00980A", "00992A", "00989A"] },
    "3653": { start: 5, daily: 0.12, etfs: ["00981A", "00982A", "00985A", "00992A", "00989A"] },
    "2308": { start: 4, daily: 0.1, etfs: ["00981A", "00400A", "00991A", "00980A"] }
  };

  const events = [
    { etf: "00981A", date: "2026-04-20", code: "3653", type: "up", delta: 0.36 },
    { etf: "00981A", date: "2026-04-20", code: "6669", type: "up", delta: 0.51 },
    { etf: "00981A", date: "2026-04-20", code: "5439", type: "up", delta: 0.13 },
    { etf: "00981A", date: "2026-04-20", code: "3264", type: "up", delta: 0.14 },
    { etf: "00981A", date: "2026-04-20", code: "6488", type: "up", delta: 0.01 },
    { etf: "00981A", date: "2026-04-20", code: "2308", type: "down", delta: -0.26 },
    { etf: "00981A", date: "2026-04-23", code: "4966", type: "add", weight: 0.11 },
    { etf: "00981A", date: "2026-04-23", code: "1815", type: "add", weight: 0.08 },
    { etf: "00981A", date: "2026-04-23", code: "2357", type: "add", weight: 0.06 },
    { etf: "00400A", date: "2026-04-22", code: "6223", type: "down", delta: -0.4 },
    { etf: "00400A", date: "2026-04-23", code: "4966", type: "add", weight: 0.13 },
    { etf: "00400A", date: "2026-04-23", code: "2383", type: "up", delta: 1.24 },
    { etf: "00400A", date: "2026-04-23", code: "2301", type: "clear" },
    { etf: "00982A", date: "2026-04-22", code: "2474", type: "add", weight: 0.99 },
    { etf: "00982A", date: "2026-04-23", code: "2357", type: "add", weight: 0.15 },
    { etf: "00982A", date: "2026-04-23", code: "2360", type: "down", delta: -0.36 },
    { etf: "00991A", date: "2026-04-22", code: "2603", type: "down", delta: -0.47 },
    { etf: "00991A", date: "2026-04-23", code: "4966", type: "add", weight: 0.09 },
    { etf: "00991A", date: "2026-04-23", code: "5871", type: "clear" },
    { etf: "00985A", date: "2026-04-22", code: "6691", type: "add", weight: 0.42 },
    { etf: "00985A", date: "2026-04-23", code: "2474", type: "add", weight: 0.34 },
    { etf: "00985A", date: "2026-04-23", code: "3019", type: "down", delta: -0.3 },
    { etf: "00980A", date: "2026-04-21", code: "6781", type: "add", weight: 0.31 },
    { etf: "00980A", date: "2026-04-23", code: "2301", type: "clear" },
    { etf: "00980A", date: "2026-04-23", code: "6409", type: "down", delta: -0.28 },
    { etf: "00988A", date: "2026-04-22", code: "6781", type: "add", weight: 0.49 },
    { etf: "00988A", date: "2026-04-23", code: "3661", type: "down", delta: -0.32 },
    { etf: "00992A", date: "2026-04-23", code: "2357", type: "add", weight: 0.1 },
    { etf: "00992A", date: "2026-04-23", code: "6223", type: "down", delta: -0.33 },
    { etf: "00983A", date: "2026-04-23", code: "2882", type: "down", delta: -0.28 },
    { etf: "00983A", date: "2026-04-23", code: "2353", type: "add", weight: 0.22 },
    { etf: "00989A", date: "2026-04-23", code: "4966", type: "add", weight: 0.07 },
    { etf: "00989A", date: "2026-04-23", code: "6274", type: "down", delta: -0.34 }
  ].map((event) => ({ ...event, index: dates.indexOf(event.date) }));

  const eventKey = (event) => `${event.etf}:${event.code}`;
  const state = {
    activeView: "dashboard",
    changeFilter: "all",
    overlapMode: "common",
    stockChartMode: "total"
  };

  const iconSet = {
    radar: '<svg viewBox="0 0 24 24"><path d="M12 12l8-4"/><path d="M12 4v8l4 7"/><circle cx="12" cy="12" r="9"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="5" width="18" height="16" rx="2"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24"><path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
    layers: '<svg viewBox="0 0 24 24"><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    trend: '<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>'
  };

  const viewMeta = {
    dashboard: ["總覽雷達", "追蹤每日換股、同步加碼與個股持有規模"],
    snapshot: ["每日成分股快照", "指定任一天，直接查看完整持股清單"],
    changes: ["持股異動偵測", "今日 vs 前一交易日，新增、清空、加碼、減碼一次攤開"],
    overlap: ["跨 ETF 持股重疊", "比較多檔 ETF 的共同持股與獨有持股"],
    stock: ["個股被持有追蹤", "查詢個股被哪些主動式 ETF 持有與增減態度"],
    sync: ["多家投信同步加碼", "跨監控清單找出短期共同加碼股"],
    buyRadar: ["新增雷達", "昨天沒有、今天新增的持股清單"],
    sellRadar: ["賣出雷達", "昨天到今天被減碼或清空的持股清單"]
  };

  document.addEventListener("DOMContentLoaded", () => {
    init().catch(() => {
      snapshots = createSnapshots();
      refreshDerivedData();
      dataSource = {
        kind: "demo",
        label: "內建示範資料",
        detail: "外部資料載入失敗，已回退 demo",
        warnings: ["讀不到 data/snapshots.json，請先執行 scripts/fetch_etfinfo_holdings.py 或匯入真實 CSV。"]
      };
      populateControls();
      bindEvents();
      renderDataSourceStatus();
      setView("dashboard");
    });
  });

  async function init() {
    injectIcons();
    await hydrateData();
    populateControls();
    bindEvents();
    renderDataSourceStatus();
    setView("dashboard");
  }

  async function hydrateData() {
    if (!isStaticSite()) {
      snapshots = createSnapshots();
      refreshDerivedData();
    }
    dataSource = {
      kind: "warning",
      label: isStaticSite() ? "正在載入靜態快照" : "正在抓取實際資料",
      detail: isStaticSite() ? "正在讀取 data/snapshots.json" : "請稍候，正在呼叫本機刷新 API",
      warnings: []
    };
    renderDataSourceStatus();

    const externalBundle = await fetchExternalBundle();
    if (!externalBundle) {
      if (!Object.keys(snapshots).length) {
        snapshots = createSnapshots();
        refreshDerivedData();
      }
      return;
    }

    mergeExternalCatalog(externalBundle);
    const externalSnapshots = normalizeSnapshotInput(externalBundle);
    if (!Object.keys(externalSnapshots).length) return;

    snapshots = externalSnapshots;
    refreshDerivedData();
    dataSource = {
      kind: "external",
      label: externalBundle.source || "data/snapshots.json",
      url: externalBundle.sourceUrl || "",
      detail: externalBundle.updatedAt ? `更新 ${externalBundle.updatedAt}` : "讀取外部快照",
      warnings: Array.isArray(externalBundle.fetchWarnings) ? externalBundle.fetchWarnings : [],
      isRealData: externalBundle.isRealData !== false
    };
  }

  async function fetchExternalBundle() {
    if (location.protocol === "file:") return null;
    if (isStaticSite()) {
      return await fetchJson("./data/snapshots.json");
    }
    const refreshed = await fetchJson("./api/refresh");
    if (refreshed && refreshed.ok && refreshed.bundle) {
      return refreshed.bundle;
    }
    if (refreshed && refreshed.bundle) {
      const bundle = refreshed.bundle;
      bundle.fetchWarnings = [
        ...(Array.isArray(bundle.fetchWarnings) ? bundle.fetchWarnings : []),
        refreshed.error || "本機刷新 API 失敗，改用現有快照資料。"
      ];
      return bundle;
    }
    const status = await fetchJson("./api/status");
    if (status && status.bundle && Object.keys(status.bundle).length) return status.bundle;
    const staticBundle = await fetchJson("./data/snapshots.json");
    if (staticBundle) return staticBundle;
    return null;
  }

  function isStaticSite() {
    return window.ETF_STATIC_SITE === true;
  }

  async function fetchJson(url) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return null;
      return await response.json();
    } catch (_) {
      return null;
    }
  }

  function mergeExternalCatalog(bundle) {
    if (Array.isArray(bundle.etfs)) {
      const merged = new Map(etfs.map((etf) => [etf.code, etf]));
      bundle.etfs.forEach((etf) => {
        if (!etf || !etf.code) return;
        const code = String(etf.code).trim();
        merged.set(code, {
          code,
          name: etf.name || etf.short || code,
          short: etf.short || etf.name || code,
          color: etf.color || (merged.get(code) && merged.get(code).color) || "#18bfff",
          aum: Number(etf.aum || (merged.get(code) && merged.get(code).aum) || 0)
        });
      });
      etfs = [...merged.values()];
    }

    if (Array.isArray(bundle.stocks)) {
      const merged = new Map(stocks.map((stock) => [stock.code, stock]));
      bundle.stocks.forEach((stock) => {
        if (!stock || !stock.code) return;
        const code = String(stock.code).trim();
        merged.set(code, {
          code,
          name: stock.name || code,
          theme: stock.theme || "external"
        });
      });
      stocks = [...merged.values()];
      stockMap = new Map(stocks.map((stock) => [stock.code, stock]));
    }
  }

  function normalizeSnapshotInput(bundle) {
    if (Array.isArray(bundle.holdings)) return rowsToSnapshots(bundle.holdings);
    if (bundle.snapshots && Array.isArray(bundle.snapshots.holdings)) return rowsToSnapshots(bundle.snapshots.holdings);
    const rawSnapshots = bundle.snapshots || bundle;
    const normalized = {};

    Object.entries(rawSnapshots || {}).forEach(([date, byEtf]) => {
      if (!isDateKey(date) || !byEtf || Array.isArray(byEtf)) return;
      normalized[date] = {};
      Object.entries(byEtf).forEach(([etfCode, rows]) => {
        if (!Array.isArray(rows)) return;
        normalized[date][etfCode] = rows
          .map(normalizeHoldingRow)
          .filter(Boolean)
          .sort((a, b) => b.weight - a.weight || a.code.localeCompare(b.code));
      });
    });

    return normalized;
  }

  function rowsToSnapshots(rows) {
    const normalized = {};
    rows.forEach((row) => {
      const date = valueFrom(row, ["date", "資料日", "日期"]);
      const etfCode = valueFrom(row, ["etfCode", "etf", "ETF", "ETF代號", "基金代號"]);
      if (!date || !etfCode) return;
      const holding = normalizeHoldingRow(row);
      if (!holding) return;
      normalized[date] = normalized[date] || {};
      normalized[date][etfCode] = normalized[date][etfCode] || [];
      normalized[date][etfCode].push(holding);
    });

    Object.values(normalized).forEach((byEtf) => {
      Object.keys(byEtf).forEach((etfCode) => {
        byEtf[etfCode].sort((a, b) => b.weight - a.weight || a.code.localeCompare(b.code));
      });
    });
    return normalized;
  }

  function normalizeHoldingRow(row) {
    const code = String(valueFrom(row, ["code", "stockCode", "ticker", "證券代號", "股票代號", "代號"]) || "").trim();
    if (!code) return null;
    const known = stockMap.get(code);
    const name = valueFrom(row, ["name", "stockName", "證券名稱", "股票名稱", "名稱"]) || (known && known.name) || code;
    return {
      code,
      name,
      shares: parseNumeric(valueFrom(row, ["shares", "share", "qty", "quantity", "持股數", "股數"])),
      weight: round(parseNumeric(valueFrom(row, ["weight", "weightPct", "ratio", "權重", "權重%", "比重"])))
    };
  }

  function refreshDerivedData() {
    dates = Object.keys(snapshots).sort();
    if (!dates.length) {
      snapshots = createSnapshots();
      dates = Object.keys(snapshots).sort();
    }
    latestDate = dates[dates.length - 1];
    const palette = ["#18bfff", "#36e29b", "#ffbf3c", "#9c7cff", "#30d6c9", "#ff8a2a", "#eba0ad"];
    const knownEtfs = new Map(etfs.map((etf) => [etf.code, etf]));
    const knownStocks = new Map(stocks.map((stock) => [stock.code, stock]));

    dates.forEach((date) => {
      Object.entries(snapshots[date] || {}).forEach(([etfCode, rows]) => {
        if (!knownEtfs.has(etfCode)) {
          knownEtfs.set(etfCode, {
            code: etfCode,
            name: etfCode,
            short: etfCode,
            color: palette[knownEtfs.size % palette.length],
            aum: 0
          });
        }
        rows.forEach((row) => {
          if (!knownStocks.has(row.code)) {
            knownStocks.set(row.code, {
              code: row.code,
              name: row.name || row.code,
              theme: "external"
            });
          }
        });
      });
    });

    etfs = [...knownEtfs.values()];
    stocks = [...knownStocks.values()];
    stockMap = new Map(stocks.map((stock) => [stock.code, stock]));
  }

  function injectIcons() {
    document.querySelectorAll("[data-icon]").forEach((node) => {
      node.innerHTML = iconSet[node.dataset.icon] || "";
    });
  }

  function populateControls() {
    const dateSelects = ["globalDate", "snapshotDate", "changesDate"];
    dateSelects.forEach((id) => {
      const select = byId(id);
      select.innerHTML = dates
        .slice()
        .reverse()
        .map((date) => `<option value="${date}">${date}</option>`)
        .join("");
      select.value = latestDate;
    });

    const etfOptions = etfs
      .map((etf) => `<option value="${etf.code}">${etf.code} ${escapeHtml(etf.name)}</option>`)
      .join("");
    ["snapshotEtf", "changesEtf", "overlapA", "overlapB", "overlapC", "overlapD"].forEach((id) => {
      byId(id).innerHTML = etfOptions;
    });
    byId("snapshotEtf").value = "00981A";
    byId("changesEtf").value = "00981A";
    byId("overlapA").value = "00981A";
    byId("overlapB").value = "00400A";
    byId("overlapC").value = "00982A";
    byId("overlapD").value = "00991A";
    byId("watchCount").textContent = String(etfs.length);
    byId("stockSearch").innerHTML = stocks
      .map((stock) => `<option value="${stock.code}">${stock.code} ${escapeHtml(stock.name)}</option>`)
      .join("");
    if (stockMap.has("2330")) byId("stockSearch").value = "2330";
  }

  function bindEvents() {
    document.querySelectorAll(".nav-tab, .view-jump").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    byId("globalDate").addEventListener("change", () => renderCurrentView());
    byId("scanButton")?.addEventListener("click", async () => {
      await refreshRealData();
    });

    byId("loadSnapshot")?.addEventListener("click", renderSnapshot);
    byId("snapshotDate").addEventListener("change", renderSnapshot);
    byId("snapshotEtf").addEventListener("change", renderSnapshot);
    byId("analyzeChanges")?.addEventListener("click", renderChanges);
    byId("changesDate").addEventListener("change", renderChanges);
    byId("changesEtf").addEventListener("change", renderChanges);
    document.querySelectorAll("[data-change-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        state.changeFilter = button.dataset.changeFilter;
        document.querySelectorAll("[data-change-filter]").forEach((item) => item.classList.toggle("active", item === button));
        renderChanges();
      });
    });

    byId("compareOverlap").addEventListener("click", renderOverlap);
    ["overlapA", "overlapB", "overlapC", "overlapD"].forEach((id) => byId(id).addEventListener("change", renderOverlap));
    byId("toggleUnique").addEventListener("click", () => {
      state.overlapMode = state.overlapMode === "common" ? "unique" : "common";
      byId("toggleUnique").textContent = state.overlapMode === "common" ? "切換獨有持股" : "切換共同持股";
      renderOverlap();
    });

    byId("stockSearch").addEventListener("change", renderStock);
    document.querySelectorAll("[data-stock-chart]").forEach((button) => {
      button.addEventListener("click", () => {
        state.stockChartMode = button.dataset.stockChart;
        document.querySelectorAll("[data-stock-chart]").forEach((item) => item.classList.toggle("active", item === button));
        renderStock();
      });
    });

    byId("querySync").addEventListener("click", renderSync);
    byId("syncDays").addEventListener("change", renderSync);
    byId("syncMin").addEventListener("change", renderSync);
  }

  function setView(view) {
    state.activeView = view;
    document.querySelectorAll(".view").forEach((node) => node.classList.toggle("active", node.id === view));
    document.querySelectorAll(".nav-tab").forEach((node) => node.classList.toggle("active", node.dataset.view === view));
    byId("viewTitle").textContent = viewMeta[view][0];
    byId("viewSubtitle").textContent = viewMeta[view][1];
    renderCurrentView();
  }

  function renderCurrentView() {
    const renderers = {
      dashboard: renderDashboard,
      snapshot: renderSnapshot,
      changes: renderChanges,
      overlap: renderOverlap,
      stock: renderStock,
      sync: renderSync,
      buyRadar: renderBuyRadar,
      sellRadar: renderSellRadar
    };
    renderers[state.activeView]();
  }

  async function refreshRealData() {
    if (isStaticSite()) {
      const externalBundle = await fetchJson("./data/snapshots.json");
      if (externalBundle) {
        mergeExternalCatalog(externalBundle);
        const externalSnapshots = normalizeSnapshotInput(externalBundle);
        if (Object.keys(externalSnapshots).length) {
          snapshots = externalSnapshots;
          refreshDerivedData();
          dataSource = {
            kind: "external",
            label: externalBundle.source || "data/snapshots.json",
            url: externalBundle.sourceUrl || "",
            detail: externalBundle.updatedAt ? `靜態快照更新 ${externalBundle.updatedAt}` : "讀取靜態快照",
            warnings: Array.isArray(externalBundle.fetchWarnings) ? externalBundle.fetchWarnings : [],
            isRealData: externalBundle.isRealData !== false
          };
          populateControls();
          renderDataSourceStatus();
          renderCurrentView();
          toast("已重新載入靜態快照");
          return;
        }
      }
      toast("讀不到 data/snapshots.json");
      return;
    }

    const button = byId("scanButton");
    const oldLabel = button ? button.innerHTML : "";
    if (button) {
      button.disabled = true;
      button.innerHTML = `<span class="icon" data-icon="refresh">${iconSet.refresh}</span><span>抓取中</span>`;
    }
    dataSource = {
      kind: "warning",
      label: "正在抓取實際資料",
      detail: "正在呼叫本機刷新 API",
      warnings: []
    };
    renderDataSourceStatus();

    const externalBundle = await fetchExternalBundle();
    if (externalBundle) {
      mergeExternalCatalog(externalBundle);
      const externalSnapshots = normalizeSnapshotInput(externalBundle);
      if (Object.keys(externalSnapshots).length) {
        snapshots = externalSnapshots;
        refreshDerivedData();
        dataSource = {
          kind: "external",
          label: externalBundle.source || "data/snapshots.json",
          url: externalBundle.sourceUrl || "",
          detail: externalBundle.updatedAt ? `更新 ${externalBundle.updatedAt}` : "讀取外部快照",
          warnings: Array.isArray(externalBundle.fetchWarnings) ? externalBundle.fetchWarnings : [],
          isRealData: externalBundle.isRealData !== false
        };
        populateControls();
        renderDataSourceStatus();
        renderCurrentView();
        toast("已抓取並載入最新實際資料");
      } else {
        toast("抓取回來的資料沒有持股快照");
      }
    } else {
      dataSource = {
        kind: "demo",
        label: "內建示範資料",
        detail: "本機刷新 API 與快照檔都讀不到",
        warnings: ["請用 python scripts/server.py 8765 啟動，而不是 python -m http.server。"]
      };
      renderDataSourceStatus();
      toast("抓不到實際資料，已保留目前畫面");
    }

    if (button) {
      button.disabled = false;
      button.innerHTML = oldLabel;
      injectIcons();
    }
  }

  function renderDataSourceStatus() {
    const node = byId("dataSourceStatus");
    if (!node) return;
    const firstDate = dates[0] || "-";
    const lastDate = latestDate || "-";
    const sourceLabel = dataSource.url
      ? `<a href="${escapeHtml(dataSource.url)}" target="_blank" rel="noreferrer">${escapeHtml(dataSource.label)}</a>`
      : `<span>${escapeHtml(dataSource.label)}</span>`;
    node.innerHTML = `
      <span class="data-source-dot ${dataSource.kind}"></span>
      ${sourceLabel}
      <small>${escapeHtml(firstDate)} -> ${escapeHtml(lastDate)} · ${escapeHtml(dataSource.detail)}</small>
    `;

    const alert = byId("dataSourceAlert");
    if (!alert) return;
    const warnings = Array.isArray(dataSource.warnings) ? dataSource.warnings.slice() : [];
    if (dataSource.kind === "demo") {
      warnings.unshift("目前顯示的是內建示範資料，不是實際投信持股。");
      alert.classList.add("danger");
    } else {
      alert.classList.remove("danger");
      const hasEtfHistory = etfs.some((etf) => availableDatesForEtf(etf.code).length >= 2);
      if (!hasEtfHistory) warnings.unshift("目前每檔 ETF 只有最新一筆實際快照；持股異動、雷達與同步訊號需要每天重跑抓取器累積至少兩個交易日才會完整。");
    }
    alert.hidden = warnings.length === 0;
    alert.innerHTML = warnings.map((warning) => `<div>${escapeHtml(warning)}</div>`).join("");
  }

  function renderDashboard() {
    const date = selectedDate();
    const changes = allEtfChanges(date);
    const adds = changes.filter((row) => row.status === "added");
    const sells = changes.filter((row) => row.status === "reduced" || row.status === "cleared");
    const sync = analyzeSync(5, 3, date);
    const updatedEtfs = etfs.filter((etf) => latestDateForEtf(etf.code, date) === date);
    const etfBuys = updatedEtfs.filter((etf) => Number(etf.netAmount || 0) > 0);
    const etfSells = updatedEtfs.filter((etf) => Number(etf.netAmount || 0) < 0);

    byId("dashboardMetrics").innerHTML = [
      metricCard("監控 ETF", etfs.length, "檔", "cyan"),
      metricCard("ETF 加碼", etfBuys.length, "檔", "red"),
      metricCard("ETF 減碼", etfSells.length, "檔", "green"),
      metricCard("同步加碼", sync.length, "檔", "amber")
    ].join("");

    byId("dashboardAdds").innerHTML = topRows(adds, 5, "add");
    byId("dashboardSells").innerHTML = topRows(sells, 5, "sell");
    byId("dashboardSync").innerHTML = sync
      .slice(0, 5)
      .map((item) => signalRow(item.code, item.name, `${item.etfs.length} 家同步加碼`, formatDelta(item.totalDelta), "sync"))
      .join("") || empty("沒有達到門檻的同步加碼股");
  }

  function renderSnapshot() {
    const date = byId("snapshotDate").value;
    const etfCode = byId("snapshotEtf").value;
    const etf = findEtf(etfCode);
    const rows = getSnapshot(date, etfCode);
    const comparison = compareEtf(date, etfCode);
    const compareMap = new Map(comparison.map((row) => [row.code, row]));
    const totalWeight = sum(rows.map((row) => row.weight));
    const topFive = sum(rows.slice(0, 5).map((row) => row.weight));
    const biggest = rows[0] || { weight: 0 };

    byId("snapshotMetrics").innerHTML = [
      metricCard("持股檔數", rows.length, "檔", "cyan"),
      metricCard("權重加總", formatPct(totalWeight), "", "violet"),
      metricCard("前 5 大佔比", formatPct(topFive), "", "amber"),
      metricCard("最大持股", formatPct(biggest.weight), "", "cyan")
    ].join("");

    byId("snapshotTitle").textContent = `${etf.code} ${etf.name}`;
    byId("snapshotRange").textContent = `${date} 持股快照`;
    byId("snapshotRows").innerHTML = rows
      .map((row) => {
        const change = compareMap.get(row.code) || { status: "unchanged", delta: 0, shareDelta: 0 };
        return `
          <tr>
            <td>${statusChip(change.status)}</td>
            <td class="code">${row.code}</td>
            <td class="name">${escapeHtml(row.name)}</td>
            <td class="num">${formatNumber(row.shares)}</td>
            <td class="num">${formatPct(row.weight)}</td>
            <td class="num ${deltaClass(change.shareDelta, change.status)}">${formatShares(change.shareDelta)}</td>
            <td><div class="weight-bar" style="--w:${clamp(row.weight * 10, 4, 100)}%"><span></span></div></td>
          </tr>
        `;
      })
      .join("");
  }

  function renderChanges() {
    const date = byId("changesDate").value;
    const etfCode = byId("changesEtf").value;
    const etf = findEtf(etfCode);
    const rows = compareEtf(date, etfCode);
    const filtered = rows.filter((row) => state.changeFilter === "all" || row.status === state.changeFilter);
    const counts = countStatuses(rows);
    const currentDate = latestDateForEtf(etfCode, date);
    const prev = currentDate ? previousDateForEtf(etfCode, currentDate) : null;

    byId("changesMetrics").innerHTML = [
      metricCard("新增持股", counts.added, "", "red"),
      metricCard("完全出清", counts.cleared, "", "green"),
      metricCard("加碼", counts.increased, "", "red"),
      metricCard("減碼", counts.reduced, "", "green"),
      metricCard("不變", counts.unchanged, "", "violet")
    ].join("");

    byId("changesTitle").textContent = `${etf.code} ${etf.name} 異動明細`;
    byId("changesRange").textContent = prev ? `${prev} -> ${currentDate}` : `${currentDate || date}，尚無前一快照`;
    byId("changesRows").innerHTML =
      filtered
        .map((row) => `
          <tr>
            <td>${statusChip(row.status)}</td>
            <td class="code">${row.code}</td>
            <td class="name">${escapeHtml(row.name)}</td>
            <td class="num">${row.today ? formatPct(row.today.weight) : "-"}</td>
            <td class="num">${row.prev ? formatPct(row.prev.weight) : "-"}</td>
            <td class="num ${deltaClass(row.shareDelta, row.status)}">${formatShares(row.shareDelta)}</td>
            <td>${sparkline(etfCode, row.code, date)}</td>
          </tr>
        `)
        .join("") || emptyRow(7, "此篩選沒有異動資料");
  }

  function renderOverlap() {
    const date = selectedDate();
    const selected = unique([
      byId("overlapA").value,
      byId("overlapB").value,
      byId("overlapC").value,
      byId("overlapD").value
    ]).map(findEtf);
    const analysis = analyzeOverlap(date, selected.map((etf) => etf.code));

    byId("overlapMetrics").innerHTML = [
      metricCard(`${selected.length} 檔共同`, analysis.allCommon.length, "檔", "red"),
      metricCard("3 檔以上", analysis.threePlus.length, "檔", "orange"),
      metricCard("2 檔以上共同", analysis.twoPlus.length, "檔", "cyan"),
      metricCard("獨有持股", analysis.uniqueOnly.length, "檔", "violet")
    ].join("");

    byId("overlapMatrix").innerHTML = overlapMatrix(date, selected);
    const rows = state.overlapMode === "common" ? analysis.twoPlus : analysis.uniqueOnly;
    byId("overlapRows").innerHTML =
      rows
        .map((row) => `
          <tr>
            <td class="code">${row.code}</td>
            <td class="name">${escapeHtml(row.name)}</td>
            <td>${holderDots(row.owners)}</td>
            <td class="num">${formatPct(row.avgWeight)}</td>
            <td class="num">${formatPct(row.totalWeight)}</td>
          </tr>
        `)
        .join("") || emptyRow(5, "沒有符合條件的持股");
  }

  function renderStock() {
    const date = selectedDate();
    const stock = stockMap.get(byId("stockSearch").value) || stockMap.get("2330") || stocks[0];
    const rows = stockHoldings(date, stock.code);
    const weights = rows.map((row) => row.weight);
    const avgWeight = weights.length ? sum(weights) / weights.length : 0;
    const maxWeight = weights.length ? Math.max(...weights) : 0;
    const totalShares = rows.length ? sum(rows.map((row) => row.shares)) : 0;

    byId("stockMetrics").innerHTML = [
      metricCard("持有 ETF 數", rows.length, "", "cyan"),
      metricCard("平均權重", formatPct(avgWeight), "", "amber"),
      metricCard("最高權重", formatPct(maxWeight), "", "amber"),
      metricCard("法人持股規模", `${formatWan(totalShares)}萬`, "", "cyan")
    ].join("");
    byId("stockChartTitle").textContent = `${stock.code} ${stock.name} 法人總持股規模`;
    byId("stockChartMeta").textContent = `${dates[0]} -> ${date}`;
    byId("stockChart").innerHTML = lineChart(stock.code, date, state.stockChartMode);
    byId("stockHoldings").innerHTML =
      rows
        .map((row) => {
          const change = compareEtf(date, row.etf).find((item) => item.code === stock.code) || { delta: 0, shareDelta: 0, status: "unchanged" };
          return `
            <div class="track-row">
              <div>${statusChip(change.status)}</div>
              <div>
                <div><span class="code">${row.etf}</span> <span class="subtle">${escapeHtml(findEtf(row.etf).short)}</span></div>
              </div>
              <div>${sparkline(row.etf, stock.code, date)}</div>
              <div class="num ${deltaClass(change.shareDelta, change.status)}">${formatShares(change.shareDelta)} · ${formatPct(row.prevWeight || 0)} -> ${formatPct(row.weight)}</div>
            </div>
          `;
        })
        .join("") || empty("目前沒有 ETF 持有這檔個股");
  }

  function renderSync() {
    const days = Number(byId("syncDays").value);
    const min = Number(byId("syncMin").value);
    const date = selectedDate();
    const rows = analyzeSync(days, min, date);
    const startDate = dates[Math.max(0, dates.indexOf(date) - days)];
    byId("syncBanner").innerHTML = `過去 <b>${days}</b> 天內，找到 <b>${rows.length}</b> 檔個股被 <b>${min} 家以上</b> ETF 同步增持`;
    byId("syncCards").innerHTML =
      rows
        .map((row) => `
          <article class="sync-card">
            <div class="sync-card-header">
              <div>
                <div class="code">${row.code}</div>
                <h3>${escapeHtml(row.name)}</h3>
                <p class="subtle">合計增幅 <span class="delta-up">${formatDelta(row.totalDelta)}</span>，最大單筆 ${formatDelta(row.maxDelta)}</p>
              </div>
              <div class="count-ring"><div><strong>${row.etfs.length}</strong><small>家</small></div></div>
            </div>
            <div class="etf-progress">
              ${row.etfs
                .slice(0, 4)
                .map((item) => `
                  <div class="progress-row">
                    <span class="subtle">${escapeHtml(findEtf(item.etf).short)}</span>
                    <span class="progress-line"><span style="--w:${clamp(item.delta / row.maxDelta * 100, 8, 100)}%"></span></span>
                    <span class="num delta-up">${formatDelta(item.delta)}</span>
                  </div>
                `)
                .join("")}
            </div>
            <div class="subtle">${startDate} -> ${date}</div>
          </article>
        `)
        .join("") || empty("沒有達到門檻的同步加碼股");
  }

  function renderBuyRadar() {
    const date = selectedDate();
    const adds = allEtfChanges(date).filter((row) => row.status === "added");
    const byEtf = group(adds, "etf");
    const grouped = groupByStock(adds).filter((row) => row.items.length > 1);

    byId("buyMetrics").innerHTML = [
      metricCard("有新增的 ETF", Object.keys(byEtf).length, "檔", "red"),
      metricCard("新增個股筆數", adds.length, "筆", "cyan"),
      metricCard("多家同步新增", grouped.length, "檔", "violet")
    ].join("");

    byId("buyRadarRows").innerHTML =
      Object.entries(byEtf)
        .map(([etfCode, rows]) => radarRow(etfCode, rows, "add"))
        .join("") || empty("今天沒有新增持股");
    byId("buyGroupedRows").innerHTML =
      grouped
        .map((row) => signalRow(row.code, row.name, `${row.items.length} 家同步新增`, row.items.map((item) => findEtf(item.etf).short).join("、"), "add"))
        .join("") || empty("沒有同一天被多家 ETF 新增的個股");
  }

  function renderSellRadar() {
    const date = selectedDate();
    const sells = allEtfChanges(date).filter((row) => row.status === "reduced" || row.status === "cleared");
    const byEtf = group(sells, "etf");
    const grouped = groupByStock(sells).filter((row) => row.items.length > 1);
    const cleared = sells.filter((row) => row.status === "cleared");

    byId("sellMetrics").innerHTML = [
      metricCard("有賣出的 ETF", Object.keys(byEtf).length, "檔", "green"),
      metricCard("減碼筆數", sells.length - cleared.length, "筆", "green"),
      metricCard("完全清空", cleared.length, "筆", "green"),
      metricCard("同步減碼", grouped.length, "檔", "violet")
    ].join("");

    byId("sellRadarRows").innerHTML =
      Object.entries(byEtf)
        .map(([etfCode, rows]) => radarRow(etfCode, rows, "sell"))
        .join("") || empty("今天沒有賣出或清空");
    byId("sellGroupedRows").innerHTML =
      grouped
        .map((row) => signalRow(row.code, row.name, `${row.items.length} 家同步減碼`, formatDelta(sum(row.items.map((item) => item.delta))), "sell"))
        .join("") || empty("沒有同一天被多家 ETF 減碼的個股");
  }

  function createSnapshots() {
    const data = {};
    dates.forEach((date, dateIndex) => {
      data[date] = {};
      etfs.forEach((etf, etfIndex) => {
        const baseCodes = unique([...commonCore, ...(etfExtra[etf.code] || [])]);
        const addEvents = events.filter((event) => event.etf === etf.code && event.type === "add" && event.index <= dateIndex);
        const addCodes = addEvents.map((event) => event.code);
        const allCodes = unique([...baseCodes, ...addCodes]);
        const rows = allCodes
          .filter((code) => !isCleared(etf.code, code, dateIndex))
          .map((code, position) => {
            const weight = calculateWeight(etf.code, etfIndex, code, position, dateIndex);
            if (weight <= 0.03) return null;
            const stock = stockMap.get(code);
            return {
              code,
              name: stock ? stock.name : code,
              shares: calculateShares(etf, code, weight, dateIndex),
              weight: round(weight)
            };
          })
          .filter(Boolean)
          .sort((a, b) => b.weight - a.weight || a.code.localeCompare(b.code));
        data[date][etf.code] = rows;
      });
    });
    return data;
  }

  function calculateWeight(etfCode, etfIndex, code, position, dateIndex) {
    const addEvent = events.find((event) => event.etf === etfCode && event.code === code && event.type === "add" && event.index <= dateIndex);
    const seededBase = addEvent
      ? addEvent.weight + (dateIndex - addEvent.index) * 0.08
      : (baseWeight[code] || 0.55) * (0.86 + ((etfIndex + position) % 5) * 0.055);
    const wave = ((((hash(`${etfCode}${code}`) + dateIndex * 7) % 9) - 4) * 0.025);
    let weight = seededBase + wave;

    Object.entries(syncTrends).forEach(([trendCode, trend]) => {
      if (trendCode === code && trend.etfs.includes(etfCode) && dateIndex >= trend.start) {
        weight += (dateIndex - trend.start) * trend.daily;
      }
    });

    events.forEach((event) => {
      if (event.etf === etfCode && event.code === code && event.index <= dateIndex) {
        if (event.type === "up" || event.type === "down") {
          weight += event.delta;
        }
      }
    });

    return Math.max(0, weight);
  }

  function calculateShares(etf, code, weight, dateIndex) {
    const seed = hash(`${etf.code}:${code}`);
    const base = etf.aum * 52000 + weight * 730000 + (seed % 9) * 18000 + dateIndex * (seed % 7000);
    return Math.max(1000, Math.round(base / 1000) * 1000);
  }

  function isCleared(etfCode, code, dateIndex) {
    return events.some((event) => event.etf === etfCode && event.code === code && event.type === "clear" && event.index <= dateIndex);
  }

  function getSnapshot(date, etfCode) {
    return (snapshots[date] && snapshots[date][etfCode]) || [];
  }

  function previousDate(date) {
    const index = dates.indexOf(date);
    return index > 0 ? dates[index - 1] : null;
  }

  function availableDatesForEtf(etfCode) {
    return dates.filter((date) => getSnapshot(date, etfCode).length > 0);
  }

  function latestDateForEtf(etfCode, upToDate) {
    const available = availableDatesForEtf(etfCode).filter((date) => !upToDate || date <= upToDate);
    return available.length ? available[available.length - 1] : null;
  }

  function previousDateForEtf(etfCode, currentDate) {
    const available = availableDatesForEtf(etfCode);
    const index = available.indexOf(currentDate);
    return index > 0 ? available[index - 1] : null;
  }

  function getAnalysisSnapshot(date, etfCode) {
    const effectiveDate = latestDateForEtf(etfCode, date);
    return effectiveDate ? getSnapshot(effectiveDate, etfCode) : [];
  }

  function compareEtf(date, etfCode) {
    const currentDate = latestDateForEtf(etfCode, date);
    if (!currentDate) return [];
    const prev = previousDateForEtf(etfCode, currentDate);
    const todayRows = getSnapshot(currentDate, etfCode);
    const prevRows = prev ? getSnapshot(prev, etfCode) : [];
    if (!prev) {
      return todayRows.map((row) => ({
        etf: etfCode,
        code: row.code,
        name: row.name,
        today: row,
        prev: null,
        delta: 0,
        status: "unchanged"
      }));
    }
    const todayMap = new Map(todayRows.map((row) => [row.code, row]));
    const prevMap = new Map(prevRows.map((row) => [row.code, row]));
    const codes = unique([...todayMap.keys(), ...prevMap.keys()]);
    return codes
      .map((code) => {
        const today = todayMap.get(code);
        const before = prevMap.get(code);
        const delta = round(((today && today.weight) || 0) - ((before && before.weight) || 0));
        const shareDelta = round(((today && today.shares) || 0) - ((before && before.shares) || 0));
        let status = "unchanged";
        if (today && !before) status = "added";
        else if (!today && before) status = "cleared";
        else if (shareDelta > 0) status = "increased";
        else if (shareDelta < 0) status = "reduced";
        const stock = stockMap.get(code);
        return {
          etf: etfCode,
          code,
          name: stock ? stock.name : code,
          today,
          prev: before,
          delta,
          shareDelta,
          status
        };
      })
      .sort((a, b) => statusRank(a.status) - statusRank(b.status) || Math.abs(b.shareDelta || 0) - Math.abs(a.shareDelta || 0) || Math.abs(b.delta) - Math.abs(a.delta) || a.code.localeCompare(b.code));
  }

  function allEtfChanges(date) {
    return etfs
      .filter((etf) => latestDateForEtf(etf.code, date) === date)
      .flatMap((etf) => compareEtf(date, etf.code));
  }

  function countStatuses(rows) {
    return rows.reduce(
      (acc, row) => {
        acc[row.status] += 1;
        return acc;
      },
      { added: 0, cleared: 0, increased: 0, reduced: 0, unchanged: 0 }
    );
  }

  function analyzeOverlap(date, etfCodes) {
    const perStock = new Map();
    etfCodes.forEach((etfCode) => {
      getAnalysisSnapshot(date, etfCode).forEach((row) => {
        if (!perStock.has(row.code)) {
          perStock.set(row.code, { code: row.code, name: row.name, owners: [], totalWeight: 0 });
        }
        const item = perStock.get(row.code);
        item.owners.push({ etf: etfCode, weight: row.weight });
        item.totalWeight += row.weight;
      });
    });
    const rows = [...perStock.values()].map((row) => ({
      ...row,
      avgWeight: row.totalWeight / row.owners.length
    }));
    rows.sort((a, b) => b.owners.length - a.owners.length || b.avgWeight - a.avgWeight);
    return {
      allCommon: rows.filter((row) => row.owners.length === etfCodes.length),
      threePlus: rows.filter((row) => row.owners.length >= 3),
      twoPlus: rows.filter((row) => row.owners.length >= 2),
      uniqueOnly: rows.filter((row) => row.owners.length === 1)
    };
  }

  function analyzeSync(days, minCount, endDate) {
    const endIndex = dates.indexOf(endDate);
    const startIndex = Math.max(0, endIndex - days);
    const startDate = dates[startIndex];
    const rows = [];
    stocks.forEach((stock) => {
      const etfMoves = etfs
        .map((etf) => {
          const startSnapshotDate = latestDateForEtf(etf.code, startDate);
          const endSnapshotDate = latestDateForEtf(etf.code, endDate);
          if (!startSnapshotDate || !endSnapshotDate || startSnapshotDate === endSnapshotDate) return null;
          const start = getSnapshot(startSnapshotDate, etf.code).find((row) => row.code === stock.code);
          const end = getSnapshot(endSnapshotDate, etf.code).find((row) => row.code === stock.code);
          if (!start || !end) return null;
          const delta = round(((end && end.weight) || 0) - ((start && start.weight) || 0));
          return delta > 0.05 ? { etf: etf.code, delta } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.delta - a.delta);
      if (etfMoves.length >= minCount) {
        rows.push({
          code: stock.code,
          name: stock.name,
          etfs: etfMoves,
          totalDelta: round(sum(etfMoves.map((item) => item.delta))),
          maxDelta: Math.max(...etfMoves.map((item) => item.delta))
        });
      }
    });
    return rows.sort((a, b) => b.etfs.length - a.etfs.length || b.totalDelta - a.totalDelta);
  }

  function stockHoldings(date, code) {
    return etfs
      .map((etf) => {
        const currentDate = latestDateForEtf(etf.code, date);
        if (!currentDate) return null;
        const prev = previousDateForEtf(etf.code, currentDate);
        const today = getSnapshot(currentDate, etf.code).find((row) => row.code === code);
        if (!today) return null;
        const before = prev ? getSnapshot(prev, etf.code).find((row) => row.code === code) : null;
        return {
          etf: etf.code,
          weight: today.weight,
          prevWeight: (before && before.weight) || 0,
          shares: today.shares
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.weight - a.weight);
  }

  function overlapMatrix(date, selected) {
    const maxPair = Math.max(
      1,
      ...selected.flatMap((a) =>
        selected.map((b) => (a.code === b.code ? 0 : pairIntersection(date, a.code, b.code).length))
      )
    );
    const head = selected.map((etf) => `<th class="code">${etf.code}</th>`).join("");
    const body = selected
      .map((rowEtf) => `
        <tr>
          <th class="code">${rowEtf.code}</th>
          ${selected
            .map((colEtf) => {
              if (rowEtf.code === colEtf.code) return `<td class="self">-</td>`;
              const count = pairIntersection(date, rowEtf.code, colEtf.code).length;
              const alpha = clamp(count / maxPair * 0.45, 0.08, 0.45).toFixed(2);
              const cls = count >= maxPair * 0.78 ? "hot" : count >= maxPair * 0.55 ? "warm" : "";
              return `<td class="${cls}" style="--alpha:${alpha}">${count}</td>`;
            })
            .join("")}
        </tr>
      `)
      .join("");
    return `<table><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  function pairIntersection(date, etfA, etfB) {
    const a = new Set(getAnalysisSnapshot(date, etfA).map((row) => row.code));
    return getAnalysisSnapshot(date, etfB)
      .map((row) => row.code)
      .filter((code) => a.has(code));
  }

  function lineChart(code, endDate, mode) {
    const endIndex = dates.indexOf(endDate);
    const chartDates = dates.slice(0, endIndex + 1);
    const values = chartDates.map((date) => {
      const rows = stockHoldings(date, code).map((row) => row.shares).sort((a, b) => b - a);
      const chosen = mode === "top3" ? rows.slice(0, 3) : rows;
      return sum(chosen);
    });
    if (!values.some(Boolean)) return empty("沒有足夠資料繪製趨勢");

    const width = 900;
    const height = 280;
    const pad = { top: 24, right: 26, bottom: 44, left: 60 };
    const max = Math.max(...values) * 1.08;
    const min = Math.min(...values) * 0.92;
    const x = (index) => pad.left + (index / Math.max(1, values.length - 1)) * (width - pad.left - pad.right);
    const y = (value) => pad.top + (1 - (value - min) / Math.max(1, max - min)) * (height - pad.top - pad.bottom);
    const points = values.map((value, index) => [x(index), y(value)]);
    const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(" ");
    const area = `${line} L ${points[points.length - 1][0].toFixed(1)} ${height - pad.bottom} L ${points[0][0].toFixed(1)} ${height - pad.bottom} Z`;
    const grid = [0, 1, 2, 3].map((tick) => {
      const gy = pad.top + tick * ((height - pad.top - pad.bottom) / 3);
      const label = formatWan(max - tick * ((max - min) / 3));
      return `<line class="chart-grid" x1="${pad.left}" x2="${width - pad.right}" y1="${gy}" y2="${gy}"/><text class="chart-label" x="12" y="${gy + 4}">${label}萬</text>`;
    }).join("");
    const labels = chartDates.map((date, index) => {
      if (index % 2 !== 0 && index !== chartDates.length - 1) return "";
      return `<text class="chart-label" x="${x(index) - 22}" y="${height - 12}">${date.slice(5)}</text>`;
    }).join("");
    const last = points[points.length - 1];

    return `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="持股規模趨勢">
        ${grid}
        <path class="chart-area" d="${area}"></path>
        <path class="chart-line" d="${line}"></path>
        <circle class="chart-point" cx="${last[0]}" cy="${last[1]}" r="7"></circle>
        ${labels}
      </svg>
    `;
  }

  function sparkline(etfCode, code, endDate) {
    const endIndex = dates.indexOf(endDate);
    const start = Math.max(0, endIndex - 5);
    const values = dates.slice(start, endIndex + 1).map((date) => {
      const row = getSnapshot(date, etfCode).find((item) => item.code === code);
      return (row && row.weight) || 0;
    });
    const max = Math.max(...values, 0.1);
    const min = Math.min(...values);
    return `
      <span class="spark" aria-hidden="true">
        ${values
          .map((value, index) => {
            const prev = index > 0 ? values[index - 1] : value;
            const height = clamp(((value - min) / Math.max(0.01, max - min)) * 28 + 4, 4, 32);
            const trend = value > prev ? "up" : value < prev ? "down" : "";
            return `<span class="${trend}" style="height:${height}px"></span>`;
          })
          .join("")}
      </span>
    `;
  }

  function statusChip(status) {
    const label = {
      added: "新增",
      cleared: "清空",
      increased: "加碼",
      reduced: "減碼",
      unchanged: "不變"
    }[status] || status;
    return `<span class="status-chip ${status}">${label}</span>`;
  }

  function statusRank(status) {
    const rank = { added: 0, cleared: 1, increased: 2, reduced: 3, unchanged: 4 }[status];
    return typeof rank === "number" ? rank : 9;
  }

  function deltaClass(delta, status) {
    if (status === "added" || delta > 0) return "delta-up";
    if (status === "cleared" || delta < 0) return "delta-down";
    return "delta-flat";
  }

  function metricCard(label, value, unit, color = "cyan") {
    const display = typeof value === "number" ? formatNumber(value) : value;
    return `
      <article class="metric-card ${color}">
        <div class="metric-label"><span class="metric-dot"></span>${escapeHtml(label)}</div>
        <div class="metric-value">${display}${unit ? `<small>${escapeHtml(unit)}</small>` : ""}</div>
      </article>
    `;
  }

  function topRows(rows, limit, type) {
    const grouped = groupByStock(rows);
    return (
      grouped
        .slice(0, limit)
        .map((row) => signalRow(row.code, row.name, `${row.items.length} 筆`, row.items.map((item) => findEtf(item.etf).short).join("、"), type))
        .join("") || empty(type === "add" ? "今天沒有新增持股" : "今天沒有賣出或減碼")
    );
  }

  function signalRow(code, name, meta, tail, type) {
    const pillClass = type === "sell" ? "sell" : type === "sync" ? "sync" : "add";
    return `
      <div class="signal-row">
        <div class="code">${code}</div>
        <div>
          <div class="name">${escapeHtml(name)}</div>
          <div class="subtle">${escapeHtml(meta)}</div>
        </div>
        <div class="subtle">${escapeHtml(tail)}</div>
        <span class="pill ${pillClass}">${type === "sell" ? "賣出" : type === "sync" ? "加碼" : "新增"}</span>
      </div>
    `;
  }

  function radarRow(etfCode, rows, type) {
    const etf = findEtf(etfCode);
    const sorted = rows.slice().sort((a, b) => Math.abs(b.shareDelta || 0) - Math.abs(a.shareDelta || 0) || Math.abs(b.delta) - Math.abs(a.delta));
    return `
      <div class="radar-row ${type === "sell" ? "sell" : ""}">
        <div>
          <div class="code">${etf.code}</div>
          <div class="subtle">${escapeHtml(etf.short)}</div>
        </div>
        <div class="pill-row">
          ${sorted
            .map((row) => `
              <span class="pill ${type === "sell" ? "sell" : "add"}">
                <span class="code">${row.code}</span>
                ${escapeHtml(row.name)}
                <span class="${deltaClass(row.shareDelta, row.status)}">${row.status === "added" ? "新進" : formatShares(row.shareDelta)}</span>
              </span>
            `)
            .join("")}
        </div>
        <span class="pill ${type === "sell" ? "sell" : "add"}">${rows.length} 筆</span>
      </div>
    `;
  }

  function holderDots(owners) {
    return `<span class="pill-row">${owners
      .map((owner) => {
        const etf = findEtf(owner.etf);
        return `<span class="pill" title="${escapeHtml(etf.name)}"><i class="dot" style="background:${etf.color}"></i>${etf.code}</span>`;
      })
      .join("")}</span>`;
  }

  function groupByStock(rows) {
    const map = new Map();
    rows.forEach((row) => {
      if (!map.has(row.code)) map.set(row.code, { code: row.code, name: row.name, items: [] });
      map.get(row.code).items.push(row);
    });
    return [...map.values()].sort((a, b) => b.items.length - a.items.length || Math.abs(sum(b.items.map((row) => row.delta))) - Math.abs(sum(a.items.map((row) => row.delta))));
  }

  function group(rows, key) {
    return rows.reduce((acc, row) => {
      acc[row[key]] = acc[row[key]] || [];
      acc[row[key]].push(row);
      return acc;
    }, {});
  }

  function resolveStock(query) {
    const normalized = String(query || "").trim();
    const matched = normalized.match(/[0-9A-Z*-]{4,}/);
    const code = matched && matched[0];
    if (code && stockMap.has(code)) return stockMap.get(code);
    return stocks.find((stock) => normalized.includes(stock.name) || stock.name.includes(normalized));
  }

  function selectedDate() {
    return byId("globalDate").value || latestDate;
  }

  function findEtf(code) {
    return etfs.find((etf) => etf.code === code) || etfs[0];
  }

  function valueFrom(row, keys) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
    }
    return "";
  }

  function parseNumeric(value) {
    if (typeof value === "number") return value;
    const normalized = String(value || "").replace(/[%,$，,]/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function isDateKey(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value));
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function uniqueCount(rows, key) {
    return unique(rows.map((row) => row[key])).length;
  }

  function sum(values) {
    return values.reduce((total, value) => total + Number(value || 0), 0);
  }

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function hash(value) {
    return String(value)
      .split("")
      .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0) >>> 0;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("zh-TW").format(value);
  }

  function formatPct(value) {
    return `${Number(value || 0).toFixed(2)}%`;
  }

  function formatDelta(value) {
    const number = Number(value || 0);
    return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
  }

  function formatShares(value) {
    const number = Number(value || 0);
    if (!number) return "0";
    return `${number > 0 ? "+" : ""}${formatNumber(number)}`;
  }

  function formatWan(value) {
    return Math.round(Number(value || 0) / 10000).toLocaleString("zh-TW");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function empty(message) {
    return `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  function emptyRow(colspan, message) {
    return `<tr><td colspan="${colspan}" class="empty-state">${escapeHtml(message)}</td></tr>`;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function toast(message) {
    const node = byId("toast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove("show"), 1800);
  }
})();
