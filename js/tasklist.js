// @AI_GENERATED
/* ============================================================
 * 左侧任务列表：全部 / 未排程 / 已排程
 * ============================================================ */

const TaskList = (function () {
  const urgencyOrder = { high: 0, mid: 1, low: 2 };

  function filtered() {
    let list = visibleWorkorders();
    if (STATE.taskTab === 'unscheduled') list = list.filter((w) => !w.scheduled);
    else if (STATE.taskTab === 'scheduled') list = list.filter((w) => w.scheduled);
    // 先按设备聚合，再按紧急程度
    return list.slice().sort((a, b) => {
      if (a.device !== b.device) return a.device < b.device ? -1 : 1;
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }

  function counts() {
    const all = visibleWorkorders();
    return {
      all: all.length,
      unscheduled: all.filter((w) => !w.scheduled).length,
      scheduled: all.filter((w) => w.scheduled).length,
    };
  }

  function cardHtml(wo) {
    const person = wo.handler ? DATA.personById(wo.handler) : null;
    const timeStr = wo.scheduled
      ? `${wo.schedStart}-${wo.schedEnd}`
      : `${wo.estStart}-${wo.estEnd}`;
    const recCls = wo.urgency === 'mid' ? 'warn' : '';
    return `
      <div class="wo-card urgency-${wo.urgency} ${STATE.selectedWoId === wo.id ? 'selected' : ''}"
           draggable="true" data-id="${wo.id}">
        ${wo.hasReminder ? `<div class="wo-flag" data-flag="${wo.id}">${UI.icons.bell}</div>` : ''}
        <div class="wo-name">${UI.esc(wo.name)}</div>
        <div class="wo-dev"><span class="tag">${UI.esc(wo.device)} ${UI.esc(wo.model)}</span></div>
        <div class="wo-time">${UI.esc(timeStr)} <span class="h">${wo.estHours}h</span></div>
        <div class="wo-meta">#${UI.esc(wo.id)} ${UI.esc(wo.code)} · ${UI.esc(wo.date)} · Labor: ${UI.esc(person ? person.name : '未分配')}</div>
        <div class="wo-recommend ${recCls}">
          <span class="ico">${wo.scheduled ? UI.icons.bolt : UI.icons.warn}</span>
          <span>${UI.esc(wo.recommend)}</span>
        </div>
        <div class="wo-actions">
          <button class="btn-mini" data-manual="${wo.id}">人工排程</button>
        </div>
      </div>`;
  }

  function render() {
    const el = document.getElementById('tasklist');
    const c = counts();
    const list = filtered();
    el.innerHTML = `
      <div class="tl-head">
        <span class="ttl">📋 任务列表</span>
        <span class="badge">${c.all}</span>
      </div>
      <div class="tl-tabs">
        <div class="tl-tab ${STATE.taskTab === 'all' ? 'active' : ''}" data-tab="all">全部 <span class="n">(${c.all})</span></div>
        <div class="tl-tab ${STATE.taskTab === 'unscheduled' ? 'active' : ''}" data-tab="unscheduled">未排程 <span class="n">(${c.unscheduled})</span></div>
        <div class="tl-tab ${STATE.taskTab === 'scheduled' ? 'active' : ''}" data-tab="scheduled">已排程 <span class="n">(${c.scheduled})</span></div>
      </div>
      <div class="tl-list" id="tlList">
        ${list.length ? list.map(cardHtml).join('') : '<div class="empty">暂无工单</div>'}
      </div>`;
    bind();
  }

  function bind() {
    document.querySelectorAll('#tasklist .tl-tab').forEach((t) => {
      t.onclick = () => { STATE.taskTab = t.dataset.tab; render(); };
    });

    document.querySelectorAll('#tlList .wo-card').forEach((card) => {
      const id = card.dataset.id;
      const wo = DATA.woById(id);

      // hover 详情
      UI.bindTooltip(card, () => UI.woTooltipHtml(wo, { scheduled: false }));

      // 点击工单：已排程定位看板，未排程提醒
      card.onclick = (e) => {
        if (e.target.closest('[data-manual]') || e.target.closest('[data-flag]')) return;
        STATE.selectedWoId = id;
        if (wo.scheduled) {
          UI.toast(`已定位到看板：${wo.device} · ${wo.schedDate}`);
          Board.focusWorkorder(wo);
        } else {
          UI.toast('该工单未排程，请使用「人工排程」或拖拽到设备行进行排程');
        }
        render();
      };

      // 人工排程按钮
      const mbtn = card.querySelector('[data-manual]');
      if (mbtn) mbtn.onclick = (e) => { e.stopPropagation(); Modals.openManualSchedule(wo); };

      // 提醒标志 hover
      const flag = card.querySelector('[data-flag]');
      if (flag) UI.bindTooltip(flag, () => `<div class="tt-title">⚠ 排程提醒</div>
        <div class="tt-row"><span class="v r">${UI.esc(wo.reminderReason)}</span></div>`);

      // 拖拽
      card.addEventListener('dragstart', (e) => {
        STATE.draggingWoId = id;
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        if (STATE.mode === 'device') Board.showDropHints();
        else UI.toast('从任务列表拖拽排程仅支持「设备视图」');
      });
      card.addEventListener('dragend', () => {
        STATE.draggingWoId = null;
        card.classList.remove('dragging');
        Board.clearDropHints();
      });
    });
  }

  return { render };
})();
// @AI_GENERATED: end
