const state = {
  selectedId: QUICK_DATA[0]?.num,
  filter: "",
};

const questionList = document.querySelector("#questionList");
const chips = document.querySelector("#chips");
const customSearchesWrap = document.querySelector("#customSearchesWrap");
const customSearches = document.querySelector("#customSearches");
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

const CUSTOM_SEARCH_KEY = "debateQuickRefCustomSearches";
let customKeywords = loadCustomKeywords();

function loadCustomKeywords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_SEARCH_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function saveCustomKeywords() {
  try {
    localStorage.setItem(CUSTOM_SEARCH_KEY, JSON.stringify(customKeywords));
  } catch {
    // Some embedded browser contexts disable storage; keep current-session buttons working.
  }
}

function normalizeKeyword(value) {
  return value.trim().replace(/\s+/g, " ");
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
  customSearchesWrap.classList.toggle("visible", customKeywords.length > 0);

  customKeywords.forEach((keyword) => {
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
    remove.textContent = "x";
    remove.setAttribute("aria-label", `刪除 ${keyword}`);
    remove.addEventListener("click", () => {
      customKeywords = customKeywords.filter((item) => item !== keyword);
      if (state.filter === keyword) {
        state.filter = "";
        search.value = "";
      }
      saveCustomKeywords();
      render();
    });

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
  if (!customKeywords.includes(keyword)) {
    customKeywords.unshift(keyword);
    saveCustomKeywords();
  }
  const first = QUICK_DATA.find(matches);
  if (first) state.selectedId = first.num;
  render();
}

saveSearch.addEventListener("click", saveCurrentSearch);

search.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveCurrentSearch();
  }
});

render();
