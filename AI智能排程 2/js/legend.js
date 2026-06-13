// @AI_GENERATED
/* ============================================================
 * 注释栏：设备视图 / 人员视图的颜色图例与规则说明
 * ============================================================ */

const Legend = (function () {
  function render() {
    const el = document.getElementById('legend');
    if (STATE.mode === 'device') {
      el.innerHTML = `
        <span class="lg-title">工作窗口 :</span>
        <span class="lg-item"><span class="swatch g"></span>绿色：建议时段，适合安排检修的窗口</span>
        <span class="lg-item"><span class="swatch y"></span>黄色：拓展时段，可排程但损失较高</span>
        <span class="lg-item"><span class="swatch r"></span>红色：禁排时段/禁排阶段，气象约束，不建议排程</span>
        <span class="lg-sep"></span>
        <span class="lg-title">推荐排程 :</span>
        <span class="lg-item">颜色越浅代表损失收益越小，推荐排程；限电事件/输变电停运协同事件优先排程</span>
        <span class="lg-sep"></span>
        <span class="lg-item"><span class="lg-flag">!</span>提醒标志：该工单存在禁排、人员互斥、时空冲突等排程风险</span>
      `;
    } else {
      el.innerHTML = `
        <span class="lg-title">工作窗口 :</span>
        <span class="lg-item"><span class="swatch g"></span>绿色进度条：工作时长 &lt; 6h，正常</span>
        <span class="lg-item"><span class="swatch y"></span>橙色进度条：工作时长 6-9h，满负荷</span>
        <span class="lg-item"><span class="swatch r"></span>红色进度条：工作时长 ≥ 9h，超负荷</span>
        <span class="lg-sep"></span>
        <span class="lg-title">推荐排程 :</span>
        <span class="lg-item">每人每天工单 ≤ 3 个 · 工作时长 ≤ 9 小时 · 连续三天超 6h 需提醒</span>
        <span class="lg-sep"></span>
        <span class="lg-item"><span class="lg-flag">!</span>提醒标志：工时超负荷、资质不匹配等问题</span>
      `;
    }
  }
  return { render };
})();
// @AI_GENERATED: end
