// @AI_GENERATED
/* ============================================================
 * AI 智能排程软件 - 模拟数据
 * 严格依据《AI智能排程软件前端页面搭建说明》构建
 * ============================================================ */

const DATA = (function () {
  // ---------- 场站 ----------
  const farms = [
    { id: 'BL', name: '北山风场', power: '7.5MW' },
    { id: 'DF', name: '东风风场', power: '6.0MW' },
    { id: 'NH', name: '南湖风场', power: '5.5MW' },
  ];

  // ---------- 检修人员 ----------
  const persons = [
    { id: 'p1', name: '张强强', group: '电气一组', skills: ['电气', '发电机'] },
    { id: 'p2', name: '赵磊磊', group: '机械一组', skills: ['液压', '机械'] },
    { id: 'p3', name: '李志伟', group: '电气二组', skills: ['电气', '齿轮箱'] },
    { id: 'p4', name: '王志斌', group: '机械二组', skills: ['偏航', '机械'] },
    { id: 'p5', name: '刘海涛', group: '综合班组', skills: ['主轴', '综合'] },
    { id: 'p6', name: '陈建国', group: '电气一组', skills: ['电气', '发电机'] },
  ];

  // ---------- 设备 ----------
  const devices = [
    { id: 'BL-01', name: 'BL-01', model: '2.5MW', farm: 'BL' },
    { id: 'BL-07', name: 'BL-07', model: '2.5MW', farm: 'BL' },
    { id: 'BL-08', name: 'BL-08', model: '2.5MW', farm: 'BL' },
    { id: 'BL-12', name: 'BL-12', model: '2.5MW', farm: 'BL' },
    { id: 'DF-03', name: 'DF-03', model: '3.0MW', farm: 'DF' },
    { id: 'DF-05', name: 'DF-05', model: '3.0MW', farm: 'DF' },
    { id: 'NH-02', name: 'NH-02', model: '2.0MW', farm: 'NH' },
  ];

  // ---------- 本周日期 ----------
  const weekDates = {
    current: [
      { date: '05-25', weekday: '周一' },
      { date: '05-26', weekday: '周二' },
      { date: '05-27', weekday: '周三' },
      { date: '05-28', weekday: '周四' },
      { date: '05-29', weekday: '周五' },
    ],
    next: [
      { date: '06-01', weekday: '周一' },
      { date: '06-02', weekday: '周二' },
      { date: '06-03', weekday: '周三' },
      { date: '06-04', weekday: '周四' },
      { date: '06-05', weekday: '周五' },
    ],
  };

  // 时段定义
  const slotDefs = [
    { id: 's1', label: '6-9', start: 6, end: 9 },
    { id: 's2', label: '9-12', start: 9, end: 12 },
    { id: 's3', label: '12-15', start: 12, end: 15 },
    { id: 's4', label: '15-18', start: 15, end: 18 },
  ];

  // ---------- 工单 ----------
  // urgency: high(红) / mid(黄) / low(绿)
  // scheduled: 是否已排程; unscheduledReason: 未排程时缺失要素
  const workorders = [
    {
      id: 'WO-0527',
      name: '发电机碳刷检查',
      device: 'BL-01', model: '2.5MW', farm: 'BL',
      code: 'A1-B-02', date: '05-27', handler: 'p1',
      estStart: '08:00', estEnd: '10:00', estHours: 4,
      urgency: 'high',
      scheduled: true,
      schedDate: '05-27', schedStart: '08:00', schedEnd: '10:00', slot: 's1',
      recommend: '因输变电停运协同，建议该工单安排检修',
      loss: '¥420',
      curtailWindow: '05-27 0:00-24:00 建议停机，停机损失较低',
      workWindow: '建议 08:00-10:00 建议时段内检修',
    },
    {
      id: 'WO-0526A',
      name: '液压系统维护',
      device: 'BL-01', model: '2.5MW', farm: 'BL',
      code: 'A1-C-04', date: '05-28', handler: 'p2',
      estStart: '14:00', estEnd: '18:00', estHours: 3,
      urgency: 'mid',
      scheduled: true,
      schedDate: '05-28', schedStart: '14:00', schedEnd: '17:00', slot: 's3',
      recommend: '低风速窗口，建议拓展时段内安排',
      loss: '¥260',
      curtailWindow: '05-28 无限电，按气象窗口安排',
      workWindow: '建议 14:00-17:00 拓展时段内检修',
    },
    {
      id: 'WO-0526B',
      name: '偏航系统校准',
      device: 'BL-07', model: '2.5MW', farm: 'BL',
      code: 'A1-D-01', date: '05-26', handler: 'p4',
      estStart: '10:00', estEnd: '18:00', estHours: 3,
      urgency: 'low',
      scheduled: true,
      schedDate: '05-26', schedStart: '16:00', schedEnd: '18:00', slot: 's3',
      recommend: '建议低收益时段安排，降低停机损失',
      loss: '¥180',
      curtailWindow: '05-26 部分限电，建议午后安排',
      workWindow: '建议 16:00-18:00 建议时段内检修',
    },
    {
      id: 'WO-0526C',
      name: '主轴轴承探伤',
      device: 'BL-08', model: '2.5MW', farm: 'BL',
      code: 'A1-E-08', date: '05-26', handler: 'p5',
      estStart: '11:00', estEnd: '14:00', estHours: 4,
      urgency: 'high',
      scheduled: true,
      schedDate: '05-26', schedStart: '11:00', schedEnd: '14:00', slot: 's2',
      recommend: '因输变电停运协同建议停机，建议尽快安排',
      loss: '¥510',
      curtailWindow: '05-26 建议停机，停机损失低',
      workWindow: '建议 11:00-14:00 建议时段内检修',
    },
    {
      id: 'WO-0601',
      name: '齿轮箱油液检测',
      device: 'BL-12', model: '2.5MW', farm: 'BL',
      code: 'B2-A-03', date: '05-29', handler: 'p3',
      estStart: '06:00', estEnd: '10:00', estHours: 4,
      urgency: 'mid',
      scheduled: true,
      schedDate: '05-29', schedStart: '06:00', schedEnd: '10:00', slot: 's1',
      recommend: '清晨低风速窗口，建议时段内安排',
      loss: '¥300',
      curtailWindow: '05-29 无限电',
      workWindow: '建议 06:00-10:00 建议时段内检修',
    },
    {
      id: 'WO-0528A',
      name: '叶片裂纹巡检',
      device: 'BL-07', model: '2.5MW', farm: 'BL',
      code: 'A1-F-05', date: '05-28', handler: 'p6',
      estStart: '10:00', estEnd: '13:00', estHours: 3,
      urgency: 'low',
      scheduled: true,
      schedDate: '05-28', schedStart: '10:00', schedEnd: '13:00', slot: 's2',
      recommend: '建议时段内安排',
      loss: '¥150',
      curtailWindow: '05-28 无限电',
      workWindow: '建议 10:00-13:00 建议时段内检修',
    },
    {
      id: 'WO-0529A',
      name: '变桨系统检修',
      device: 'BL-08', model: '2.5MW', farm: 'BL',
      code: 'A1-G-02', date: '05-29', handler: 'p2',
      estStart: '08:00', estEnd: '11:00', estHours: 3,
      urgency: 'mid',
      scheduled: true,
      schedDate: '05-29', schedStart: '08:00', schedEnd: '11:00', slot: 's1',
      recommend: '建议时段内安排',
      loss: '¥240',
      curtailWindow: '05-29 无限电',
      workWindow: '建议 08:00-11:00 建议时段内检修',
    },
    // ---- 已排程但带提醒（冲突/禁排） ----
    {
      id: 'WO-0527B',
      name: '集电线路检查',
      device: 'BL-01', model: '2.5MW', farm: 'BL',
      code: 'A1-H-07', date: '05-27', handler: 'p1',
      estStart: '07:00', estEnd: '10:00', estHours: 3,
      urgency: 'high',
      scheduled: true,
      schedDate: '05-27', schedStart: '07:00', schedEnd: '10:00', slot: 's1',
      recommend: '建议时段内安排',
      loss: '¥390',
      curtailWindow: '05-27 建议停机',
      workWindow: '建议 07:00-10:00 建议时段内检修',
      hasReminder: true,
      reminderType: 'conflict',
      reminderReason: '与「发电机碳刷检查」存在人员互斥（同一处理人 张强强 时段重叠）',
      conflictOrders: ['WO-0527'],
      conflictType: '人员互斥',
    },
    // ---- 未排程工单（缺少排程要素，算法无法自动排程） ----
    {
      id: 'WO-0530A',
      name: '机舱照明改造',
      device: 'BL-07', model: '2.5MW', farm: 'BL',
      code: 'C3-A-01', date: '05-30', handler: null,
      estStart: '--:--', estEnd: '--:--', estHours: 2,
      urgency: 'low',
      scheduled: false,
      unscheduledReason: '缺少检修人员资质信息，算法无法自动排程',
      recommend: '请人工指定检修人员后排程',
      loss: '¥120',
      curtailWindow: '待补充限电窗口信息',
      workWindow: '待人工确认工作窗口',
    },
    {
      id: 'WO-0530B',
      name: '塔筒螺栓力矩复检',
      device: 'BL-08', model: '2.5MW', farm: 'BL',
      code: 'C3-B-04', date: '05-30', handler: null,
      estStart: '--:--', estEnd: '--:--', estHours: 4,
      urgency: 'mid',
      scheduled: false,
      unscheduledReason: '缺少预计工时与气象窗口数据，算法无法自动排程',
      recommend: '请人工补充工时并排程',
      loss: '¥280',
      curtailWindow: '待补充',
      workWindow: '待人工确认工作窗口',
    },
    {
      id: 'WO-0531A',
      name: '冷却风扇更换',
      device: 'BL-12', model: '2.5MW', farm: 'BL',
      code: 'C3-C-09', date: '05-31', handler: null,
      estStart: '--:--', estEnd: '--:--', estHours: 3,
      urgency: 'high',
      scheduled: false,
      unscheduledReason: '缺少备件到货时间，算法无法自动排程',
      recommend: '备件到货后人工排程',
      loss: '¥450',
      curtailWindow: '待补充',
      workWindow: '待人工确认工作窗口',
    },
    {
      id: 'WO-0531B',
      name: '环境监测仪标定',
      device: 'DF-03', model: '3.0MW', farm: 'DF',
      code: 'D4-A-02', date: '05-31', handler: null,
      estStart: '--:--', estEnd: '--:--', estHours: 2,
      urgency: 'low',
      scheduled: false,
      unscheduledReason: '缺少现场作业票信息，算法无法自动排程',
      recommend: '补充作业票后人工排程',
      loss: '¥90',
      curtailWindow: '待补充',
      workWindow: '待人工确认工作窗口',
    },
  ];

  // ---------- 场站功率 / 限电信息（看板首行） ----------
  // 每个 farm 每个 date 的限电/输变电推荐
  const farmCurtail = {
    BL: {
      '05-25': null,
      '05-26': { title: '限电 4.5MW', sub: '已排2.5MW/余2MW', tag: '限电', time: '10:00-16:00' },
      '05-27': { title: '输变电停运协同', sub: '0:00-24:00', tag: '建议停机' },
      '05-28': null,
      '05-29': null,
      '06-01': { title: '限电 3.0MW', sub: '已排2.0MW/余1MW', tag: '限电', time: '08:00-14:00' },
      '06-02': null, '06-03': null, '06-04': null, '06-05': null,
    },
    DF: {
      '05-25': null,
      '05-26': null,
      '05-27': { title: '限电 2.5MW', sub: '已排1.5MW/余1MW', tag: '限电', time: '09:00-15:00' },
      '05-28': { title: '输变电停运协同', sub: '6:00-18:00', tag: '建议停机' },
      '05-29': null,
      '06-01': null, '06-02': null, '06-03': null, '06-04': null, '06-05': null,
    },
    NH: {
      '05-25': { title: '限电 1.8MW', sub: '已排1.0MW/余0.8MW', tag: '限电', time: '11:00-17:00' },
      '05-26': null,
      '05-27': null,
      '05-28': null,
      '05-29': { title: '输变电停运协同', sub: '0:00-12:00', tag: '建议停机' },
      '06-01': null, '06-02': null, '06-03': null, '06-04': null, '06-05': null,
    },
  };

  // ---------- 设备-日期-时段 排程格信息 ----------
  // type: suggest(绿) / extend(黄) / forbid(红)
  // banner: 大风预警 / 建议停机 等横幅
  // 同一日期同一风场下所有设备的时段类型相同（天气条件按风场+日期约束）
  function slotType(deviceId, date, slotId) {
    const dev = devices.find((d) => d.id === deviceId);
    const farmId = dev ? dev.farm : deviceId;
    const key = farmId + date + slotId;
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 1000;
    const m = h % 10;
    if (m < 5) return 'suggest';
    if (m < 8) return 'extend';
    return 'forbid';
  }

  // 设备行横幅：大风预警 / 建议停机
  const deviceBanners = {
    'BL-01': {
      '05-26': { type: 'gale', text: 'Blue Level-4 Gale Warning 大风预警', time: '13:00 - 17:00' },
      '05-27': { type: 'curtail', text: '输变电停运协同', time: '0:00 - 24:00', tag: '建议停机' },
    },
    'BL-07': {
      '05-26': { type: 'gale', text: 'Blue Level-4 Gale Warning 大风预警', time: '13:00 - 17:00' },
      '05-27': { type: 'curtail', text: '输变电停运协同', time: '0:00 - 24:00', tag: '建议停机' },
    },
    'BL-08': {
      '05-26': { type: 'gale', text: 'Blue Level-4 Gale Warning 大风预警', time: '13:00 - 17:00' },
      '05-27': { type: 'curtail', text: '输变电停运协同', time: '0:00 - 24:00', tag: '建议停机' },
    },
  };

  // 每设备每天的气象禁排时间
  function weatherForbid(deviceId, date) {
    const banner = (deviceBanners[deviceId] || {})[date];
    if (banner && banner.type === 'gale') return '气象禁排 13:00-17:00（大风）';
    return null;
  }

  // 小时级损失收益数据（热力图/折线图用），6:00-18:00
  function hourlyLoss(deviceId, date) {
    const arr = [];
    const key = deviceId + date;
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 17 + key.charCodeAt(i)) % 997;
    for (let hour = 6; hour <= 18; hour++) {
      const base = ((h + hour * 53) % 100); // 0-99
      const loss = 50 + base * 6; // 50 ~ 644
      let type = 'suggest';
      if (base > 75) type = 'forbid';
      else if (base > 45) type = 'extend';
      arr.push({
        hour,
        label: `${hour}:00-${hour + 1}:00`,
        loss,
        power: (1.0 + (base % 25) / 10).toFixed(1), // 预测电量 MW
        price: (0.35 + (base % 30) / 100).toFixed(2), // 电价 元/kWh
        type,
      });
    }
    return arr;
  }

  return {
    farms, persons, devices, workorders, weekDates, slotDefs,
    farmCurtail, deviceBanners, slotType, weatherForbid, hourlyLoss,
    personById: (id) => persons.find((p) => p.id === id),
    deviceById: (id) => devices.find((d) => d.id === id),
    farmById: (id) => farms.find((f) => f.id === id),
    woById: (id) => workorders.find((w) => w.id === id),
  };
})();
// @AI_GENERATED: end
