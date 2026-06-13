// @AI_GENERATED
/* ============================================================
 * 通用 UI 工具：tooltip、toast、图标、转义
 * ============================================================ */

const UI = (function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 简易内联图标
  const icons = {
    bolt: '⚡',
    warn: '⚠',
    wind: '🌀',
    heat: '热力图',
    line: '折线图',
    swap: '换人',
    bell: '!',
    check: '✓',
  };

  // ---------- Tooltip ----------
  const ttEl = () => document.getElementById('tooltip');
  function showTooltip(html, x, y) {
    const el = ttEl();
    el.innerHTML = html;
    el.classList.add('show');
    // 定位，避免溢出
    const pad = 14;
    const w = el.offsetWidth, h = el.offsetHeight;
    let left = x + 16, top = y + 16;
    if (left + w + pad > window.innerWidth) left = x - w - 16;
    if (top + h + pad > window.innerHeight) top = y - h - 16;
    el.style.left = Math.max(pad, left) + 'px';
    el.style.top = Math.max(pad, top) + 'px';
  }
  function hideTooltip() { ttEl().classList.remove('show'); }

  // 给元素绑定 tooltip（html 由函数动态生成）
  function bindTooltip(el, htmlFn) {
    el.addEventListener('mousemove', (e) => showTooltip(htmlFn(), e.clientX, e.clientY));
    el.addEventListener('mouseleave', hideTooltip);
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // 工单 hover 详情 HTML（任务列表 / 看板共用）
  function woTooltipHtml(wo, opts) {
    opts = opts || {};
    const person = wo.handler ? DATA.personById(wo.handler) : null;
    const rows = [];
    rows.push(['设备', `${wo.device} ${wo.model}`]);
    rows.push(['工单名称', wo.name]);
    if (opts.scheduled && wo.scheduled) {
      rows.push(['已排程时间', `${wo.schedDate} ${wo.schedStart}-${wo.schedEnd}`]);
    } else {
      rows.push(['预计工时', `${wo.estStart}-${wo.estEnd} (${wo.estHours}h)`]);
      rows.push(['工单编号', wo.id]);
      rows.push(['工单日期', wo.date]);
    }
    rows.push(['处理人', person ? person.name : '未分配']);
    rows.push(['处理人组别', person ? person.group : '—']);
    let html = `<div class="tt-title">${esc(wo.name)}</div>`;
    html += rows.map(([k, v]) =>
      `<div class="tt-row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('');
    html += `<div class="tt-row"><span class="k">损失收益</span><span class="v y">${esc(wo.loss)}</span></div>`;
    // 动态匹配限电/输变电停运事件
    const woDate = wo.schedDate || wo.date;
    const woFarm = wo.farm;
    const farmEvents = DATA.farmCurtail[woFarm] || {};
    const evt = farmEvents[woDate];
    let curtailText = '';
    if (evt && evt.tag === '限电') {
      curtailText = `原因：电网调度限电指令；时间：${woDate} ${evt.time || ''}`;
    } else if (evt && (evt.tag === '建议停机' || evt.title.includes('输变电'))) {
      curtailText = `原因：${evt.title}；时间：${woDate} ${evt.time || evt.sub || ''}`;
    } else {
      curtailText = '无限电/输变电停运事件';
    }
    html += `<div class="tt-row"><span class="k">限电/输变电</span><span class="v g">${esc(curtailText)}</span></div>`;
    html += `<div class="tt-row"><span class="k">工作窗口建议</span><span class="v">${esc(wo.workWindow)}</span></div>`;
    if (wo.hasReminder) {
      html += `<div class="tt-row"><span class="k">提醒</span><span class="v r">${esc(wo.reminderReason)}</span></div>`;
    }
    return html;
  }

  return { esc, icons, showTooltip, hideTooltip, bindTooltip, toast, woTooltipHtml };
})();
// @AI_GENERATED: end
