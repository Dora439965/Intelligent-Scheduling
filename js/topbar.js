// @AI_GENERATED
/* ============================================================
 * 顶部全局控件栏：场站选择器 / 模式切换 / 总体展示
 * ============================================================ */

const TopBar = (function () {
  function farmTriggerText() {
    if (!STATE.selectedFarms.length) return '全部场站';
    if (STATE.selectedFarms.length === DATA.farms.length) return '全部场站';
    if (STATE.selectedFarms.length === 1) return DATA.farmById(STATE.selectedFarms[0]).name;
    return `已选 ${STATE.selectedFarms.length} 个场站`;
  }

  function render() {
    const el = document.getElementById('topbar');
    const totals = computeTotals();
    el.innerHTML = `
      <div class="brand">
        <span class="logo"><span class="dot"></span>EnOS</span>
        <span class="sep"></span>
        <span class="title">智能排程</span>
      </div>

      <div class="farm-select" id="farmSelect">
        <button class="fs-trigger" id="fsTrigger">
          <span>🏭</span><span id="fsText">${UI.esc(farmTriggerText())}</span>
          <span class="caret">▾</span>
        </button>
        <div class="fs-menu" id="fsMenu">
          <div class="fs-opt ${!STATE.selectedFarms.length ? 'checked' : ''}" data-all="1">
            <span class="chk">${!STATE.selectedFarms.length ? '✓' : ''}</span>全部场站
          </div>
          <div class="fs-divider"></div>
          ${DATA.farms.map((f) => {
            const on = STATE.selectedFarms.includes(f.id);
            return `<div class="fs-opt ${on ? 'checked' : ''}" data-id="${f.id}">
              <span class="chk">${on ? '✓' : ''}</span>${UI.esc(f.name)}
              <span class="meta">${UI.esc(f.power)}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="seg" id="modeSeg">
        <button data-mode="device" class="${STATE.mode === 'device' ? 'active' : ''}">⚙ 设备</button>
        <button data-mode="person" class="${STATE.mode === 'person' ? 'active' : ''}">👥 人员</button>
      </div>

      <div class="date-range">📅 2026-${currentWeekDates()[0].date} ~ ${currentWeekDates().slice(-1)[0].date}</div>

      <div class="grow"></div>

      <div class="totals">
        <div class="total-chip loss">${STATE.week === 'current' ? '本周损失' : '下周损失'}<b>${totals.lossText}</b></div>
        <div class="total-chip">工单<b>${totals.count}</b></div>
      </div>
      <button class="lang-btn" id="langBtn">${STATE.lang}</button>
    `;
    bind();
  }

  function bind() {
    const fs = document.getElementById('farmSelect');
    document.getElementById('fsTrigger').onclick = (e) => {
      e.stopPropagation();
      fs.classList.toggle('open');
    };
    document.querySelectorAll('#fsMenu .fs-opt').forEach((opt) => {
      opt.onclick = (e) => {
        e.stopPropagation();
        if (opt.dataset.all) {
          STATE.selectedFarms = [];
        } else {
          const id = opt.dataset.id;
          const i = STATE.selectedFarms.indexOf(id);
          if (i >= 0) STATE.selectedFarms.splice(i, 1);
          else STATE.selectedFarms.push(id);
        }
        BUS.emit();
      };
    });

    document.querySelectorAll('#modeSeg button').forEach((b) => {
      b.onclick = () => {
        STATE.mode = b.dataset.mode;
        STATE.granularity = 'week';
        BUS.emit();
      };
    });

    document.getElementById('langBtn').onclick = () => {
      STATE.lang = STATE.lang === 'CN' ? 'EN' : 'CN';
      render();
    };
  }

  // 点击空白处关闭场站下拉
  document.addEventListener('click', () => {
    const fs = document.getElementById('farmSelect');
    if (fs) fs.classList.remove('open');
  });

  return { render };
})();
// @AI_GENERATED: end
