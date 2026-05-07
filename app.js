(() => {
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('zh-TW');
  const pct = (v) => `${Number(v || 0).toFixed(2)}%`;
  const plus = (v) => `${v >= 0 ? '+' : ''}${Number(v || 0).toFixed(2)}%`;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sum = (a) => a.reduce((t, v) => t + Number(v || 0), 0);
  const uniq = (a) => [...new Set(a.filter(Boolean))];

  let bundle = null;
  let snapshots = {};
  let dates = [];
  let etfs = [];
  let stocks = [];
  let stockMap = new Map();
  let view = 'dashboard';
  let changeFilter = 'all';
  let overlapMode = 'common';

  const viewMeta = {
    dashboard: ['總覽雷達', '追蹤每日換股、同步加碼與個股持有規模'],
    snapshot: ['每日成分股快照', '指定任一天，直接查看完整持股清單'],
    changes: ['持股異動偵測', '今日 vs 前一交易日，新增、清空、加碼、減碼一次攤開'],
    overlap: ['跨 ETF 持股重疊', '比較多檔 ETF 的共同持股與獨有持股'],
    stock: ['個股被持有追蹤', '查詢個股被哪些主動式 ETF 持有與增減態度'],
    sync: ['多家投信同步加碼', '跨監控清單找出短期共同加碼股'],
    buyRadar: ['新增雷達', '昨天沒有、今天新增的持股清單'],
    sellRadar: ['賣出雷達', '昨天到今天被減碼或清空的持股清單']
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    injectIcons();
    await loadBundle();
    bindEvents();
    populateControls();
    setView('dashboard');
  }

  async function loadBundle() {
    setSource('warning', '讀取靜態快照中', '正在載入 data/snapshots.json');
    try {
      const res = await fetch('./data/snapshots.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      bundle = await res.json();
    } catch (err) {
      bundle = { source: '無資料', fetchWarnings: [`讀不到 data/snapshots.json：${err.message}`], snapshots: {}, etfs: [] };
    }
    snapshots = bundle.snapshots || {};
    dates = Object.keys(snapshots).sort();
    const codes = uniq(dates.flatMap((d) => Object.keys(snapshots[d] || {})));
    etfs = (bundle.etfs || codes.map((code) => ({ code, name: code, short: code }))).filter((e) => codes.includes(e.code));
    const sm = new Map();
    dates.forEach((d) => Object.values(snapshots[d] || {}).flat().forEach((r) => sm.set(r.code, { code: r.code, name: r.name || r.code })));
    stocks = [...sm.values()].sort((a, b) => a.code.localeCompare(b.code));
    stockMap = sm;
    const latest = dates[dates.length - 1] || '無資料';
    const first = dates[0] || '無資料';
    const label = bundle.isRealData === false ? '示範資料' : (bundle.source || 'data/snapshots.json');
    setSource(bundle.isRealData === false ? 'demo' : 'external', label, `${first} -> ${latest} · 更新 ${bundle.updatedAt || '未知'} · 公開靜態版只讀 data/snapshots.json`);
  }

  function setSource(kind, label, detail) {
    const url = bundle && bundle.sourceUrl ? ` <a href="${esc(bundle.sourceUrl)}" target="_blank" rel="noopener">來源連結</a>` : '';
    $('dataSourceStatus').innerHTML = `<span class="data-source-dot ${kind}"></span><strong>${esc(label)}</strong><small>${esc(detail)}</small>${url}`;
    const warnings = (bundle && bundle.fetchWarnings) || [];
    $('dataSourceAlert').hidden = warnings.length === 0;
    $('dataSourceAlert').textContent = warnings.join('；');
  }

  function bindEvents() {
    document.querySelectorAll('.nav-tab,.view-jump').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
    $('globalDate').addEventListener('change', render);
    $('scanButton').addEventListener('click', async () => { await loadBundle(); populateControls(); render(); toast('已重新讀取靜態快照'); });
    $('loadSnapshot').addEventListener('click', renderSnapshot);
    $('analyzeChanges').addEventListener('click', renderChanges);
    $('compareOverlap').addEventListener('click', renderOverlap);
    $('toggleUnique').addEventListener('click', () => { overlapMode = overlapMode === 'common' ? 'unique' : 'common'; renderOverlap(); });
    $('trackStock').addEventListener('click', renderStock);
    $('querySync').addEventListener('click', renderSync);
    document.querySelectorAll('[data-change-filter]').forEach((b) => b.addEventListener('click', () => { changeFilter = b.dataset.changeFilter; document.querySelectorAll('[data-change-filter]').forEach((x) => x.classList.toggle('active', x === b)); renderChanges(); }));
  }

  function populateControls() {
    const dateOpts = dates.slice().reverse().map((d) => `<option value="${d}">${d}</option>`).join('');
    ['globalDate','snapshotDate','changesDate'].forEach((id) => { $(id).innerHTML = dateOpts; $(id).value = dates[dates.length - 1] || ''; });
    const etfOpts = etfs.map((e) => `<option value="${e.code}">${e.code} ${esc(e.name || e.short || '')}</option>`).join('');
    ['snapshotEtf','changesEtf','overlapA','overlapB','overlapC','overlapD'].forEach((id, i) => { $(id).innerHTML = etfOpts; if (etfs[i]) $(id).value = etfs[i].code; });
    $('watchCount').textContent = String(etfs.length);
    $('stockList').innerHTML = stocks.map((s) => `<option value="${s.code} ${esc(s.name)}"></option>`).join('');
    if (stocks.some((s) => s.code === '2383')) $('stockSearch').value = '2383';
  }

  function setView(next) {
    view = next;
    document.querySelectorAll('.view').forEach((n) => n.classList.toggle('active', n.id === view));
    document.querySelectorAll('.nav-tab').forEach((n) => n.classList.toggle('active', n.dataset.view === view));
    $('viewTitle').textContent = viewMeta[view][0];
    $('viewSubtitle').textContent = viewMeta[view][1];
    render();
  }

  function render() {
    ({ dashboard: renderDashboard, snapshot: renderSnapshot, changes: renderChanges, overlap: renderOverlap, stock: renderStock, sync: renderSync, buyRadar: renderBuyRadar, sellRadar: renderSellRadar }[view] || renderDashboard)();
  }

  function selectedDate() { return $('globalDate').value || dates[dates.length - 1]; }
  function rows(date, etf) { return ((snapshots[date] || {})[etf] || []).slice(); }
  function datesFor(etf) { return dates.filter((d) => rows(d, etf).length); }
  function latestFor(etf, date) { return datesFor(etf).filter((d) => d <= date).pop() || ''; }
  function previousFor(etf, date) { const a = datesFor(etf); const i = a.indexOf(date); return i > 0 ? a[i - 1] : ''; }
  function effectiveRows(date, etf) { const d = latestFor(etf, date); return d ? rows(d, etf) : []; }
  function findEtf(code) { return etfs.find((e) => e.code === code) || { code, short: code, name: code }; }

  function compare(etf, date) {
    const d = latestFor(etf, date); if (!d) return [];
    const p = previousFor(etf, d);
    const now = new Map(rows(d, etf).map((r) => [r.code, r]));
    const old = new Map((p ? rows(p, etf) : []).map((r) => [r.code, r]));
    return uniq([...now.keys(), ...old.keys()]).map((code) => {
      const n = now.get(code), o = old.get(code), delta = Number(((n?.weight || 0) - (o?.weight || 0)).toFixed(4));
      let status = 'unchanged';
      if (n && !o && p) status = 'added'; else if (!n && o) status = 'cleared'; else if (delta > 0.01) status = 'increased'; else if (delta < -0.01) status = 'reduced';
      return { etf, code, name: (n || o || stockMap.get(code) || {}).name || code, today: n, prev: o, delta, status, date: d, prevDate: p };
    }).sort((a, b) => rank(a.status) - rank(b.status) || Math.abs(b.delta) - Math.abs(a.delta));
  }
  function allChanges(date) { return etfs.flatMap((e) => compare(e.code, date)); }
  function rank(s) { return { added: 0, cleared: 1, increased: 2, reduced: 3, unchanged: 4 }[s] ?? 9; }
  function cls(d, s) { return s === 'added' || d > 0 ? 'delta-up' : s === 'cleared' || d < 0 ? 'delta-down' : 'delta-flat'; }
  function chip(s) { return `<span class="status-chip ${s}">${({added:'新增',cleared:'清空',increased:'加碼',reduced:'減碼',unchanged:'不變'}[s] || s)}</span>`; }
  function metric(label, value, unit = '', color = 'cyan') { return `<article class="metric-card ${color}"><div class="metric-label"><span class="metric-dot"></span>${esc(label)}</div><div class="metric-value">${esc(value)}${unit ? `<small>${esc(unit)}</small>` : ''}</div></article>`; }
  function empty(msg) { return `<div class="empty-state">${esc(msg)}</div>`; }
  function emptyRow(n, msg) { return `<tr><td colspan="${n}" class="empty-state">${esc(msg)}</td></tr>`; }

  function renderDashboard() {
    const date = selectedDate(), ch = allChanges(date), add = ch.filter((r) => r.status === 'added'), sell = ch.filter((r) => ['cleared','reduced'].includes(r.status));
    $('dashboardMetrics').innerHTML = metric('監控 ETF', etfs.length, '檔') + metric('新增個股', add.length, '筆', 'red') + metric('減碼/清空', sell.length, '筆', 'green') + metric('資料日', date, '', 'amber');
    $('dashboardAdds').innerHTML = topSignals(add, 'add') || empty('今天沒有新增持股');
    $('dashboardSells').innerHTML = topSignals(sell, 'sell') || empty('今天沒有減碼或清空');
    $('dashboardSync').innerHTML = syncRows(5, 2, date).slice(0, 8).map((r) => signal(r.code, r.name, `${r.etfs.length} 家同步加碼`, plus(r.totalDelta), 'sync')).join('') || empty('目前沒有同步加碼訊號');
  }

  function renderSnapshot() {
    const date = $('snapshotDate').value || selectedDate(), etf = $('snapshotEtf').value || etfs[0]?.code, rs = rows(date, etf);
    const top5 = sum(rs.slice(0, 5).map((r) => r.weight));
    $('snapshotMetrics').innerHTML = metric('持股檔數', rs.length, '檔') + metric('權重加總', pct(sum(rs.map((r) => r.weight))), '', 'amber') + metric('前 5 大占比', pct(top5), '', 'orange') + metric('最大持股', rs[0] ? pct(rs[0].weight) : '0%', '', 'red');
    $('snapshotTitle').textContent = `${etf} ${findEtf(etf).short || ''}`;
    $('snapshotRange').textContent = date;
    $('snapshotRows').innerHTML = rs.map((r) => `<tr><td>-</td><td class="code">${esc(r.code)}</td><td>${esc(r.name)}</td><td class="num">${fmt.format(r.shares || 0)}</td><td class="num">${pct(r.weight)}</td><td class="num">-</td><td><div class="weight-bar"><span style="--w:${Math.min(100, r.weight * 10)}%"></span></div></td></tr>`).join('') || emptyRow(7, '此日期沒有這檔 ETF 的資料');
  }

  function renderChanges() {
    const date = $('changesDate').value || selectedDate(), etf = $('changesEtf').value || etfs[0]?.code;
    let rs = compare(etf, date); const c = count(rs); if (changeFilter !== 'all') rs = rs.filter((r) => r.status === changeFilter);
    $('changesMetrics').innerHTML = metric('新增持股', c.added, '', 'red') + metric('完全出清', c.cleared, '', 'green') + metric('加碼', c.increased, '', 'red') + metric('減碼', c.reduced, '', 'green') + metric('不變', c.unchanged, '', 'amber');
    $('changesTitle').textContent = `${etf} 異動明細`;
    $('changesRange').textContent = `${rs[0]?.prevDate || '-'} -> ${rs[0]?.date || date}`;
    $('changesRows').innerHTML = rs.map((r) => `<tr><td>${chip(r.status)}</td><td class="code">${esc(r.code)}</td><td>${esc(r.name)}</td><td class="num">${r.today ? pct(r.today.weight) : '-'}</td><td class="num">${r.prev ? pct(r.prev.weight) : '-'}</td><td class="num ${cls(r.delta, r.status)}">${plus(r.delta)}</td><td>${spark(etf, r.code, date)}</td></tr>`).join('') || emptyRow(7, '沒有符合條件的異動');
  }

  function count(rs) { return rs.reduce((a, r) => (a[r.status]++, a), { added:0, cleared:0, increased:0, reduced:0, unchanged:0 }); }

  function renderOverlap() {
    const date = selectedDate(), codes = uniq(['overlapA','overlapB','overlapC','overlapD'].map((id) => $(id).value)).filter(Boolean);
    const map = new Map();
    codes.forEach((e) => effectiveRows(date, e).forEach((r) => { if (!map.has(r.code)) map.set(r.code, { code:r.code, name:r.name, owners:[], total:0 }); const x = map.get(r.code); x.owners.push({ etf:e, weight:r.weight }); x.total += r.weight; }));
    const all = [...map.values()].sort((a, b) => b.owners.length - a.owners.length || b.total - a.total);
    const rowsOut = (overlapMode === 'unique' ? all.filter((r) => r.owners.length === 1) : all.filter((r) => r.owners.length >= 2));
    $('overlapMetrics').innerHTML = metric(`${codes.length} 檔共同`, all.filter((r) => r.owners.length === codes.length).length, '檔', 'red') + metric('3 檔以上', all.filter((r) => r.owners.length >= 3).length, '檔', 'orange') + metric('2 檔以上共同', all.filter((r) => r.owners.length >= 2).length, '檔') + metric('獨有持股', all.filter((r) => r.owners.length === 1).length, '檔', 'amber');
    $('overlapMatrix').innerHTML = matrix(date, codes);
    $('overlapRows').innerHTML = rowsOut.map((r) => `<tr><td class="code">${esc(r.code)}</td><td>${esc(r.name)}</td><td>${r.owners.map((o) => `<span class="pill">${o.etf}</span>`).join('')}</td><td class="num">${pct(r.total / r.owners.length)}</td><td class="num">${pct(r.total)}</td></tr>`).join('') || emptyRow(5, '沒有符合條件的重疊資料');
  }

  function matrix(date, codes) {
    const max = Math.max(1, ...codes.flatMap((a) => codes.map((b) => a === b ? 0 : intersect(date, a, b).length)));
    return `<table><thead><tr><th></th>${codes.map((c) => `<th class="code">${c}</th>`).join('')}</tr></thead><tbody>${codes.map((a) => `<tr><th class="code">${a}</th>${codes.map((b) => a === b ? '<td class="self">-</td>' : `<td class="${intersect(date,a,b).length / max > .7 ? 'hot' : 'warm'}" style="--alpha:${Math.max(.08, intersect(date,a,b).length/max*.45).toFixed(2)}">${intersect(date,a,b).length}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function intersect(date, a, b) { const s = new Set(effectiveRows(date, a).map((r) => r.code)); return effectiveRows(date, b).filter((r) => s.has(r.code)); }

  function renderStock() {
    const date = selectedDate(), q = $('stockSearch').value.trim(), code = (q.match(/[0-9A-Z*.-]{4,}/) || [q])[0], stock = stockMap.get(code) || stocks.find((s) => q.includes(s.name));
    if (!stock) { $('stockMetrics').innerHTML = metric('查無個股', q || '-', '', 'green'); $('stockHoldings').innerHTML = empty('請輸入代號或名稱'); $('stockChart').innerHTML = ''; return; }
    const hs = etfs.map((e) => { const d = latestFor(e.code, date), p = previousFor(e.code, d); const n = rows(d, e.code).find((r) => r.code === stock.code); const o = rows(p, e.code).find((r) => r.code === stock.code); return n ? { etf:e.code, row:n, prev:o, delta:Number((n.weight - (o?.weight || 0)).toFixed(4)) } : null; }).filter(Boolean).sort((a,b) => b.row.weight - a.row.weight);
    $('stockMetrics').innerHTML = metric('持有 ETF 數', hs.length, '檔') + metric('平均權重', hs.length ? pct(sum(hs.map((h) => h.row.weight))/hs.length) : '0%', '', 'amber') + metric('最高權重', hs[0] ? pct(hs[0].row.weight) : '0%', '', 'red') + metric('總持股數', fmt.format(sum(hs.map((h) => h.row.shares))), '', 'cyan');
    $('stockChartTitle').textContent = `${stock.code} ${stock.name} 法人總持股規模`;
    $('stockChart').innerHTML = chart(stock.code);
    $('stockHoldings').innerHTML = hs.map((h) => `<div class="track-row"><div class="code">${h.etf}</div><div>${esc(findEtf(h.etf).short)}</div><div>${spark(h.etf, stock.code, date)}</div><div class="num ${cls(h.delta, h.delta > 0 ? 'increased' : 'reduced')}">${h.prev ? plus(h.delta) : '新進'} · ${pct(h.row.weight)}</div></div>`).join('') || empty('目前沒有 ETF 持有這檔個股');
  }

  function syncRows(days, min, end) {
    const start = dates[Math.max(0, dates.indexOf(end) - days)] || end;
    return stocks.map((s) => { const moves = etfs.map((e) => { const a = effectiveRows(start, e.code).find((r) => r.code === s.code); const b = effectiveRows(end, e.code).find((r) => r.code === s.code); const d = Number(((b?.weight || 0) - (a?.weight || 0)).toFixed(4)); return d > .01 ? { etf:e.code, delta:d } : null; }).filter(Boolean); return { code:s.code, name:s.name, etfs:moves, totalDelta:sum(moves.map((m) => m.delta)) }; }).filter((r) => r.etfs.length >= min).sort((a,b) => b.etfs.length - a.etfs.length || b.totalDelta - a.totalDelta);
  }
  function renderSync() { const date = selectedDate(), rs = syncRows(Number($('syncDays').value), Number($('syncMin').value), date); $('syncBanner').innerHTML = `找到 <b>${rs.length}</b> 檔個股被 <b>${$('syncMin').value} 家以上</b> 同步加碼`; $('syncCards').innerHTML = rs.slice(0, 12).map((r) => `<article class="sync-card"><div class="sync-card-header"><div><h3 class="code">${r.code}</h3><p>${esc(r.name)}</p><p class="delta-up">合計 ${plus(r.totalDelta)}</p></div><div class="count-ring"><strong>${r.etfs.length}</strong><small>家</small></div></div><div class="etf-progress">${r.etfs.slice(0,5).map((m) => `<div class="progress-row"><span>${findEtf(m.etf).short}</span><div class="progress-line"><span style="--w:${Math.min(100, m.delta*30)}%"></span></div><b class="delta-up">${plus(m.delta)}</b></div>`).join('')}</div></article>`).join('') || empty('沒有符合條件的同步加碼股'); }

  function renderBuyRadar() { const date = selectedDate(), rs = allChanges(date).filter((r) => r.status === 'added'); $('buyMetrics').innerHTML = metric('有新增的 ETF', uniq(rs.map((r) => r.etf)).length, '檔') + metric('新增個股筆數', rs.length, '筆', 'red') + metric('同步新增', groupStock(rs).filter((g) => g.items.length > 1).length, '檔', 'amber'); $('buyRadarRows').innerHTML = byEtfRows(rs, 'add') || empty('沒有新增持股'); $('buyGroupedRows').innerHTML = groupStock(rs).filter((g) => g.items.length > 1).map((g) => signal(g.code, g.name, `${g.items.length} 家同步新增`, g.items.map((x) => x.etf).join('、'), 'add')).join('') || empty('沒有同步新增'); }
  function renderSellRadar() { const date = selectedDate(), rs = allChanges(date).filter((r) => ['cleared','reduced'].includes(r.status)); $('sellMetrics').innerHTML = metric('有賣出的 ETF', uniq(rs.map((r) => r.etf)).length, '檔', 'green') + metric('減碼筆數', rs.filter((r) => r.status === 'reduced').length, '筆', 'green') + metric('清空筆數', rs.filter((r) => r.status === 'cleared').length, '筆', 'green') + metric('同步減碼', groupStock(rs).filter((g) => g.items.length > 1).length, '檔', 'amber'); $('sellRadarRows').innerHTML = byEtfRows(rs, 'sell') || empty('沒有賣出或減碼'); $('sellGroupedRows').innerHTML = groupStock(rs).filter((g) => g.items.length > 1).map((g) => signal(g.code, g.name, `${g.items.length} 家同步減碼`, plus(sum(g.items.map((x) => x.delta))), 'sell')).join('') || empty('沒有同步減碼'); }

  function groupStock(rs) { const m = new Map(); rs.forEach((r) => { if (!m.has(r.code)) m.set(r.code, { code:r.code, name:r.name, items:[] }); m.get(r.code).items.push(r); }); return [...m.values()].sort((a,b) => b.items.length - a.items.length); }
  function topSignals(rs, type) { return groupStock(rs).slice(0, 8).map((g) => signal(g.code, g.name, `${g.items.length} 筆`, g.items.map((x) => findEtf(x.etf).short).join('、'), type)).join(''); }
  function signal(code, name, meta, tail, type) { const pc = type === 'sell' ? 'sell' : type === 'sync' ? 'sync' : 'add'; return `<div class="signal-row"><div class="code">${esc(code)}</div><div><div class="name">${esc(name)}</div><div class="subtle">${esc(meta)}</div></div><div class="subtle">${esc(tail)}</div><span class="pill ${pc}">${type === 'sell' ? '賣出' : type === 'sync' ? '同步' : '新增'}</span></div>`; }
  function byEtfRows(rs, type) { const by = {}; rs.forEach((r) => (by[r.etf] ||= []).push(r)); return Object.entries(by).map(([e, rows]) => `<div class="radar-row ${type === 'sell' ? 'sell' : ''}"><div><div class="code">${e}</div><div class="subtle">${esc(findEtf(e).short)}</div></div><div class="pill-row">${rows.map((r) => `<span class="pill ${type === 'sell' ? 'sell' : 'add'}"><span class="code">${r.code}</span>${esc(r.name)} <span class="${cls(r.delta,r.status)}">${r.status === 'added' ? '新進' : plus(r.delta)}</span></span>`).join('')}</div><span class="pill ${type === 'sell' ? 'sell' : 'add'}">${rows.length} 筆</span></div>`).join(''); }

  function spark(etf, code, end) { const i = dates.indexOf(end), ds = dates.slice(Math.max(0, i - 5), i + 1), vals = ds.map((d) => rows(d, etf).find((r) => r.code === code)?.weight || 0), mx = Math.max(.1, ...vals), mn = Math.min(...vals); return `<span class="spark">${vals.map((v,i) => `<span class="${i && v > vals[i-1] ? 'up' : i && v < vals[i-1] ? 'down' : ''}" style="height:${Math.max(4, ((v-mn)/Math.max(.01,mx-mn))*28+4)}px"></span>`).join('')}</span>`; }
  function chart(code) { const vals = dates.map((d) => sum(etfs.map((e) => rows(d, e.code).find((r) => r.code === code)?.shares || 0))); if (!vals.some(Boolean)) return empty('沒有足夠資料繪圖'); const w=900,h=280,p=35,mx=Math.max(...vals)*1.05,mn=Math.min(...vals)*.95; const pt=vals.map((v,i)=>[p+i*(w-p*2)/Math.max(1,vals.length-1), h-p-(v-mn)/Math.max(1,mx-mn)*(h-p*2)]); const line=pt.map((p,i)=>`${i?'L':'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' '); return `<svg viewBox="0 0 ${w} ${h}"><path class="chart-area" d="${line} L ${pt.at(-1)[0]} ${h-p} L ${pt[0][0]} ${h-p} Z"></path><path class="chart-line" d="${line}"></path><circle class="chart-point" cx="${pt.at(-1)[0]}" cy="${pt.at(-1)[1]}" r="7"></circle>${dates.map((d,i)=>`<text class="chart-label" x="${pt[i][0]-20}" y="${h-8}">${d.slice(5)}</text>`).join('')}</svg>`; }

  function injectIcons() { document.querySelectorAll('[data-icon]').forEach((n) => n.textContent = {radar:'◎',calendar:'▣',shuffle:'⇄',layers:'▤',search:'⌕',trend:'↗',plus:'＋',minus:'−',refresh:'↻'}[n.dataset.icon] || ''); }
  function toast(msg) { const n = $('toast'); n.textContent = msg; n.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => n.classList.remove('show'), 1800); }
})();
