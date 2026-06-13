// @AI_GENERATED
/* ============================================================
 * 设备排程看板：周视图 / 日视图 / 热力图 / 折线图 / 拖拽
 * ============================================================ */

const DeviceBoard = (function () {
  // 取某设备某天已排程工单
  function cardsOf(devId, date) {
    return visibleWorkorders().filter(
      (w) => w.scheduled && w.device === devId && w.schedDate === date
    );
  }

  // 单个时段类型
  function slotCls(devId, date, slotId) {
    return DATA.slotType(devId, date, slotId);
  }

  // ---------- 看板内工单卡片 ----------
  function schedCardHtml(wo) {
    const person = wo.handler ? DATA.personById(wo.handler) : null;
    return `
      <div class="sched-card urgency-${wo.urgency}" draggable="true" data-sched="${wo.id}">
        ${wo.hasReminder ? `<div class="sc-flag" data-scflag="${wo.id}">${UI.icons.bell}</div>` : ''}
        <div class="sc-dev">${UI.esc(wo.device)} ${UI.esc(wo.model)}</div>
        <div class="sc-name">${UI.esc(wo.name)}</div>
        <div class="sc-time">${UI.esc(wo.schedStart)} - ${UI.esc(wo.schedEnd)}</div>
        <div class="sc-labor">Labor: ${UI.esc(person ? person.name : '未分配')}</div>
        ${wo.recommend.includes('限电') || wo.recommend.includes('接收')
          ? `<div class="sc-extra">${UI.icons.bolt} ${UI.esc(wo.recommend.slice(0, 12))}</div>` : ''}
      </div>`;
  }

  // ---------- 单元格 ----------
  function cellHtml(devId, date) {
    const banner = (DATA.deviceBanners[devId] || {})[date];
    const weather = DATA.weatherForbid(devId, date);
    const cards = cardsOf(devId, date);
    let bannerHtml = '';
    if (banner) {
      if (banner.type === 'gale') {
        bannerHtml = `<div class="banner gale">${UI.icons.warn} ${UI.esc(banner.text)}
          <span class="b-time">${UI.esc(banner.time)}</span></div>`;
      } else {
        bannerHtml = `<div class="banner curtail">${UI.icons.bolt} ${UI.esc(banner.text)}
          <span class="b-tag">${UI.esc(banner.tag)}</span>
          <span class="b-time">${UI.esc(banner.time)}</span></div>`;
      }
    }
    const slots = DATA.slotDefs.map((s) =>
      `<div class="slot ${slotCls(devId, date, s.id)}" data-slot="${devId}|${date}|${s.id}">${s.label}</div>`
    ).join('');

    return `
      <div class="cell" data-cell="${devId}|${date}">
        ${bannerHtml}
        ${weather ? `<div class="cell-weather">${UI.icons.warn} ${UI.esc(weather)}</div>` : ''}
        <div class="slots">${slots}</div>
        ${cards.map(schedCardHtml).join('')}
        <div class="drop-hint">
          <div class="dh-row g">建议窗口：绿色时段优先</div>
          <div class="dh-row">限电/输变电推荐排入</div>
          <div class="dh-row r">红色为禁排时段</div>
        </div>
      </div>`;
  }

  // ---------- 设备标签列 ----------
  function devLabelHtml(dev) {
    const chart = STATE.expandedChart[dev.id];
    // 设备行提醒（聚合该设备带提醒工单）
    const rem = visibleWorkorders().filter((w) => w.device === dev.id && w.hasReminder);
    return `
      <div class="col-label dev-label" data-devrow="${dev.id}">
        <div class="name">${UI.esc(dev.name)} ${UI.esc(dev.model)}</div>
        <div class="model">${UI.esc(DATA.farmById(dev.farm).name)}</div>
        <div class="chart-btns">
          <button data-heat="${dev.id}" class="${chart === 'heat' ? 'active' : ''}">热力图</button>
          <button data-line="${dev.id}" class="${chart === 'line' ? 'active' : ''}">折线图</button>
        </div>
        ${rem.length ? `<div class="dev-reminder" data-devrem="${dev.id}">${UI.icons.warn} ${UI.esc(rem[0].reminderType === 'conflict' ? '存在人员互斥/时空冲突' : '存在禁排提醒')}</div>` : ''}
      </div>`;
  }

  // ---------- 周视图 ----------
  function renderWeek() {
    const dates = currentWeekDates();
    const devs = visibleDevices();
    const cols = `150px repeat(${dates.length}, minmax(155px, 1fr))`;

    let html = `<div class="grid" style="grid-template-columns:${cols}">`;
    // 表头
    html += `<div class="head-corner">设备 \\ 日期</div>`;
    dates.forEach((d) => {
      html += `<div class="head-cell" data-dayhead="${d.date}" title="点击进入日视图">
        <span class="date">${d.date}</span><span class="wd">${d.weekday}</span>
      </div>`;
    });

    // 按风场分组，每个风场先渲染首行再渲染设备行
    const farmsInView = STATE.selectedFarms.length ? STATE.selectedFarms : DATA.farms.map((f) => f.id);
    farmsInView.forEach((farmId) => {
      const farm = DATA.farmById(farmId);
      const farmDevs = devs.filter((d) => d.farm === farmId);
      if (!farmDevs.length) return;

      // 风场首行
      html += `<div class="col-label farm-power">
        <span>🌬 ${UI.esc(farm.name)}</span><span class="pw">${UI.esc(farm.power)}</span>
      </div>`;
      dates.forEach((d) => {
        const cur = (DATA.farmCurtail[farm.id] || {})[d.date];
        if (cur) {
          const cls = cur.tag === '限电' ? 'limit' : '';
          const timeHtml = cur.time ? `<div class="c-sub">${UI.esc(cur.time)}</div>` : '';
          html += `<div class="cell"><div class="curtail-card ${cls}">
            <span class="c-tag">${UI.esc(cur.tag)}</span>${UI.esc(cur.title)}
            <div class="c-sub">${UI.esc(cur.sub)}</div>${timeHtml}</div></div>`;
        } else {
          html += `<div class="cell"></div>`;
        }
      });

      // 该风场下的设备行
      farmDevs.forEach((dev) => {
        html += devLabelHtml(dev);
        dates.forEach((d) => { html += cellHtml(dev.id, d.date); });
        // 图表展开行：每个日期各自展示热力图或折线图
        const chart = STATE.expandedChart[dev.id];
        if (chart) {
          html += `<div class="col-label chart-label-col"><span style="font-size:11px;color:var(--text-dim)">${chart === 'heat' ? '热力图' : '折线图'} · ${UI.esc(dev.name)}</span></div>`;
          dates.forEach((d) => {
            html += `<div class="cell chart-cell-day" data-chartcell="${dev.id}|${d.date}|${chart}"></div>`;
          });
        }
      });
    });

    html += `</div>`;
    return html;
  }

  // ---------- 日视图 ----------
  function renderDay() {
    const devs = visibleDevices();
    const date = STATE.currentDate;
    const hours = [];
    for (let h = 6; h <= 18; h++) hours.push(h);
    const cols = `150px repeat(${hours.length}, minmax(46px,1fr))`;

    let html = `<div class="grid" style="grid-template-columns:${cols}">`;
    html += `<div class="head-corner">设备 \\ 时刻</div>`;
    hours.forEach((h) => html += `<div class="head-cell"><span class="date">${h}:00</span></div>`);

    devs.forEach((dev) => {
      html += `<div class="col-label dev-label"><div class="name">${UI.esc(dev.name)} ${UI.esc(dev.model)}</div>
        <div class="model">${UI.esc(DATA.farmById(dev.farm).name)}</div></div>`;
      const losses = DATA.hourlyLoss(dev.id, date);
      const lossByHour = {};
      losses.forEach((l) => lossByHour[l.hour] = l);
      // 获取该日最大损失，用于计算颜色深浅
      const maxLoss = Math.max(...losses.map((l) => l.loss));
      hours.forEach((h) => {
        const l = lossByHour[h];
        // 颜色由该小时所属时段的类型决定（同一风场同时段颜色一致）
        const slotId = h < 9 ? 's1' : h < 12 ? 's2' : h < 15 ? 's3' : 's4';
        const type = slotCls(dev.id, date, slotId);
        const base = type === 'suggest' ? '52,199,89' : type === 'extend' ? '255,176,46' : '255,69,58';
        // 颜色越深代表损失收益越小，推荐排程
        const alpha = (0.2 + (1 - l.loss / maxLoss) * 0.6).toFixed(2);
        html += `<div class="cell" data-daycell="${dev.id}|${h}" style="min-height:48px;background:rgba(${base},${alpha})"
          data-loss="${l.loss}" data-power="${l.power}" data-price="${l.price}" data-label="${UI.esc(l.label)}" data-type="${type}">
          <div style="font-size:10px;color:#fff;text-align:center;">¥${l.loss}</div>
        </div>`;
      });
    });
    html += `</div>`;
    return html;
  }

  // ---------- 主渲染 ----------
  function render() {
    const el = document.getElementById('board');
    const badge = visibleWorkorders().filter((w) => w.scheduled).length;
    const head = STATE.granularity === 'week' ? weekHead(badge) : dayHead();
    const body = STATE.granularity === 'week' ? renderWeek() : renderDay();
    el.innerHTML = `${head}<div class="board-scroll" id="boardScroll">${body}</div>`;
    bind();
    // 渲染图表（每个日期独立）
    if (STATE.granularity === 'week') {
      Object.keys(STATE.expandedChart).forEach((devId) => {
        const type = STATE.expandedChart[devId];
        if (type) {
          const dates = currentWeekDates();
          dates.forEach((d) => {
            Charts.renderCell(devId, d.date, type);
          });
        }
      });
    }
  }

  function weekHead(badge) {
    return `
      <div class="board-head">
        <span class="ttl">📊 排程看板</span><span class="badge">${badge}</span>
        <div class="wk-nav">
          <button class="arrow" data-wk="prev">‹</button>
          <button class="wk-btn ${STATE.week === 'current' ? 'active' : ''}" data-wk="current">本周</button>
          <button class="wk-btn ${STATE.week === 'next' ? 'active' : ''}" data-wk="next">下周</button>
          <button class="arrow" data-wk="nextarrow">›</button>
        </div>
        <span class="right">设备视图 · 点击表头日期进入日视图</span>
      </div>`;
  }
  function dayHead() {
    return `
      <div class="board-head">
        <button class="wk-btn" data-back="1">‹ 返回周视图</button>
        <div class="wk-nav">
          <button class="arrow" data-day="prev">‹</button>
          <span class="ttl">2026-${STATE.currentDate}</span>
          <button class="arrow" data-day="next">›</button>
        </div>
        <span class="right">设备日视图 · 24h 排程（颜色越深收益损失越小）</span>
      </div>`;
  }

  function bind() {
    // 周/日切换
    document.querySelectorAll('[data-wk]').forEach((b) => b.onclick = () => {
      const v = b.dataset.wk;
      if (v === 'current' || v === 'next') STATE.week = v;
      else if (v === 'prev') STATE.week = 'current';
      else if (v === 'nextarrow') STATE.week = 'next';
      BUS.emit();
    });
    // 进入日视图
    document.querySelectorAll('[data-dayhead]').forEach((h) => h.onclick = () => {
      STATE.currentDate = h.dataset.dayhead;
      STATE.granularity = 'day';
      BUS.emit();
    });
    // 日视图导航
    const back = document.querySelector('[data-back]');
    if (back) back.onclick = () => { STATE.granularity = 'week'; BUS.emit(); };
    document.querySelectorAll('[data-day]').forEach((b) => b.onclick = () => {
      const dates = currentWeekDates().map((d) => d.date);
      let i = dates.indexOf(STATE.currentDate);
      i += b.dataset.day === 'next' ? 1 : -1;
      if (i < 0) i = 0; if (i >= dates.length) i = dates.length - 1;
      STATE.currentDate = dates[i];
      BUS.emit();
    });

    // 图表按钮
    document.querySelectorAll('[data-heat]').forEach((b) => b.onclick = () => toggleChart(b.dataset.heat, 'heat'));
    document.querySelectorAll('[data-line]').forEach((b) => b.onclick = () => toggleChart(b.dataset.line, 'line'));

    // 时段 hover
    document.querySelectorAll('.slot[data-slot]').forEach((s) => {
      const [devId, date, slotId] = s.dataset.slot.split('|');
      const def = DATA.slotDefs.find((x) => x.id === slotId);
      const type = slotCls(devId, date, slotId);
      const typeText = type === 'suggest' ? '建议时段' : type === 'extend' ? '拓展时段' : '禁排时段';
      const cls = type === 'suggest' ? 'g' : type === 'extend' ? 'y' : 'r';
      UI.bindTooltip(s, () => `<div class="tt-title">${devId} · ${date}</div>
        <div class="tt-row"><span class="k">时段</span><span class="v">${def.label} (${def.start}:00-${def.end}:00)</span></div>
        <div class="tt-row"><span class="k">类型</span><span class="v ${cls}">${typeText}</span></div>
        <div class="tt-row"><span class="k">建议</span><span class="v">${type === 'forbid' ? '气象/限电禁排，谨慎排程' : '可排程，参考损失收益'}</span></div>`);
    });

    // 看板工单卡片 hover + 拖动
    document.querySelectorAll('.sched-card[data-sched]').forEach((card) => {
      const wo = DATA.woById(card.dataset.sched);
      UI.bindTooltip(card, () => UI.woTooltipHtml(wo, { scheduled: true }));
      const flag = card.querySelector('[data-scflag]');
      if (flag) UI.bindTooltip(flag, () => `<div class="tt-title">⚠ 排程提醒</div>
        <div class="tt-row"><span class="v r">${UI.esc(wo.reminderReason)}</span></div>`);
      // 看板内拖动调整
      card.addEventListener('dragstart', (e) => {
        STATE.draggingWoId = wo.id;
        e.dataTransfer.setData('text/plain', wo.id);
        showDropHints();
      });
      card.addEventListener('dragend', clearDropHints);
    });

    // 设备行提醒 hover
    document.querySelectorAll('[data-devrem]').forEach((r) => {
      const rem = visibleWorkorders().find((w) => w.device === r.dataset.devrem && w.hasReminder);
      UI.bindTooltip(r, () => `<div class="tt-title">⚠ 设备行提醒</div>
        <div class="tt-row"><span class="v r">${UI.esc(rem.reminderReason)}</span></div>`);
    });

    // 日视图小时格 hover
    document.querySelectorAll('[data-daycell]').forEach((c) => {
      const typeText = c.dataset.type === 'suggest' ? '建议时段' : c.dataset.type === 'extend' ? '拓展时段' : '禁排阶段';
      UI.bindTooltip(c, () => `<div class="tt-title">小时损失收益</div>
        <div class="tt-row"><span class="k">时段</span><span class="v">${UI.esc(c.dataset.label)}</span></div>
        <div class="tt-row"><span class="k">预测电量</span><span class="v">${UI.esc(c.dataset.power)} MW</span></div>
        <div class="tt-row"><span class="k">电价</span><span class="v">${UI.esc(c.dataset.price)} 元/kWh</span></div>
        <div class="tt-row"><span class="k">损失收益</span><span class="v y">¥${UI.esc(c.dataset.loss)}</span></div>
        <div class="tt-row"><span class="k">类型</span><span class="v">${typeText}</span></div>`);
    });

    bindDrop();
  }

  function toggleChart(devId, type) {
    STATE.expandedChart[devId] = STATE.expandedChart[devId] === type ? null : type;
    BUS.emit();
  }

  // ---------- 拖拽放置 ----------
  function bindDrop() {
    document.querySelectorAll('.cell[data-cell]').forEach((cell) => {
      cell.addEventListener('dragover', (e) => {
        if (!STATE.draggingWoId) return;
        const wo = DATA.woById(STATE.draggingWoId);
        const [devId] = cell.dataset.cell.split('|');
        e.preventDefault();
        // 仅允许拖到对应设备行
        if (wo.device !== devId) { cell.classList.add('drop-forbid'); return; }
        cell.classList.add('drop-ok');
      });
      cell.addEventListener('dragleave', () => cell.classList.remove('drop-ok', 'drop-forbid'));
      cell.addEventListener('drop', (e) => {
        e.preventDefault();
        cell.classList.remove('drop-ok', 'drop-forbid');
        const wo = DATA.woById(STATE.draggingWoId);
        if (!wo) return;
        const [devId, date] = cell.dataset.cell.split('|');
        if (wo.device !== devId) {
          UI.toast(`仅能将「${wo.name}」拖拽到对应设备行 ${wo.device}`);
          return;
        }
        Modals.openDropConfirm(wo, devId, date);
      });
    });
  }

  function showDropHints() {
    if (STATE.mode !== 'device' || STATE.granularity !== 'week') return;
    document.querySelectorAll('.cell[data-cell]').forEach((c) => c.classList.add('show-hint'));
  }
  function clearDropHints() {
    document.querySelectorAll('.cell').forEach((c) => c.classList.remove('show-hint', 'drop-ok', 'drop-forbid'));
  }

  function focusWorkorder(wo) {
    STATE.granularity = 'week';
    BUS.emit();
    setTimeout(() => {
      const row = document.querySelector(`[data-devrow="${wo.device}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.style.outline = '2px solid var(--green)';
        setTimeout(() => row.style.outline = '', 1500);
      }
    }, 60);
  }

  return { render, showDropHints, clearDropHints, focusWorkorder };
})();
// @AI_GENERATED: end

// @AI_GENERATED
/* ============================================================
 * 图表：热力图（小时损失收益） / 折线图（损失电量）
 * ============================================================ */
const Charts = (function () {
  function colorOf(type) {
    return type === 'suggest' ? '#34c759' : type === 'extend' ? '#ffb02e' : '#ff453a';
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // 渲染单个日期单元格内的热力图/折线图
  function renderCell(devId, date, type) {
    const host = document.querySelector(`[data-chartcell="${devId}|${date}|${type}"]`);
    if (!host) return;
    const data = DATA.hourlyLoss(devId, date);
    if (type === 'heat') host.innerHTML = heatCellHtml(data, devId, date);
    else host.innerHTML = lineCellHtml(data, devId, date);
    bindHover(host, data);
  }

  // 根据小时确定所属时段 → 获取该时段在当天的类型（建议/拓展/禁排）
  function slotTypeForHour(devId, date, hour) {
    // 时段：6-9 → s1, 9-12 → s2, 12-15 → s3, 15-18 → s4
    let slotId = 's1';
    if (hour >= 9 && hour < 12) slotId = 's2';
    else if (hour >= 12 && hour < 15) slotId = 's3';
    else if (hour >= 15) slotId = 's4';
    return DATA.slotType(devId, date, slotId);
  }

  // 紧凑热力图（颜色与设备当天时段类型对应）
  function heatCellHtml(data, devId, date) {
    const cells = data.map((d, i) => {
      const type = slotTypeForHour(devId, date, d.hour);
      const c = colorOf(type);
      return `<div class="heat-cell" data-hi="${i}" style="background:${hexA(c, 0.7)}">
        <span class="hc-h">${d.hour}:00</span><span>¥${d.loss}</span></div>`;
    }).join('');
    return `<div class="heat-wrap heat-wrap-col">${cells}</div>`;
  }

  // 紧凑折线图（颜色与时段类型对应，和热力图一致）
  function lineCellHtml(data, devId, date) {
    const W = 140, H = 90, pad = 16;
    const max = Math.max(...data.map((d) => d.loss));
    const min = Math.min(...data.map((d) => d.loss));
    const stepX = (W - pad * 2) / (data.length - 1);
    const sx = (i) => pad + i * stepX;
    const sy = (v) => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
    let dots = '', segs = '';
    data.forEach((d, i) => {
      const type = slotTypeForHour(devId, date, d.hour);
      const x = sx(i), y = sy(d.loss);
      dots += `<circle data-hi="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${colorOf(type)}" stroke="#0a0a0b"/>`;
      if (i > 0) {
        const prevType = slotTypeForHour(devId, date, data[i - 1].hour);
        const px = sx(i - 1), py = sy(data[i - 1].loss);
        segs += `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${colorOf(type)}" stroke-width="1.5"/>`;
      }
    });
    return `<svg style="width:100%;height:90px" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      ${segs}${dots}
    </svg>`;
  }

  // 旧方法保留给日视图等场景
  function render(devId, type) {
    const host = document.querySelector(`[data-chart="${devId}|${type}"]`);
    if (!host) return;
    const date = STATE.currentDate || currentWeekDates()[0].date;
    const data = DATA.hourlyLoss(devId, date);
    if (type === 'heat') host.innerHTML = heatCellHtml(data, devId, date);
    else host.innerHTML = lineCellHtml(data, devId, date);
    bindHover(host, data);
  }

  function bindHover(host, data) {
    host.querySelectorAll('[data-hi]').forEach((el) => {
      const d = data[+el.dataset.hi];
      UI.bindTooltip(el, () => `<div class="tt-title">${UI.esc(d.label)}</div>
        <div class="tt-row"><span class="k">预测电量</span><span class="v">${d.power} MW</span></div>
        <div class="tt-row"><span class="k">电价</span><span class="v">${d.price} 元/kWh</span></div>
        <div class="tt-row"><span class="k">损失收益</span><span class="v y">¥${d.loss}</span></div>`);
    });
  }

  return { render, renderCell };
})();
// @AI_GENERATED: end
