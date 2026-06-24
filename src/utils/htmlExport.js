/**
 * HTML 报告导出工具
 * 生成独立的 HTML 文件，内嵌数据 + Chart.js 图表 + 筛选交互
 */

/**
 * 导出为独立 HTML 文件
 * @param {Object} params - 导出数据
 * @param {Array} params.data - 原始数据行
 * @param {Object} params.report - 数据完整性报告
 * @param {string} params.exportDate - 导出日期
 * @param {string} params.fileName - 文件名
 * @param {boolean} params.hasMediaField - 是否有媒体字段
 * @param {boolean} params.hasCountryField - 是否有国家字段
 */
export function exportToHTML({ data, report, exportDate, fileName, hasMediaField, hasCountryField, weeklyData, roiPredictions, analyses }) {
  // 将数据序列化为 JSON
  const dataJSON = JSON.stringify(data)
  const exportDateStr = exportDate ? new Date(exportDate).toLocaleDateString('zh-CN') : ''
  
  // ROI预测序列化（排除函数）
  const predictionsJSON = roiPredictions ? JSON.stringify(roiPredictions.map(p => ({
    weekKey: p.weekKey,
    observations: p.observations,
    prediction: {
      a: p.prediction.a,
      beta: p.prediction.beta,
      r2: p.prediction.r2,
      nPoints: p.prediction.nPoints,
      confidence: p.prediction.confidence,
      predictD180: p.prediction.predictD180,
      breakEvenDay: p.prediction.breakEvenDay,
      multiplier: p.prediction.multiplier,
      anchorDay: p.prediction.anchorDay,
      anchorROI: p.prediction.anchorROI
    }
  }))) : '[]'
  
  // 分析洞察序列化
  const analysesJSON = analyses ? JSON.stringify(analyses) : 'null'
  
  // 周数据序列化
  const weeklyDataJSON = weeklyData ? JSON.stringify(weeklyData) : '[]'
  
  const html = generateHTML({
    dataJSON,
    exportDateStr,
    report: report ? JSON.stringify(report) : 'null',
    hasMediaField: !!hasMediaField,
    hasCountryField: !!hasCountryField,
    generatedAt: new Date().toLocaleString('zh-CN'),
    predictionsJSON,
    analysesJSON,
    weeklyDataJSON
  })
  
  // 下载
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const dateStr = new Date().toISOString().split('T')[0]
  a.download = `${fileName || 'IAP游戏买量分析报告'}_${dateStr}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function generateHTML({ dataJSON, exportDateStr, report, hasMediaField, hasCountryField, generatedAt, predictionsJSON, analysesJSON, weeklyDataJSON }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>IAP游戏买量财务分析报告</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"><\/script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
header { background: #1e40af; color: white; padding: 24px 0; margin-bottom: 24px; }
header .container { display: flex; justify-content: space-between; align-items: center; }
header h1 { font-size: 24px; }
header .meta { font-size: 13px; opacity: 0.8; }
.card { background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.card h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #1e293b; }
.filters { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 20px; }
.filters label { font-size: 13px; font-weight: 500; color: #475569; }
.filters select { padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; background: white; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
.stat-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
.stat-value { font-size: 24px; font-weight: 700; color: #1e40af; }
.stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } }
.chart-container { position: relative; height: 300px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
tr:hover td { background: #f8fafc; }
.tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.tag-green { background: #dcfce7; color: #166534; }
.tag-yellow { background: #fef9c3; color: #854d0e; }
.tag-red { background: #fee2e2; color: #991b1b; }
.tag-blue { background: #dbeafe; color: #1e40af; }
.insight-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 12px; }
.insight-box h4 { font-size: 13px; font-weight: 600; color: #1e40af; margin-bottom: 8px; }
.insight-box ul { list-style: none; padding: 0; }
.insight-box li { font-size: 12px; color: #334155; padding: 2px 0; }
.insight-box li::before { content: "• "; color: #3b82f6; }
.alert { color: #b45309; font-weight: 500; }
.alert::before { content: "⚠ "; }
.week-selector { margin-bottom: 16px; }
.week-selector select { padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
.footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; }
.section-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #3b82f6; }
</style>
</head>
<body>

<header>
  <div class="container">
    <div>
      <h1>IAP游戏买量财务分析报告</h1>
      <div class="meta">数据导出日期: ${exportDateStr}</div>
    </div>
    <div class="meta">报告生成: ${generatedAt}</div>
  </div>
</header>

<div class="container">
  <!-- 筛选 -->
  <div class="card">
    <div class="filters" id="filters">
      <span style="font-weight:600;font-size:13px;">筛选条件：</span>
      ${hasMediaField ? `<label>媒体:</label><select id="f-media" onchange="applyFilters()"><option value="全部">全部</option></select>` : ''}
      <label>产品:</label><select id="f-appName" onchange="applyFilters()"><option value="全部">全部</option></select>
      ${hasCountryField ? `<label>国家:</label><select id="f-country" onchange="applyFilters()"><option value="全部">全部</option></select>` : ''}
      <label>查看周:</label><select id="f-week" onchange="applyFilters()"></select>
    </div>
  </div>

  <!-- 概览 -->
  <div class="section-title">概览</div>
  <div class="summary-grid" id="summary-cards"></div>

  <!-- ROI里程碑 -->
  <div class="section-title">产品ROI里程碑</div>
  <div class="card">
    <div style="overflow-x:auto;"><table id="roi-table"></table></div>
  </div>
  <div class="insight-box" id="insight-roi-table"></div>

  ${hasCountryField ? `
  <!-- 国家分析 -->
  <div class="section-title">国家投放分析</div>
  <div class="card">
    <div style="overflow-x:auto;"><table id="country-table"></table></div>
  </div>
  <div class="insight-box" id="insight-country"></div>` : ''}

  <!-- 趋势图表 -->
  <div class="section-title">趋势分析</div>
  <div class="charts-grid">
    <div class="card">
      <h3>ROI周趋势</h3>
      <div class="chart-container"><canvas id="chart-roi"></canvas></div>
      <div class="insight-box" id="insight-roi"></div>
    </div>
    <div class="card">
      <h3>留存率周趋势</h3>
      <div class="chart-container"><canvas id="chart-retention"></canvas></div>
      <div class="insight-box" id="insight-retention"></div>
    </div>
    <div class="card">
      <h3>CPA & DAU ARPU 趋势</h3>
      <div class="chart-container"><canvas id="chart-cpa"></canvas></div>
      <div class="insight-box" id="insight-cpa"></div>
    </div>
    <div class="card">
      <h3>LTV 趋势</h3>
      <div class="chart-container"><canvas id="chart-ltv"></canvas></div>
      <div class="insight-box" id="insight-ltv"></div>
    </div>
  </div>

  <!-- 付费率 & ARPPU -->
  <div class="section-title">付费分析</div>
  <div class="charts-grid">
    <div class="card">
      <h3>付费率 & ARPPU 趋势</h3>
      <div class="chart-container"><canvas id="chart-monetization"></canvas></div>
      <div class="insight-box" id="insight-monetization"></div>
    </div>
    <div class="card">
      <h3>付费留存率趋势</h3>
      <div class="chart-container"><canvas id="chart-paid-retention"></canvas></div>
      <div class="insight-box" id="insight-paid-retention"></div>
    </div>
  </div>

  <!-- ROI预测分析 -->
  <div class="section-title">ROI 预测分析</div>
  <div class="card">
    <h3>全周预测汇总</h3>
    <div style="overflow-x:auto;"><table id="roi-prediction-table"></table></div>
    <div id="prediction-method" style="margin-top:12px;font-size:12px;color:#64748b;"></div>
  </div>
</div>

<div class="footer">IAP游戏买量财务分析报告 | 仅供内部分析使用 | ${generatedAt}</div>

<script>
// ===== 嵌入数据 =====
const RAW_DATA = ${dataJSON};
const HAS_MEDIA = ${hasMediaField};
const HAS_COUNTRY = ${hasCountryField};
const ROI_PREDICTIONS = ${predictionsJSON};
const ANALYSES = ${analysesJSON};
const WEEKLY_DATA = ${weeklyDataJSON};

// ===== 字段映射 =====
const FM = {
  date: '日期', appName: '应用名称', media: '媒体', country: '国家',
  newUsers: '新增用户', spend: '消耗($)', revenue: '总收入($)', activeUsers: '活跃用户数',
  d1ROI: '首日ROI', d7ROI: '7日ROI', d14ROI: '14日ROI', d30ROI: '30日ROI', d60ROI: '60日ROI',
  d1LTV: '新增 arpu', d7LTV: 'LTV7', d14LTV: 'LTV14', d30LTV: 'LTV30', d60LTV: 'LTV60',
  d1Ret: '1日留存', d7Ret: '7日留存', d14Ret: '14日留存', d30Ret: '30日留存', d60Ret: '60日留存',
  payingRate: '付费率', arppu: '付费arppu', arpudau: 'dau arpu',
  meta: '_meta', isOrganic: '_isOrganic'
};

// ===== 工具函数 =====
function pn(v) { return typeof v === 'number' ? v : (typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) || 0 : 0); }
function pp(v) {
  if (typeof v === 'number') return v > 1 ? v / 100 : v;
  if (typeof v === 'string' && v.includes('%')) return parseFloat(v.replace('%', '')) / 100;
  return 0;
}
function sum(arr) { return arr.reduce((s, v) => s + (Number(v) || 0), 0); }
function wavg(values, weights) {
  let ws = 0, vs = 0;
  for (let i = 0; i < values.length; i++) {
    const v = Number(values[i]) || 0, w = Number(weights[i]) || 0;
    if (w > 0) { vs += v * w; ws += w; }
  }
  return ws > 0 ? vs / ws : null;
}
function aggROI(rois, spends) {
  let rev = 0, sp = 0;
  for (let i = 0; i < rois.length; i++) {
    const r = Number(rois[i]) || 0, s = Number(spends[i]) || 0;
    rev += r * s; sp += s;
  }
  return sp > 0 ? rev / sp : null;
}
function getISOWeek(dateStr) {
  const d = new Date(dateStr);
  const dn = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dn);
  const ys = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((d - ys) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: wk };
}
function weekKey(d) { return d.year + '-W' + String(d.week).padStart(2, '0'); }
function fmtPct(v) { return v != null ? (v * 100).toFixed(1) + '%' : '-'; }
function fmtMoney(v) { return v != null ? '$' + v.toFixed(2) : '-'; }
function fmtNum(v) { return v != null ? v.toLocaleString() : '-'; }
function levelTag(v, min, good, excellent) {
  if (v == null) return '-';
  if (v >= excellent) return '<span class="tag tag-green">优秀</span>';
  if (v >= good) return '<span class="tag tag-blue">良好</span>';
  if (v >= min) return '<span class="tag tag-yellow">一般</span>';
  return '<span class="tag tag-red">偏低</span>';
}

// ===== 数据聚合 =====
function aggregate(rows) {
  const paidRows = rows.filter(r => !r[FM.isOrganic]);
  const newUsers = sum(paidRows.map(r => pn(r[FM.newUsers])));
  const spend = sum(paidRows.map(r => pn(r[FM.spend])));
  const revenue = sum(rows.map(r => pn(r[FM.revenue])));
  const cpa = newUsers > 0 ? spend / newUsers : 0;

  const activeArr = paidRows.map(r => pn(r[FM.activeUsers]));
  const prVals = paidRows.map(r => pp(r[FM.payingRate]));
  const arVals = paidRows.map(r => pn(r[FM.arppu]));
  const payingRate = wavg(prVals, activeArr);
  const arppu = wavg(arVals, activeArr);
  const arpudau = paidRows.length > 0 ? sum(paidRows.map(r => pn(r[FM.arpudau]))) / paidRows.length : null;

  const milestones = {};
  [1,7,14,30,60].forEach(day => {
    const roiF = FM['d'+day+'ROI'], ltvF = FM['d'+day+'LTV'], retF = FM['d'+day+'Ret'];
    const mk = 'hasD' + day;
    const complete = paidRows.filter(r => r[FM.meta] && r[FM.meta][mk]);
    if (complete.length === 0) {
      milestones['roi_d'+day] = null; milestones['ltv_d'+day] = null; milestones['retention_d'+day] = null;
    } else {
      const nuArr = complete.map(r => pn(r[FM.newUsers]));
      const spArr = complete.map(r => pn(r[FM.spend]));
      const roi = aggROI(complete.map(r => pp(r[roiF])), spArr);
      const ltv = wavg(complete.map(r => pn(r[ltvF])), nuArr);
      const ret = wavg(complete.map(r => pp(r[retF])), nuArr);
      // 0值视为数据未跑满，置为null
      milestones['roi_d'+day] = roi !== null && roi > 0 ? roi : null;
      milestones['ltv_d'+day] = ltv !== null && ltv > 0 ? ltv : null;
      milestones['retention_d'+day] = ret !== null && ret > 0 ? ret : null;
    }
  });

  return { newUsers, spend, revenue, cpa, payingRate, arppu, arpudau, ...milestones };
}

function aggregateByField(rows, field) {
  const map = {};
  rows.forEach(r => {
    const key = r[field] || '未知';
    if (!map[key]) map[key] = [];
    map[key].push(r);
  });
  return Object.entries(map).map(([key, rs]) => ({ key, ...aggregate(rs) }));
}

function getWeekRows(rows, wk) {
  return rows.filter(r => {
    const ds = String(r[FM.date] || '').replace(/\\(.*\\)/, '');
    if (!ds) return false;
    const w = getISOWeek(ds);
    return weekKey(w) === wk;
  });
}

// ===== 图表实例 =====
let charts = {};

function destroyCharts() {
  Object.values(charts).forEach(c => { if (c) c.destroy(); });
  charts = {};
}

function makeLineChart(canvasId, labels, datasets) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 11 } } },
        x: { ticks: { font: { size: 11 } } }
      },
      elements: { line: { tension: 0.3 }, point: { radius: 3 } }
    }
  });
}

// ===== 渲染 =====
function render(data, filteredData) {
  destroyCharts();

  // 筛选选项
  const medias = HAS_MEDIA ? [...new Set(data.map(r => r[FM.media]).filter(Boolean))].filter(m => m !== '自然量') : [];
  const apps = [...new Set(data.map(r => r[FM.appName]).filter(Boolean))];
  const countries = HAS_COUNTRY ? [...new Set(data.map(r => r[FM.country]).filter(Boolean))] : [];

  const fMedia = document.getElementById('f-media');
  const fApp = document.getElementById('f-appName');
  const fCountry = document.getElementById('f-country');
  const fWeek = document.getElementById('f-week');

  if (fMedia && fMedia.options.length <= 1) medias.forEach(m => { const o = document.createElement('option'); o.value = m; o.textContent = m; fMedia.appendChild(o); });
  if (fApp.options.length <= 1) apps.forEach(a => { const o = document.createElement('option'); o.value = a; o.textContent = a; fApp.appendChild(o); });
  if (fCountry && fCountry.options.length <= 1) countries.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; fCountry.appendChild(o); });

  // 周列表
  const weeks = {};
  filteredData.forEach(r => {
    const ds = String(r[FM.date] || '').replace(/\\(.*\\)/, '');
    if (!ds) return;
    const w = getISOWeek(ds);
    const wk = weekKey(w);
    if (!weeks[wk]) weeks[wk] = { year: w.year, week: w.week };
  });
  const weekList = Object.entries(weeks).sort((a,b) => a[0] < b[0] ? 1 : -1);
  if (fWeek.options.length === 0) {
    weekList.forEach(([wk]) => { const o = document.createElement('option'); o.value = wk; o.textContent = wk; fWeek.appendChild(o); });
  }
  const selectedWeek = fWeek.value || (weekList.length > 0 ? weekList[0][0] : null);

  // 按周聚合
  const weeklyMap = {};
  filteredData.forEach(r => {
    const ds = String(r[FM.date] || '').replace(/\\(.*\\)/, '');
    if (!ds) return;
    const w = getISOWeek(ds);
    const wk = weekKey(w);
    if (!weeklyMap[wk]) weeklyMap[wk] = [];
    weeklyMap[wk].push(r);
  });
  const weeklyData = Object.entries(weeklyMap)
    .sort((a,b) => a[0] < b[0] ? -1 : 1)
    .map(([wk, rows]) => ({ weekKey: wk, ...aggregate(rows) }));

  // 选中周数据
  const weekRows = getWeekRows(filteredData, selectedWeek);
  const weekAgg = aggregate(weekRows);
  const productData = aggregateByField(weekRows, FM.appName);
  const countryData = HAS_COUNTRY ? aggregateByField(weekRows, FM.country).filter(c => c.spend > 0) : [];

  // 概览卡片
  document.getElementById('summary-cards').innerHTML = [
    { label: '新增用户', value: fmtNum(weekAgg.newUsers) },
    { label: '消耗', value: fmtMoney(weekAgg.spend) },
    { label: '收入', value: fmtMoney(weekAgg.revenue) },
    { label: 'CPA', value: fmtMoney(weekAgg.cpa) },
    { label: 'D1 ROI', value: fmtPct(weekAgg.roi_d1) },
    { label: 'D7 ROI', value: fmtPct(weekAgg.roi_d7) },
    { label: 'D1留存', value: fmtPct(weekAgg.retention_d1) },
    { label: 'D7留存', value: fmtPct(weekAgg.retention_d7) },
  ].map(s => \`<div class="stat-card"><div class="stat-value">\${s.value}</div><div class="stat-label">\${s.label}</div></div>\`).join('');

  // ROI表格
  const roiTable = document.getElementById('roi-table');
  if (roiTable) {
    const hdr = '<tr><th>产品</th><th>新增</th><th>消耗</th><th>收入</th><th>CPA</th><th>D1 ROI</th><th>D7 ROI</th><th>D30 ROI</th><th>D60 ROI</th><th>D1留存</th><th>D7留存</th></tr>';
    const body = productData.map(p => \`<tr>
      <td><strong>\${p.key}</strong></td><td>\${fmtNum(p.newUsers)}</td><td>\${fmtMoney(p.spend)}</td><td>\${fmtMoney(p.revenue)}</td>
      <td>\${fmtMoney(p.cpa)}</td><td>\${fmtPct(p.roi_d1)}</td><td>\${fmtPct(p.roi_d7)}</td><td>\${fmtPct(p.roi_d30)}</td><td>\${fmtPct(p.roi_d60)}</td>
      <td>\${fmtPct(p.retention_d1)}</td><td>\${fmtPct(p.retention_d7)}</td></tr>\`).join('');
    roiTable.innerHTML = '<thead>' + hdr + '</thead><tbody>' + body + '</tbody>';
  }

  // 国家表格
  const countryTable = document.getElementById('country-table');
  if (countryTable) {
    const totalNu = sum(countryData.map(c => c.newUsers));
    const hdr = '<tr><th>国家</th><th>新增</th><th>占比</th><th>消耗</th><th>CPA</th><th>D1 ROI</th><th>D7 ROI</th><th>D30 ROI</th><th>D1留存</th><th>D7留存</th></tr>';
    const body = countryData.sort((a,b) => b.spend - a.spend).map(c => \`<tr>
      <td><strong>\${c.key}</strong></td><td>\${fmtNum(c.newUsers)}</td><td>\${totalNu > 0 ? ((c.newUsers/totalNu)*100).toFixed(1)+'%' : '-'}</td>
      <td>\${fmtMoney(c.spend)}</td><td>\${fmtMoney(c.cpa)}</td>
      <td>\${fmtPct(c.roi_d1)}</td><td>\${fmtPct(c.roi_d7)}</td><td>\${fmtPct(c.roi_d30)}</td>
      <td>\${fmtPct(c.retention_d1)}</td><td>\${fmtPct(c.retention_d7)}</td></tr>\`).join('');
    countryTable.innerHTML = '<thead>' + hdr + '</thead><tbody>' + body + '</tbody>';
  }

  // 图表
  const labels = weeklyData.map(w => w.weekKey);
  const colors = { d1: '#10b981', d7: '#3b82f6', d14: '#8b5cf6', d30: '#f59e0b', d60: '#ec4899' };

  charts.roi = makeLineChart('chart-roi', labels, [
    { label: 'D1 ROI', data: weeklyData.map(w => w.roi_d1 != null ? +(w.roi_d1*100).toFixed(1) : null), borderColor: colors.d1, tension: 0.3 },
    { label: 'D7 ROI', data: weeklyData.map(w => w.roi_d7 != null ? +(w.roi_d7*100).toFixed(1) : null), borderColor: colors.d7 },
    { label: 'D30 ROI', data: weeklyData.map(w => w.roi_d30 != null ? +(w.roi_d30*100).toFixed(1) : null), borderColor: colors.d30 },
    { label: 'D60 ROI', data: weeklyData.map(w => w.roi_d60 != null ? +(w.roi_d60*100).toFixed(1) : null), borderColor: colors.d60 },
  ]);

  charts.ret = makeLineChart('chart-retention', labels, [
    { label: 'D1留存', data: weeklyData.map(w => w.retention_d1 != null ? +(w.retention_d1*100).toFixed(1) : null), borderColor: colors.d1 },
    { label: 'D7留存', data: weeklyData.map(w => w.retention_d7 != null ? +(w.retention_d7*100).toFixed(1) : null), borderColor: colors.d7 },
    { label: 'D30留存', data: weeklyData.map(w => w.retention_d30 != null ? +(w.retention_d30*100).toFixed(1) : null), borderColor: colors.d30 },
    { label: 'D60留存', data: weeklyData.map(w => w.retention_d60 != null ? +(w.retention_d60*100).toFixed(1) : null), borderColor: colors.d60 },
  ]);

  charts.cpa = makeLineChart('chart-cpa', labels, [
    { label: 'CPA ($)', data: weeklyData.map(w => w.cpa != null ? +w.cpa.toFixed(2) : null), borderColor: '#3b82f6', yAxisID: 'y' },
    { label: 'ARPU ($)', data: weeklyData.map(w => w.arpudau != null ? +w.arpudau.toFixed(3) : null), borderColor: '#f59e0b', yAxisID: 'y1' },
  ]);
  if (charts.cpa) {
    charts.cpa.options.scales.y1 = { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } };
    charts.cpa.update();
  }

  charts.ltv = makeLineChart('chart-ltv', labels, [
    { label: 'LTV D1', data: weeklyData.map(w => w.ltv_d1 != null ? +w.ltv_d1.toFixed(2) : null), borderColor: colors.d1 },
    { label: 'LTV D7', data: weeklyData.map(w => w.ltv_d7 != null ? +w.ltv_d7.toFixed(2) : null), borderColor: colors.d7 },
    { label: 'LTV D30', data: weeklyData.map(w => w.ltv_d30 != null ? +w.ltv_d30.toFixed(2) : null), borderColor: colors.d30 },
    { label: 'LTV D60', data: weeklyData.map(w => w.ltv_d60 != null ? +w.ltv_d60.toFixed(2) : null), borderColor: colors.d60 },
  ]);

  charts.mon = makeLineChart('chart-monetization', labels, [
    { label: '付费率 (%)', data: weeklyData.map(w => w.payingRate != null ? +(w.payingRate*100).toFixed(2) : null), borderColor: '#10b981', yAxisID: 'y' },
    { label: 'ARPPU ($)', data: weeklyData.map(w => w.arppu != null ? +w.arppu.toFixed(2) : null), borderColor: '#f59e0b', yAxisID: 'y1' },
  ]);
  if (charts.mon) {
    charts.mon.options.scales.y1 = { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } };
    charts.mon.update();
  }

  // 分析洞察
  renderInsights(weeklyData, weekAgg);

  // ROI预测表格
  renderROIPredictionTable();

  // 付费留存率图表
  renderPaidRetentionChart(weeklyData, labels);
}

function renderInsights(weeklyData, weekAgg) {
  const latest = weeklyData.length > 0 ? weeklyData[weeklyData.length - 1] : null;

  // 工具函数：将分析洞察内容追加到指定容器
  function appendAnalysis(elId, analysis) {
    const el = document.getElementById(elId);
    if (!el || !analysis) return;
    let html = el.innerHTML;
    if (analysis.insights && analysis.insights.length > 0) {
      html += '<h4 style="margin-top:8px">关键发现</h4><ul>' + analysis.insights.map(i => '<li>' + i + '</li>').join('') + '</ul>';
    }
    if (analysis.alerts && analysis.alerts.length > 0) {
      html += '<div style="margin-top:6px;padding:8px;background:#fef3c7;border:1px solid #fcd34d;border-radius:6px"><h4 style="font-size:12px;color:#92400e;margin-bottom:4px">⚠ 预警</h4><ul style="list-style:none;padding:0">' + analysis.alerts.map(a => '<li style="font-size:12px;color:#78350f;padding:1px 0">' + a + '</li>').join('') + '</ul></div>';
    }
    el.innerHTML = html;
  }

  // ROI趋势洞察
  if (latest && document.getElementById('insight-roi')) {
    const lines = [];
    if (latest.roi_d1 != null) lines.push('D1 ROI: ' + (latest.roi_d1*100).toFixed(1) + '% ' + levelTag(latest.roi_d1, 0.01, 0.015, 0.02));
    if (latest.roi_d7 != null) lines.push('D7 ROI: ' + (latest.roi_d7*100).toFixed(1) + '% ' + levelTag(latest.roi_d7, 0.07, 0.08, 0.10));
    if (latest.roi_d30 != null) lines.push('D30 ROI: ' + (latest.roi_d30*100).toFixed(1) + '% ' + levelTag(latest.roi_d30, 0.15, 0.18, 0.25));
    document.getElementById('insight-roi').innerHTML = '<h4>关键指标</h4><ul>' + lines.map(l => '<li>' + l + '</li>').join('') + '</ul>';
    appendAnalysis('insight-roi', ANALYSES?.roiTrend);
    appendAnalysis('insight-roi', ANALYSES?.roiDrivers);
  }

  // 留存洞察
  if (latest && document.getElementById('insight-retention')) {
    const lines = [];
    if (latest.retention_d1 != null) lines.push('D1留存: ' + (latest.retention_d1*100).toFixed(1) + '% ' + levelTag(latest.retention_d1, 0.30, 0.40, 0.50));
    if (latest.retention_d7 != null) lines.push('D7留存: ' + (latest.retention_d7*100).toFixed(1) + '% ' + levelTag(latest.retention_d7, 0.12, 0.18, 0.25));
    document.getElementById('insight-retention').innerHTML = '<h4>关键指标</h4><ul>' + lines.map(l => '<li>' + l + '</li>').join('') + '</ul>';
    appendAnalysis('insight-retention', ANALYSES?.retentionTrend);
  }

  // CPA洞察
  if (latest && document.getElementById('insight-cpa')) {
    document.getElementById('insight-cpa').innerHTML = '<h4>关键指标</h4><ul>'
      + '<li>CPA: ' + fmtMoney(latest.cpa) + '</li>'
      + (latest.arpudau ? '<li>DAU ARPU: ' + fmtMoney(latest.arpudau) + '</li>' : '')
      + '</ul>';
    appendAnalysis('insight-cpa', ANALYSES?.cpaArpu);
  }

  // LTV洞察
  if (latest && document.getElementById('insight-ltv')) {
    const lines = [];
    if (latest.ltv_d1 != null) lines.push('LTV D1: ' + fmtMoney(latest.ltv_d1));
    if (latest.ltv_d7 != null) lines.push('LTV D7: ' + fmtMoney(latest.ltv_d7));
    if (latest.ltv_d30 != null) lines.push('LTV D30: ' + fmtMoney(latest.ltv_d30));
    document.getElementById('insight-ltv').innerHTML = '<h4>关键指标</h4><ul>' + lines.map(l => '<li>' + l + '</li>').join('') + '</ul>';
    appendAnalysis('insight-ltv', ANALYSES?.ltv);
    appendAnalysis('insight-ltv', ANALYSES?.ltvDrivers);
  }

  // 付费洞察
  if (latest && document.getElementById('insight-monetization')) {
    const lines = [];
    if (latest.payingRate != null) lines.push('付费率: ' + (latest.payingRate*100).toFixed(2) + '% ' + levelTag(latest.payingRate, 0.03, 0.06, 0.09));
    if (latest.arppu != null) lines.push('ARPPU: ' + fmtMoney(latest.arppu));
    document.getElementById('insight-monetization').innerHTML = '<h4>关键指标</h4><ul>' + lines.map(l => '<li>' + l + '</li>').join('') + '</ul>';
    appendAnalysis('insight-monetization', ANALYSES?.monetization);
  }

  // ROI表格洞察
  appendAnalysis('insight-roi-table', ANALYSES?.roiTable);

  // 国家分析洞察
  appendAnalysis('insight-country', ANALYSES?.country);
}

// ===== ROI预测表格 =====
function renderROIPredictionTable() {
  const table = document.getElementById('roi-prediction-table');
  if (!table || !ROI_PREDICTIONS || ROI_PREDICTIONS.length === 0) return;
  
  const valid = ROI_PREDICTIONS.filter(p => p.prediction.confidence !== 'none');
  if (valid.length === 0) return;
  
  const confLabel = { actual: '已实测', high: '高', medium: '中', low: '低', multiplier: '倍率', reference: '参考', none: '-' };
  const confColor = { actual: '#374151', high: '#16a34a', medium: '#ca8a04', low: '#ea580c', multiplier: '#4f46e5', reference: '#2563eb', none: '#94a3b8' };
  
  let html = '<thead><tr><th>周</th><th>观测范围</th><th>D30 ROI</th><th>预测 D180</th><th>回本日</th><th>R²</th><th>置信度</th></tr></thead><tbody>';
  
  [...valid].reverse().forEach(p => {
    const obs = p.observations || [];
    const firstDay = obs.length > 0 ? 'D' + obs[0].day : '-';
    const lastDay = obs.length > 0 ? 'D' + obs[obs.length - 1].day : '-';
    const actualD30 = obs.find(o => o.day === 30);
    const d30Val = actualD30 ? (actualD30.roi * 100).toFixed(1) + '%*' : '-';
    const d180 = p.prediction.predictD180 != null ? (p.prediction.predictD180 * 100).toFixed(1) + '%' : '-';
    const d180Color = p.prediction.predictD180 >= 1.5 ? '#16a34a' : p.prediction.predictD180 >= 1.0 ? '#ca8a04' : '#dc2626';
    const breakEven = p.prediction.breakEvenDay ? 'D' + p.prediction.breakEvenDay : '无法回本';
    const r2 = p.prediction.r2 > 0 ? (p.prediction.r2 * 100).toFixed(0) + '%' : '-';
    const conf = confLabel[p.prediction.confidence] || '-';
    const confC = confColor[p.prediction.confidence] || '#94a3b8';
    
    html += '<tr>';
    html += '<td><strong>' + p.weekKey + '</strong></td>';
    html += '<td style="text-align:right">' + firstDay + '~' + lastDay + '</td>';
    html += '<td style="text-align:right">' + d30Val + '</td>';
    html += '<td style="text-align:right;color:' + d180Color + ';font-weight:600">' + d180 + '</td>';
    html += '<td style="text-align:right">' + breakEven + (p.prediction.breakEvenDay ? ' <small style="color:#94a3b8">ROI≥150%</small>' : '') + '</td>';
    html += '<td style="text-align:right;color:#64748b">' + r2 + '</td>';
    html += '<td style="text-align:center"><span style="background:' + confC + '20;color:' + confC + ';padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">' + conf + '</span></td>';
    html += '</tr>';
  });
  
  html += '</tbody>';
  table.innerHTML = html;
  
  const methodDiv = document.getElementById('prediction-method');
  if (methodDiv) {
    methodDiv.innerHTML = '<strong>预测方法说明：</strong>幂律函数 ROI(t) = a × t<sup>β</sup>，对数空间线性回归拟合。使用 D1~D30 每日 ROI + D36 起里程碑数据，单调性异常值剔除。汇集历史所有周数据（以 D30 归一化）拟合全局增长曲线作为外推基准。以当前周最远观测日为锚点，按全局模型曲线等比缩放预估长线 ROI。回本日 = ROI 达到 150%（财务回本线）的预测天数。'
      + '<div style="margin-top:8px"><strong>数据清理规则：</strong>'
      + '① 时间完整性：根据导出日期与数据日期计算可用天数，未跑满的里程碑不参与聚合；'
      + '② ROI 单调性：ROI 为累积收入比，应单调递增，若 D(N) ROI &lt; D(N-1) ROI 视为异常剔除；'
      + '③ 留存单调性：留存率应单调递减，若 D(N) 留存 &gt; D(N-1) 留存视为异常剔除；'
      + '④ 零值过滤：ROI 或留存率为 0/空值视为数据未跑满，对应里程碑剔除；'
      + '⑤ 拟合层二次清洗：提取观测点时再次进行单调性校验，确保拟合数据严格合法。'
      + '</div>';
  }
}

// ===== 付费留存率图表 =====
function renderPaidRetentionChart(weeklyData, labels) {
  const ctx = document.getElementById('chart-paid-retention');
  if (!ctx) return;
  
  charts.paidRet = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'D1留存', data: weeklyData.map(w => w.retention_d1 != null ? +(w.retention_d1*100).toFixed(1) : null), borderColor: '#10b981', tension: 0.3 },
        { label: 'D7留存', data: weeklyData.map(w => w.retention_d7 != null ? +(w.retention_d7*100).toFixed(1) : null), borderColor: '#3b82f6' },
        { label: 'D30留存', data: weeklyData.map(w => w.retention_d30 != null ? +(w.retention_d30*100).toFixed(1) : null), borderColor: '#f59e0b' },
        { label: 'D60留存', data: weeklyData.map(w => w.retention_d60 != null ? +(w.retention_d60*100).toFixed(1) : null), borderColor: '#ec4899' },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 11 }, callback: v => v + '%' } },
        x: { ticks: { font: { size: 11 } } }
      },
      elements: { line: { tension: 0.3 }, point: { radius: 3 } }
    }
  });
  
  const insightDiv = document.getElementById('insight-paid-retention');
  if (insightDiv && weeklyData.length > 0) {
    const latest = weeklyData[weeklyData.length - 1];
    let html = '<h4>关键指标</h4><ul>';
    if (latest.retention_d1 != null) html += '<li>D1留存: ' + (latest.retention_d1*100).toFixed(1) + '%</li>';
    if (latest.retention_d7 != null) html += '<li>D7留存: ' + (latest.retention_d7*100).toFixed(1) + '%</li>';
    if (latest.retention_d30 != null) html += '<li>D30留存: ' + (latest.retention_d30*100).toFixed(1) + '%</li>';
    if (latest.retention_d60 != null) html += '<li>D60留存: ' + (latest.retention_d60*100).toFixed(1) + '%</li>';
    html += '</ul>';
    insightDiv.innerHTML = html;
  }
}

function levelTag(v, min, good, excellent) {
  if (v == null) return '';
  if (v >= excellent) return '<span class="tag tag-green">优秀</span>';
  if (v >= good) return '<span class="tag tag-blue">良好</span>';
  if (v >= min) return '<span class="tag tag-yellow">一般</span>';
  return '<span class="tag tag-red">偏低</span>';
}

// ===== 筛选 =====
function applyFilters() {
  const media = document.getElementById('f-media')?.value || '全部';
  const appName = document.getElementById('f-appName')?.value || '全部';
  const country = document.getElementById('f-country')?.value || '全部';

  const filtered = RAW_DATA.filter(r => {
    if (HAS_MEDIA && media !== '全部' && r[FM.media] !== media) return false;
    if (appName !== '全部' && r[FM.appName] !== appName) return false;
    if (HAS_COUNTRY && country !== '全部' && r[FM.country] !== country) return false;
    return true;
  });

  render(RAW_DATA, filtered);
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  const filtered = RAW_DATA.filter(r => !r[FM.isOrganic] || true); // 显示全部（含自然量收入）
  render(RAW_DATA, filtered);
});
<\/script>
</body>
</html>`;
}
