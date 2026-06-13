// @AI_GENERATED
/* ============================================================
 * 弹窗：人工排程 / 排程确认 / 禁排提醒 / 冲突提醒 / 换人 / 换人异常
 * ============================================================ */

const Modals = (function () {
  const overlay = () => document.getElementById('overlay');

  function open(html) {
    const ov = overlay();
    ov.innerHTML = html;
    ov.classList.add('show');
    ov.querySelectorAll('[data-close]').forEach((b) => b.onclick = close);
    ov.onclick = (e) => { if (e.target === ov) close(); };
  }
  function close() { overlay().classList.remove('show'); overlay().innerHTML = ''; }

  function pad(n) { return String(n).padStart(2, '0'); }
  function durH(wo) { return wo.estHours || 2; }

  function slotLoss(devId, date, def) {
    const hrs = DATA.hourlyLoss(devId, date).filter((h) => h.hour >= def.start && h.hour < def.end);
    return Math.round(hrs.reduce((s, h) => s + h.loss, 0) / (hrs.length || 1));
  }
  function lossCls(type) { return type === 'suggest' ? 'g' : type === 'extend' ? 'y' : 'r'; }
  function typeText(type) { return type === 'suggest' ? '建议时段' : type === 'extend' ? '拓展时段' : '禁排时段'; }

  // 资质 / 工时校验
  function canHandle(personId, wo) {
    const p = DATA.personById(personId);
    const date = wo.schedDate || currentWeekDates()[0].date;
    const stats = PersonBoard.dayStats(personId, date);
    const addH = durH(wo);
    if (stats.hours + addH > 9) return { ok: false, reason: `工时超负荷（${stats.hours}h + ${addH}h > 9h）` };
    if (stats.count + 1 > 3) return { ok: false, reason: '当天工单将超过 3 个' };
    const needElec = /电|发电|集电|碳刷/.test(wo.name);
    if (needElec && !p.skills.includes('电气')) return { ok: false, reason: `资质不匹配（需电气资质，${p.name} 为 ${p.group}）` };
    return { ok: true };
  }

  // ---------- 应用排程 ----------
  function applySchedule(wo, params) {
    wo.scheduled = true;
    wo.schedDate = params.date;
    wo.slot = params.slot;
    wo.schedStart = pad(params.startHour) + ':00';
    wo.schedEnd = pad(params.startHour + durH(wo)) + ':00';
    if (params.personId) wo.handler = params.personId;
    if (params.reminder) {
      wo.hasReminder = true;
      wo.reminderType = params.reminder.type;
      wo.reminderReason = params.reminder.reason;
      if (params.reminder.conflict) {
        const other = DATA.woById(params.reminder.conflict);
        if (other) { other.hasReminder = true; other.reminderType = 'conflict'; other.reminderReason = `与「${wo.name}」存在${params.reminder.ctype}`; }
      }
    } else {
      // 没有新提醒时，检查旧提醒是否已被解决
      resolveReminders(wo);
    }
  }

  // ---------- 检查并清除已解决的提醒 ----------
  function resolveReminders(wo) {
    if (!wo.hasReminder) return;

    const type = wo.reminderType;

    // 禁排类型：检查新排程时段是否仍为禁排
    if (type === 'forbid') {
      const slotType = DATA.slotType(wo.device, wo.schedDate, wo.slot);
      if (slotType !== 'forbid') {
        clearReminder(wo);
        UI.toast(`提醒已解决：「${wo.name}」不再处于禁排时段`);
      }
      return;
    }

    // 冲突类型：检查是否仍然存在人员互斥或时空冲突
    if (type === 'conflict') {
      const startHour = +wo.schedStart.split(':')[0];
      const conflict = detectConflict(wo, wo.schedDate, startHour);
      if (!conflict) {
        // 冲突已解除，清除自身提醒
        clearReminder(wo);
        // 同时检查关联的冲突工单是否也已解除
        if (wo.conflictOrders) {
          wo.conflictOrders.forEach((otherId) => {
            const other = DATA.woById(otherId);
            if (other && other.hasReminder && other.reminderType === 'conflict') {
              const otherStart = +other.schedStart.split(':')[0];
              const otherConflict = detectConflict(other, other.schedDate, otherStart);
              if (!otherConflict) clearReminder(other);
            }
          });
        }
        // 反向：查找所有引用此工单为冲突源的工单
        DATA.workorders.forEach((o) => {
          if (o.id === wo.id || !o.hasReminder || o.reminderType !== 'conflict') return;
          if (o.conflictOrders && o.conflictOrders.includes(wo.id)) {
            const oStart = +o.schedStart.split(':')[0];
            const oConflict = detectConflict(o, o.schedDate, oStart);
            if (!oConflict) clearReminder(o);
          }
        });
        UI.toast(`提醒已解决：「${wo.name}」不再存在人员互斥/时空冲突`);
      }
      return;
    }

    // 换人异常类型：检查当前处理人是否仍存在工时超负荷/资质不匹配
    if (type === 'swap') {
      if (wo.handler) {
        const chk = canHandle(wo.handler, wo);
        if (chk.ok) {
          clearReminder(wo);
          UI.toast(`提醒已解决：「${wo.name}」处理人工时/资质已正常`);
        }
      }
      return;
    }
  }

  function clearReminder(wo) {
    wo.hasReminder = false;
    wo.reminderType = '';
    wo.reminderReason = '';
    wo.conflictOrders = null;
    wo.conflictType = '';
  }

  // 检测时空/人员冲突
  function detectConflict(wo, date, startHour) {
    const end = startHour + durH(wo);
    return visibleWorkorders().find((o) => {
      if (o.id === wo.id || !o.scheduled || o.schedDate !== date) return false;
      const os = +o.schedStart.split(':')[0], oe = +o.schedEnd.split(':')[0];
      const overlap = startHour < oe && os < end;
      if (!overlap) return false;
      return o.handler === wo.handler || o.device === wo.device;
    });
  }

  // ---------- 人工排程弹窗 ----------
  function openManualSchedule(wo) {
    const m = { woId: wo.id, date: (wo.schedDate || currentWeekDates()[0].date), slot: null, startHour: null, personId: wo.handler };
    renderManual(wo, m);
  }

  function allDates() {
    return [...DATA.weekDates.current, ...DATA.weekDates.next];
  }

  function renderManual(wo, m) {
    const def = DATA.slotDefs.find((s) => s.id === m.slot);
    const startOpts = def
      ? Array.from({ length: Math.max(1, def.end - def.start - durH(wo) + 1) }, (_, i) => def.start + i)
      : [];
    if (def && m.startHour == null) m.startHour = def.start;

    const slotsHtml = DATA.slotDefs.map((s) => {
      const type = DATA.slotType(wo.device, m.date, s.id);
      const loss = slotLoss(wo.device, m.date, s);
      return `<div class="slot-opt ${type} ${m.slot === s.id ? 'selected' : ''}" data-pick-slot="${s.id}">
        <div>${s.label} · ${typeText(type)}</div>
        <div class="so-loss ${lossCls(type)}">损失 ¥${loss}</div>
      </div>`;
    }).join('');

    const persons = DATA.persons.map((p) => {
      const load = PersonBoard.dayStats(p.id, m.date);
      return `<div class="person-opt ${m.personId === p.id ? 'selected' : ''}" data-pick-person="${p.id}">
        <div><div class="po-name">${UI.esc(p.name)}</div><div class="po-group">${UI.esc(p.group)}</div></div>
        <div class="po-load">当天 ${load.hours}h / ${load.count}单
          <div class="pl-bar"><i style="width:${Math.min(100, load.hours / 9 * 100)}%;background:${load.hours >= 9 ? 'var(--red)' : load.hours >= 6 ? 'var(--yellow)' : 'var(--green)'}"></i></div>
        </div>
      </div>`;
    }).join('');

    open(`
      <div class="modal">
        <div class="modal-head"><span class="m-title">🛠 人工排程 · ${UI.esc(wo.name)}</span><button class="m-close" data-close>×</button></div>
        <div class="modal-body">
          <div class="form-row"><label>设备 / 工单</label>
            <input value="${UI.esc(wo.device)} ${UI.esc(wo.model)} · #${UI.esc(wo.id)} · 预计 ${durH(wo)}h" disabled></div>
          <div class="form-row"><label>允许排程日期（本周 / 下周）</label>
            <select id="mDate">${allDates().map((d) => `<option value="${d.date}" ${m.date === d.date ? 'selected' : ''}>2026-${d.date} ${d.weekday}</option>`).join('')}</select>
          </div>
          <div class="form-row"><label>建议 / 拓展时段（含对应损失收益）</label>
            <div class="slot-pick">${slotsHtml}</div>
          </div>
          <div class="form-row"><label>开始时间</label>
            <select id="mStart" ${def ? '' : 'disabled'}>
              ${def ? startOpts.map((h) => `<option value="${h}" ${m.startHour === h ? 'selected' : ''}>${pad(h)}:00 - ${pad(h + durH(wo))}:00</option>`).join('') : '<option>请先选择时段</option>'}
            </select>
          </div>
          <div class="form-row"><label>可用检修人员</label>
            <div class="person-pick">${persons}</div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" data-close>取消</button>
          <button class="btn primary" id="mConfirm">确认排程</button>
        </div>
      </div>`);

    document.getElementById('mDate').onchange = (e) => { m.date = e.target.value; m.slot = null; m.startHour = null; renderManual(wo, m); };
    document.querySelectorAll('[data-pick-slot]').forEach((s) => s.onclick = () => { m.slot = s.dataset.pickSlot; m.startHour = null; renderManual(wo, m); });
    document.querySelectorAll('[data-pick-person]').forEach((p) => p.onclick = () => { m.personId = p.dataset.pickPerson; renderManual(wo, m); });
    const mStart = document.getElementById('mStart');
    if (mStart) mStart.onchange = (e) => m.startHour = +e.target.value;
    document.getElementById('mConfirm').onclick = () => {
      if (!m.slot) { UI.toast('请选择排程时段'); return; }
      if (!m.personId) { UI.toast('请选择检修人员'); return; }
      finalize(wo, m);
    };
  }

  // ---------- 拖入看板排程确认弹窗 ----------
  function openDropConfirm(wo, devId, date) {
    const m = { woId: wo.id, date, slot: null, startHour: null, personId: wo.handler || DATA.persons[0].id };
    renderDropConfirm(wo, m);
  }

  function renderDropConfirm(wo, m) {
    const def = DATA.slotDefs.find((s) => s.id === m.slot);
    const startOpts = def ? Array.from({ length: Math.max(1, def.end - def.start - durH(wo) + 1) }, (_, i) => def.start + i) : [];
    if (def && m.startHour == null) m.startHour = def.start;
    const slotsHtml = DATA.slotDefs.map((s) => {
      const type = DATA.slotType(wo.device, m.date, s.id);
      const loss = slotLoss(wo.device, m.date, s);
      return `<div class="slot-opt ${type} ${m.slot === s.id ? 'selected' : ''}" data-pick-slot="${s.id}">
        <div>${s.label} · ${typeText(type)}</div><div class="so-loss ${lossCls(type)}">损失 ¥${loss}</div></div>`;
    }).join('');

    open(`
      <div class="modal">
        <div class="modal-head"><span class="m-title">📥 排程确认 · ${UI.esc(wo.name)}</span><button class="m-close" data-close>×</button></div>
        <div class="modal-body">
          <div class="form-row"><label>目标设备 / 日期</label>
            <input value="${UI.esc(wo.device)} ${UI.esc(wo.model)} · 2026-${UI.esc(m.date)}" disabled></div>
          <div class="form-row"><label>建议 / 拓展时段（含损失收益）</label><div class="slot-pick">${slotsHtml}</div></div>
          <div class="form-row"><label>开始时间</label>
            <select id="dStart" ${def ? '' : 'disabled'}>
              ${def ? startOpts.map((h) => `<option value="${h}" ${m.startHour === h ? 'selected' : ''}>${pad(h)}:00 - ${pad(h + durH(wo))}:00</option>`).join('') : '<option>请先选择时段</option>'}
            </select></div>
        </div>
        <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn primary" id="dConfirm">确认排程</button></div>
      </div>`);
    document.querySelectorAll('[data-pick-slot]').forEach((s) => s.onclick = () => { m.slot = s.dataset.pickSlot; m.startHour = null; renderDropConfirm(wo, m); });
    const dStart = document.getElementById('dStart');
    if (dStart) dStart.onchange = (e) => m.startHour = +e.target.value;
    document.getElementById('dConfirm').onclick = () => {
      if (!m.slot) { UI.toast('请选择排程时段'); return; }
      finalize(wo, m);
    };
  }

  // ---------- 收口：禁排 / 冲突 校验 ----------
  function finalize(wo, m) {
    const type = DATA.slotType(wo.device, m.date, m.slot);
    if (type === 'forbid') {
      openForbidWarn(wo, m);
      return;
    }
    const conflict = detectConflict(wo, m.date, m.startHour);
    if (conflict) {
      openConflictWarn(wo, m, conflict);
      return;
    }
    applySchedule(wo, m);
    close();
    UI.toast(`已排程：${wo.name} → ${wo.device} ${m.date} ${pad(m.startHour)}:00`);
    BUS.emit();
  }

  // 禁排期提醒弹窗
  function openForbidWarn(wo, m) {
    open(`
      <div class="modal">
        <div class="modal-head"><span class="m-title">⛔ 禁排期提醒</span><button class="m-close" data-close>×</button></div>
        <div class="modal-body">
          <div class="warn-box"><span class="w-ico">⚠</span><div class="w-text">
            <b>该时段为算法禁排时段</b>
            <span>约束原因：${UI.esc(DATA.weatherForbid(wo.device, m.date) || '气象大风 / 限电窗口约束，建议规避该时段以降低风险与损失。')}</span>
          </div></div>
          <p style="color:var(--text-dim)">是否仍要将「${UI.esc(wo.name)}」强行排入该禁排时段？</p>
        </div>
        <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn danger" id="forceForbid">继续排程</button></div>
      </div>`);
    document.getElementById('forceForbid').onclick = () => {
      const conflict = detectConflict(wo, m.date, m.startHour);
      m.reminder = { type: 'forbid', reason: `强行排入禁排时段（${m.date}），约束：${DATA.weatherForbid(wo.device, m.date) || '气象/限电禁排'}` };
      if (conflict) { openConflictWarn(wo, m, conflict); return; }
      applySchedule(wo, m);
      close();
      UI.toast(`已强行排入禁排时段：${wo.name}（已标记提醒）`);
      BUS.emit();
    };
  }

  // 人员互斥 / 时空冲突弹窗
  function openConflictWarn(wo, m, conflict) {
    const ctype = conflict.handler === wo.handler ? '人员互斥' : '时空冲突';
    open(`
      <div class="modal">
        <div class="modal-head"><span class="m-title">⚠ ${ctype}提醒</span><button class="m-close" data-close>×</button></div>
        <div class="modal-body">
          <div class="warn-box amber"><span class="w-ico">⚠</span><div class="w-text">
            <b>该工单与「${UI.esc(conflict.name)}」存在${ctype}</b>
            <span>冲突工单：#${UI.esc(conflict.id)} · ${UI.esc(conflict.device)} · ${UI.esc(conflict.schedDate)} ${UI.esc(conflict.schedStart)}-${UI.esc(conflict.schedEnd)}</span>
          </div></div>
          <p style="color:var(--text-dim)">是否仍要继续排程？继续后将在相关工单与设备行标记提醒。</p>
        </div>
        <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn danger" id="forceConflict">继续排程</button></div>
      </div>`);
    document.getElementById('forceConflict').onclick = () => {
      m.reminder = Object.assign(m.reminder || {}, {
        type: 'conflict', ctype,
        reason: `与「${conflict.name}」存在${ctype}`,
        conflict: conflict.id,
      });
      applySchedule(wo, m);
      close();
      UI.toast(`已继续排程：${wo.name}（存在${ctype}，已标记提醒）`);
      BUS.emit();
    };
  }

  // ---------- 换人弹窗 ----------
  function openSwap(wo) {
    const candidates = DATA.persons.filter((p) => p.id !== wo.handler);
    const opts = candidates.map((p) => {
      const load = PersonBoard.dayStats(p.id, wo.schedDate);
      return `<div class="person-opt" data-swap-to="${p.id}">
        <div><div class="po-name">${UI.esc(p.name)}</div><div class="po-group">${UI.esc(p.group)}</div></div>
        <div class="po-load">当天 ${load.hours}h / ${load.count}单
          <div class="pl-bar"><i style="width:${Math.min(100, load.hours / 9 * 100)}%;background:${load.hours >= 9 ? 'var(--red)' : load.hours >= 6 ? 'var(--yellow)' : 'var(--green)'}"></i></div>
        </div></div>`;
    }).join('');
    open(`
      <div class="modal">
        <div class="modal-head"><span class="m-title">🔄 换人 · ${UI.esc(wo.name)}</span><button class="m-close" data-close>×</button></div>
        <div class="modal-body">
          <p style="color:var(--text-dim);margin-top:0">当前处理人：${UI.esc(DATA.personById(wo.handler) ? DATA.personById(wo.handler).name : '未分配')} · 可处理该工单的人员（含当天工作量）：</p>
          <div class="person-pick">${opts}</div>
        </div>
        <div class="modal-foot"><button class="btn" data-close>取消</button></div>
      </div>`);
    document.querySelectorAll('[data-swap-to]').forEach((p) => p.onclick = () => confirmSwap(wo, p.dataset.swapTo, false));
  }

  // 执行换人（校验工时/资质）
  function confirmSwap(wo, personId, fromDrag) {
    const chk = canHandle(personId, wo);
    if (!chk.ok) { openSwapException(wo, personId, chk.reason); return; }
    wo.handler = personId;
    // 换人成功且无异常，检查旧提醒是否已解决
    resolveReminders(wo);
    close();
    UI.toast(`换人成功：${wo.name} → ${DATA.personById(personId).name}`);
    BUS.emit();
  }

  // 换人异常提醒弹窗
  function openSwapException(wo, personId, reason) {
    const p = DATA.personById(personId);
    open(`
      <div class="modal">
        <div class="modal-head"><span class="m-title">⚠ 换人异常提醒</span><button class="m-close" data-close>×</button></div>
        <div class="modal-body">
          <div class="warn-box"><span class="w-ico">⚠</span><div class="w-text">
            <b>目标人员存在异常：${UI.esc(p.name)}</b><span>${UI.esc(reason)}</span></div></div>
          <p style="color:var(--text-dim)">是否仍要继续换人？继续后将在任务列表工单与人员行标记提醒。</p>
        </div>
        <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn danger" id="forceSwap">继续排程</button></div>
      </div>`);
    document.getElementById('forceSwap').onclick = () => {
      wo.handler = personId;
      wo.hasReminder = true;
      wo.reminderType = 'swap';
      wo.reminderReason = `换人异常：${reason}`;
      close();
      UI.toast(`已继续换人：${wo.name} → ${p.name}（已标记提醒）`);
      BUS.emit();
    };
  }

  return { openManualSchedule, openDropConfirm, openSwap, confirmSwap, canHandle };
})();
// @AI_GENERATED: end
