// @AI_GENERATED
/* ============================================================
 * 全局页面状态
 * ============================================================ */

const STATE = {
  selectedFarms: ['BL'],      // 当前选中场站（多选）；空数组=全部场站
  mode: 'device',             // device | person
  week: 'current',            // current | next  (本周 / 下周)
  granularity: 'week',        // week | day
  currentDate: '05-25',       // 日视图当前日期
  taskTab: 'all',             // all | unscheduled | scheduled
  selectedWoId: null,         // 当前选中的工单
  draggingWoId: null,         // 当前拖拽的工单
  expandedChart: {},          // { [deviceId]: 'heat' | 'line' | null }
  lang: 'CN',
};

// 简单事件总线，用于刷新视图
const BUS = {
  listeners: [],
  on(fn) { this.listeners.push(fn); },
  emit() { this.listeners.forEach((fn) => fn()); },
};

// 工具：当前周日期数组
function currentWeekDates() {
  return DATA.weekDates[STATE.week];
}

// 工具：当前可见设备（按选中场站过滤）
function visibleDevices() {
  if (!STATE.selectedFarms.length) return DATA.devices;
  return DATA.devices.filter((d) => STATE.selectedFarms.includes(d.farm));
}

// 工具：当前可见工单（按选中场站过滤）
function visibleWorkorders() {
  let list = DATA.workorders;
  if (STATE.selectedFarms.length) {
    list = list.filter((w) => STATE.selectedFarms.includes(w.farm));
  }
  return list;
}

// 工具：当前可见人员（出现在可见工单中的处理人 + 全部基础人员）
function visiblePersons() {
  return DATA.persons;
}

// 统计：总损失收益 & 工单数（顶部总体展示）
function computeTotals() {
  const list = visibleWorkorders();
  let lossSum = 0;
  list.forEach((w) => {
    const n = parseInt(String(w.loss).replace(/[^\d]/g, ''), 10) || 0;
    lossSum += n;
  });
  return {
    lossText: '¥' + (lossSum >= 1000 ? (lossSum / 1000).toFixed(1) + 'k' : lossSum),
    count: list.length,
  };
}
// @AI_GENERATED: end
