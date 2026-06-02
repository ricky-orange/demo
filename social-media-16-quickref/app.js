const state = {
  selectedId: QUICK_DATA[0]?.num,
  filter: "",
};

const questionList = document.querySelector("#questionList");
const chips = document.querySelector("#chips");
const customSearchesWrap = document.querySelector("#customSearchesWrap");
const customSearches = document.querySelector("#customSearches");
const customStatus = document.querySelector("#customStatus");
const search = document.querySelector("#search");
const saveSearch = document.querySelector("#saveSearch");
const title = document.querySelector("#title");
const source = document.querySelector("#source");
const supplement = document.querySelector("#supplement");
const answer = document.querySelector("#answer");
const activeTags = document.querySelector("#activeTags");
const count = document.querySelector("#count");

const FILTER_TAGS = [
  "為什麼是16歲",
  "法律定義的青少年",
  "澳洲現況",
  "立法趨勢",
  "如何處罰",
  "驗證違規",
  "因果關係",
  "預防原則",
  "雙向惡化循環",
  "數位素養",
  "地下化",
  "防弊做法",
  "個資問題",
  "菸酒類比",
  "自由主義",
  "手機保母",
  "家庭責任",
  "青少年模式",
  "科技治理",
  "申訴制度",
  "年齡誤判",
  "平台自律",
  "弱勢兒少",
  "低法律門檻",
  "錯置辯題",
  "滑坡謬誤",
];

const TEAM_TAGS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1FwGAngqiI6Pit-O4rFVGYFh1ohADb26RfXlZPce9oqo/export?format=csv&gid=0";
const TEAM_TAGS_WRITE_URL =
  "https://script.google.com/macros/s/AKfycbwIuI_vxurbmhKCfVOEttn8G9fc9-Sa5Ax5_NneAsUMcw1zZ9sbE8_GeuTbokq_8RVi/exec";
const TEAM_TAGS_WRITE_KEY = "1234";
const HIDDEN_TEAM_KEYWORDS = new Set(["測試寫入1234"]);
let teamKeywords = [];
let teamStatus = "正在讀取團隊自訂標籤...";

function normalizeKeyword(value) {
  return value.trim().replace(/\s+/g, " ");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function keywordEnabled(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return !["false", "0", "no", "n", "否", "停用"].includes(normalized);
}

async function loadTeamKeywords() {
  try {
    const response = await fetch(TEAM_TAGS_CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = parseCsv(await response.text());
    const keywordState = new Map();
    rows.slice(1).forEach((row) => {
      const keyword = normalizeKeyword(row[0] || "");
      if (!keyword || HIDDEN_TEAM_KEYWORDS.has(keyword)) return;
      keywordState.delete(keyword);
      keywordState.set(keyword, keywordEnabled(row[1]));
    });
    teamKeywords = Array.from(keywordState.entries())
      .filter(([, enabled]) => enabled)
      .map(([keyword]) => keyword)
      .reverse();
    teamStatus = teamKeywords.length ? "" : "Google Sheet 目前沒有啟用的自訂標籤。";
  } catch {
    teamStatus = "團隊自訂標籤讀取失敗，請確認 Google Sheet 權限後重新整理。";
  }
  render();
}

async function writeTeamKeyword(keyword) {
  if (!keyword || teamKeywords.includes(keyword)) return;

  teamKeywords.unshift(keyword);
  teamStatus = "";
  render();

  const body = new URLSearchParams({
    key: TEAM_TAGS_WRITE_KEY,
    action: "add",
    keyword,
    note: "from quick reference site",
  });

  try {
    await fetch(TEAM_TAGS_WRITE_URL, {
      method: "POST",
      mode: "no-cors",
      body,
    });
    window.setTimeout(loadTeamKeywords, 1500);
  } catch {
    teamStatus = "寫入 Google Sheet 失敗，請確認 Apps Script 部署狀態。";
    render();
  }
}

async function deleteTeamKeyword(keyword) {
  teamKeywords = teamKeywords.filter((item) => item !== keyword);
  if (state.filter === keyword) {
    state.filter = "";
    search.value = "";
  }
  teamStatus = "";
  render();

  const body = new URLSearchParams({
    key: TEAM_TAGS_WRITE_KEY,
    action: "delete",
    keyword,
    note: "deleted from quick reference site",
  });

  try {
    await fetch(TEAM_TAGS_WRITE_URL, {
      method: "POST",
      mode: "no-cors",
      body,
    });
    window.setTimeout(loadTeamKeywords, 1500);
  } catch {
    teamStatus = "刪除 Google Sheet 標籤失敗，請確認 Apps Script 部署狀態。";
    render();
  }
}

function matches(item) {
  const q = state.filter.trim().toLowerCase();
  if (!q) return true;
  const haystack = [item.title, item.answer, item.supplement, item.source, ...item.tags]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function renderChips() {
  chips.innerHTML = "";
  const all = document.createElement("button");
  all.className = `chip${state.filter ? "" : " active"}`;
  all.type = "button";
  all.textContent = "全部";
  all.addEventListener("click", () => {
    state.filter = "";
    search.value = "";
    render();
  });
  chips.appendChild(all);

  FILTER_TAGS.forEach((tag) => {
    const chip = document.createElement("button");
    chip.className = `chip${state.filter === tag ? " active" : ""}`;
    chip.type = "button";
    chip.textContent = tag;
    chip.addEventListener("click", () => {
      state.filter = tag;
      search.value = tag;
      const first = QUICK_DATA.find(matches);
      if (first) state.selectedId = first.num;
      render();
    });
    chips.appendChild(chip);
  });
}

function renderCustomSearches() {
  customSearches.innerHTML = "";
  customStatus.textContent = teamStatus || (teamKeywords.length ? "" : "Google Sheet 目前沒有啟用的自訂標籤。");

  teamKeywords.forEach((keyword) => {
    const chip = document.createElement("span");
    chip.className = `custom-chip${state.filter === keyword ? " active" : ""}`;

    const label = document.createElement("button");
    label.type = "button";
    label.className = "custom-label";
    label.textContent = keyword;
    label.addEventListener("click", () => {
      state.filter = keyword;
      search.value = keyword;
      const first = QUICK_DATA.find(matches);
      if (first) state.selectedId = first.num;
      render();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "custom-remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `刪除 ${keyword}`);
    remove.addEventListener("click", () => deleteTeamKeyword(keyword));

    chip.append(label, remove);
    customSearches.appendChild(chip);
  });
}

function renderList(items) {
  questionList.innerHTML = "";
  if (!items.length) {
    questionList.innerHTML = '<p class="empty">找不到符合的回答。</p>';
    return;
  }

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `question${item.num === state.selectedId ? " active" : ""}`;
    button.innerHTML = `<strong>${item.num}</strong><span>${item.title}</span>`;
    button.addEventListener("click", () => {
      state.selectedId = item.num;
      render();
    });
    questionList.appendChild(button);
  });
}

function renderAnswer(item) {
  title.textContent = item.title;
  source.textContent = `來源：${item.source}`;
  supplement.textContent = item.supplement ? `補充：${item.supplement}` : "";
  answer.textContent = item.answer;
  activeTags.innerHTML = item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
}

function render() {
  const items = QUICK_DATA.filter(matches);
  if (!items.some((item) => item.num === state.selectedId) && items[0]) {
    state.selectedId = items[0].num;
  }
  renderChips();
  renderCustomSearches();
  renderList(items);
  const active = QUICK_DATA.find((item) => item.num === state.selectedId) || items[0];
  if (active) renderAnswer(active);
  count.textContent = `${items.length} / ${QUICK_DATA.length} 題`;
}

search.addEventListener("input", (event) => {
  state.filter = event.target.value;
  render();
});

function saveCurrentSearch() {
  const keyword = normalizeKeyword(search.value);
  if (!keyword) return;
  state.filter = keyword;
  const first = QUICK_DATA.find(matches);
  if (first) state.selectedId = first.num;
  render();
  writeTeamKeyword(keyword);
}

saveSearch.addEventListener("click", saveCurrentSearch);

search.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveCurrentSearch();
  }
});

render();
loadTeamKeywords();
