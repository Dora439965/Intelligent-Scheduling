// @AI_GENERATED
/* ============================================================
 * 应用入口：首次渲染 + 全局事件总线响应
 * ============================================================ */

// 统一看板渲染入口
const Board = {
  render() {
    if (STATE.mode === 'device') DeviceBoard.render();
    else PersonBoard.render();
  },
  showDropHints() {
    if (STATE.mode === 'device') DeviceBoard.showDropHints();
  },
  clearDropHints() {
    DeviceBoard.clearDropHints();
  },
  focusWorkorder(wo) {
    if (STATE.mode === 'device') DeviceBoard.focusWorkorder(wo);
    else PersonBoard.focusWorkorder(wo);
  },
};

// 全局刷新
function renderAll() {
  TopBar.render();
  TaskList.render();
  Board.render();
  Legend.render();
}

// 事件总线连接
BUS.on(renderAll);

// FAB 按钮
document.getElementById('fab').onclick = () => {
  UI.toast('智能排程已于每日 0:00 自动执行，当前展示最新排程结果');
};

// 首次渲染
renderAll();
// @AI_GENERATED: end
