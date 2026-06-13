// @AI_GENERATED
/* ============================================================
 * 人员排程看板：周视图 / 日视图 / 换人 / 拖动换人
 * ============================================================ */

const PersonBoard = (function () {
  function ordersOf(personId, date) {
    return visibleWorkorders().filter(
      (w) => w.scheduled && w.handler === personId && w.schedDate === date
    );
  }

  function durHours(wo) {
    // 用排程时间计算时长，缺省用预计工时
    if (wo.schedStart && wo.schedEnd) {
      const a = +wo.schedStart.split(':')[0], b = +wo.schedEnd.split(':')[0];
      if (b > a) return b - a;
    }
    return wo.estHours || 0;
  }

  function dayStats(personId, date) {
    const list = ordersOf(personId, date);
    const hours = list.reduce((s, w) => s + durHours(w), 0);
    const fans = new Set(list.map((w) => w.device)).size;
    return { count: list.length, fans, hours, list };
  }

  // 连续三天 > 6h 检测
  function threeDayOverload(personId) {
    const dates = currentWeekDates().map((d) => d.date);
    let streak = 0;
    for (const d of dates) {
      if (dayStats(personId, d).hours > 6) { streak++; if (streak >= 3) return true; }
      else streak = 0;
    }
    return false;
  }

  function barCls(hours) {
    if (hours >= 9) return 'over';
    if (hours >= 6) return 'full';
    return 'ok';
  }

  // ---------- 单元格 ----------
  function cellHtml(personId, date) {
    const st = dayStats(personId, date);
    const pct = Math.min(100, (st.hours / 9) * 100);
    const alerts = [];
    if (st.hours > 9) alerts.push('当天工时超 9 小时');
    if (st.count > 3) alerts.push('当天工单超 3 个');

    let html = `<div class="cell" data-pcell="${personId}|${date}">`;
    html += `<div class="person-cell-top">
      <div class="pc-stats"><span>工单 <b>${st.count}</b></span><span>风机 <b>${st.fans}</b></span><span>工时 <b>${st.hours}h</b></span></div>
      <div class="progress"><div class="bar ${barCls(st.hours)}" style="width:${pct}%"></div></div>
    </div>`;
    alerts.forEach((a) => html += `<div class="pc-alert">${UI.icons.warn} ${UI.esc(a)}</div>`);
    st.list.forEach((wo) => {
      const person = DATA.personById(personId);
      html += `<div class="sched-card urgency-${wo.urgency}" draggable="true" data-pwo="${wo.id}">
        ${wo.hasReminder ? `<div class="sc-flag" data-pscflag="${wo.id}">${UI.icons.bell}</div>` : ''}
        <div class="sc-dev">${UI.esc(wo.device)} ${UI.esc(wo.model)}</div>
        <div class="sc-time">${UI.esc(wo.schedStart)} - ${UI.esc(wo.schedEnd)}</div>
        <div class="sc-name">${UI.esc(wo.name)}</div>
        <button class="btn-swap" data-swap="${wo.id}">${UI.icons.swap}</button>
      </div>`;
    });
    html += `</div>`;
    return html;
  }

  function personLabelHtml(p) {
    const over3 = threeDayOverload(p.id);
    return `<div class="col-label person-label" data-prow="${p.id}">
      <div class="name">${UI.esc(p.name)}</div>
      <div class="group">${UI.esc(p.group)}</div>
      ${over3 ? `<div class="person-reminder" data-prem="${p.id}">${UI.icons.warn} 连续三天工时超 6h</div>` : ''}
    </div>`;
  }

  function renderWeek() {
    const dates = currentWeekDates();
    const persons = visiblePersons();
    const cols = `150px repeat(${dates.length}, minmax(160px,1fr))`;
    let html = `<div class="grid" style="grid-template-columns:${cols}">`;
    html += `<div class="head-corner">人员 \\ 日期</div>`;
    dates.forEach((d) => html += `<div class="head-cell" data-pdayhead="${d.date}" title="点击进入日视图">
      <span class="date">${d.date}</span><span class="wd">${d.weekday}</span></div>`);
    persons.forEach((p) => {
      html += personLabelHtml(p);
      dates.forEach((d) => html += cellHtml(p.id, d.date));
    });
    html += `</div>`;
    return html;
  }

  function renderDay() {
    const persons = visiblePersons();
    const date = STATE.currentDate;
    const hours = []; for (let h = 6; h <= 18; h++) hours.push(h);
    const cols = `150px repeat(${hours.length}, minmax(46px,1fr))`;
    let html = `<div class="grid" style="grid-template-columns:${cols}">`;
    html += `<div class="head-corner">人员 \\ 时刻</div>`;
    hours.forEach((h) => html += `<div class="head-cell"><span class="date">${h}:00</span></div>`);
    persons.forEach((p) => {
      html += `<div class="col-label person-label"><div class="name">${UI.esc(p.name)}</div><div class="group">${UI.esc(p.group)}</div></div>`;
      const list = ordersOf(p.id, date);
      const occ = {}; // hour -> wo
      list.forEach((wo) => {
        const a = +wo.schedStart.split(':')[0], b = +wo.schedEnd.split(':')[0];
        for (let h = a; h < b; h++) occ[h] = wo;
      });
      hours.forEach((h) => {
        const wo = occ[h];
        if (wo) {
          html += `<div class="cell" data-pdaycell="${p.id}|${h}" style="min-height:48px;background:rgba(52,199,89,.25);border-left:2px solid var(--green)">
            <div style="font-size:9px;color:var(--text)">${UI.esc(wo.device)}</div></div>`;
        } else {
          html += `<div class="cell" data-pdaycell="${p.id}|${h}" style="min-height:48px"></div>`;
        }
      });
    });
    html += `</div>`;
    return html;
  }

  function render() {
    const el = document.getElementById('board');
    const badge = visibleWorkorders().filter((w) => w.scheduled).length;
    const head = STATE.granularity === 'week' ? weekHead(badge) : dayHead();
    const body = STATE.granularity === 'week' ? renderWeek() : renderDay();
    el.innerHTML = `${head}<div class="board-scroll">${body}</div>`;
    bind();
  }

  function weekHead(badge) {
    return `<div class="board-head">
      <span class="ttl">📊 排程看板</span><span class="badge">${badge}</span>
      <div class="wk-nav">
        <button class="arrow" data-wk="prev">‹</button>
        <button class="wk-btn ${STATE.week === 'current' ? 'active' : ''}" data-wk="current">本周</button>
        <button class="wk-btn ${STATE.week === 'next' ? 'active' : ''}" data-wk="next">下周</button>
        <button class="arrow" data-wk="nextarrow">›</button>
      </div>
      <span class="right">人员视图 · 每人每天 ≤3 工单 / ≤9 小时</span>
    </div>`;
  }
  function dayHead() {
    return `<div class="board-head">
      <button class="wk-btn" data-back="1">‹ 返回周视图</button>
      <div class="wk-nav">
        <button class="arrow" data-day="prev">‹</button>
        <span class="ttl">2026-${STATE.currentDate}</span>
        <button class="arrow" data-day="next">›</button>
      </div>
      <span class="right">人员日视图 · 24h 排程</span>
    </div>`;
  }

  function bind() {
    document.querySelectorAll('[data-wk]').forEach((b) => b.onclick = () => {
      const v = b.dataset.wk;
      if (v === 'current' || v === 'next') STATE.week = v;
      else if (v === 'prev') STATE.week = 'current';
      else if (v === 'nextarrow') STATE.week = 'next';
      BUS.emit();
    });
    document.querySelectorAll('[data-pdayhead]').forEach((h) => h.onclick = () => {
      STATE.currentDate = h.dataset.pdayhead; STATE.granularity = 'day'; BUS.emit();
    });
    const back = document.querySelector('[data-back]');
    if (back) back.onclick = () => { STATE.granularity = 'week'; BUS.emit(); };
    document.querySelectorAll('[data-day]').forEach((b) => b.onclick = () => {
      const dates = currentWeekDates().map((d) => d.date);
      let i = dates.indexOf(STATE.currentDate);
      i += b.dataset.day === 'next' ? 1 : -1;
      if (i < 0) i = 0; if (i >= dates.length) i = dates.length - 1;
      STATE.currentDate = dates[i]; BUS.emit();
    });

    // 工单 hover + 换人按钮 + 拖动换人
    document.querySelectorAll('[data-pwo]').forEach((card) => {
      const wo = DATA.woById(card.dataset.pwo);
      UI.bindTooltip(card, () => UI.woTooltipHtml(wo, { scheduled: true }));
      card.addEventListener('dragstart', (e) => { STATE.draggingWoId = wo.id; e.dataTransfer.setData('text/plain', wo.id); showSwapHints(); });
      card.addEventListener('dragend', clearSwapHints);
      const flag = card.querySelector('[data-pscflag]');
      if (flag) UI.bindTooltip(flag, () => `<div class="tt-title">⚠ 提醒</div>
        <div class="tt-row"><span class="v r">${UI.esc(wo.reminderReason)}</span></div>`);
    });
    document.querySelectorAll('[data-swap]').forEach((b) => b.onclick = (e) => {
      e.stopPropagation();
      Modals.openSwap(DATA.woById(b.dataset.swap));
    });
    document.querySelectorAll('[data-prem]').forEach((r) => {
      UI.bindTooltip(r, () => `<div class="tt-title">⚠ 人员提醒</div>
        <div class="tt-row"><span class="v r">该人员连续三天工作时长超过 6 小时，请关注工作负荷</span></div>`);
    });

    bindSwapDrop();
  }

  // 拖动换人（仅支持竖直方向 = 同一日期列换人）
  function bindSwapDrop() {
    document.querySelectorAll('[data-pcell],[data-pdaycell]').forEach((cell) => {
      cell.addEventListener('dragover', (e) => {
        if (!STATE.draggingWoId) return;
        const wo = DATA.woById(STATE.draggingWoId);
        if (!wo) return;
        const key = cell.dataset.pcell || cell.dataset.pdaycell;
        const [targetPerson, targetDate] = key.split('|');
        const woDate = wo.schedDate;

        e.preventDefault();
        // 判断是否同一日期（竖直方向）
        if (targetDate !== woDate) {
          cell.classList.add('drop-forbid');
          cell.classList.remove('drop-ok');
        } else if (targetPerson === wo.handler) {
          // 拖回自己
          cell.classList.remove('drop-ok', 'drop-forbid');
        } else {
          // 同日期不同人员：根据资质/工时判断
          const chk = Modals.canHandle(targetPerson, wo);
          if (chk.ok) {
            cell.classList.add('drop-ok');
            cell.classList.remove('drop-forbid');
          } else {
            cell.classList.add('drop-forbid');
            cell.classList.remove('drop-ok');
          }
        }
      });
      cell.addEventListener('dragleave', () => cell.classList.remove('drop-ok', 'drop-forbid'));
      cell.addEventListener('drop', (e) => {
        e.preventDefault();
        cell.classList.remove('drop-ok', 'drop-forbid');
        const wo = DATA.woById(STATE.draggingWoId);
        if (!wo) return;
        const key = cell.dataset.pcell || cell.dataset.pdaycell;
        const [targetPerson, targetDate] = key.split('|');
        // 不同日期 → 弹窗提示
        if (targetDate !== wo.schedDate) {
          UI.toast('人员视图仅支持换人操作，如需调整日期请切换到设备视图');
          return;
        }
        if (targetPerson === wo.handler) return;
        Modals.confirmSwap(wo, targetPerson, true);
      });
    });
  }
  function showSwapHints() {
    const wo = DATA.woById(STATE.draggingWoId);
    if (!wo) return;
    document.querySelectorAll('[data-prow]').forEach((r) => {
      const pid = r.dataset.prow;
      if (pid === wo.handler) return; // 不给自己加提示
      const ok = Modals.canHandle(pid, wo);
      const tip = document.createElement('div');
      tip.className = 'person-reminder';
      tip.style.color = ok.ok ? 'var(--green)' : 'var(--red)';
      tip.style.borderTopColor = ok.ok ? 'var(--green-line)' : 'var(--red-line)';
      tip.dataset.hinttip = '1';
      tip.textContent = ok.ok ? '✓ 允许排程：资质匹配且工时正常' : '✗ 禁止排程：' + ok.reason;
      r.appendChild(tip);
    });
  }
  function clearSwapHints() {
    document.querySelectorAll('[data-hinttip]').forEach((t) => t.remove());
    document.querySelectorAll('.cell').forEach((c) => c.classList.remove('drop-ok'));
  }

  function focusWorkorder(wo) {
    setTimeout(() => {
      const row = document.querySelector(`[data-prow="${wo.handler}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.style.outline = '2px solid var(--green)';
        setTimeout(() => row.style.outline = '', 1500);
      }
    }, 60);
  }

  return { render, focusWorkorder, dayStats };
})();
// @AI_GENERATED: end
