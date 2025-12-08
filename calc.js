let CONFIG = {};          // 存放读取的 json
const MODE = document.querySelectorAll('[name="mode"]');
const KIND = document.querySelectorAll('[name="kind"]');
const PICK = document.getElementById('pick');
const PARAMS = document.getElementById('params');
const RESULT = document.getElementById('result');

// 初始拉取配置
fetch('config.json')
  .then(r => r.json())
  .then(j => { CONFIG = j; fillSelect(); })
  .catch(err => alert('加载配置失败：' + err));

// 事件绑定
MODE.forEach(r => r.onchange = fillSelect));
KIND.forEach(r => r.onchange = fillSelect));
PICK.onchange = showParams;
document.getElementById('calc').onclick = calc;

// 填充下拉
function fillSelect() {
  const k = [...KIND].find(r => r.checked).value;
  PICK.innerHTML = '';
  CONFIG[k].forEach((it, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = it.name;
    PICK.appendChild(opt);
  });
  showParams();
}

// 显示参数
function showParams() {
  const k = [...KIND].find(r => r.checked).value;
  const idx = PICK.value;
  const it = CONFIG[k][idx];
  document.getElementById('init').textContent = it.init;
  document.getElementById('sell').textContent = it.sell;
  document.getElementById('loss').textContent = it.loss.toFixed(2);
  ['m1', 'm2', 'm3', 'm4'].forEach((m, i) =>
    document.getElementById(m).textContent = it[m].toFixed(2)
  );
  PARAMS.classList.remove('hidden');
  RESULT.classList.add('hidden');
}

// 计算
function calc() {
  const mode = [...MODE].find(r => r.checked).value;
  const k = [...KIND].find(r => r.checked).value;
  const idx = PICK.value;
  const it = CONFIG[k][idx];

  const cur = Math.round(parseFloat(document.getElementById('cur').value) * 10) / 10;
  const rem = Math.round(parseFloat(document.getElementById('rem').value) * 10) / 10;

  if (isNaN(cur) || isNaN(rem) || cur <= 0 || rem < 0) {
    alert('请输入有效的当前上限与剩余耐久'); return;
  }

  // 局外门槛判定
  if (mode === 'out') {
    const floor = k === 'head' ? 5 : 10;
    if (Math.floor(cur) < floor) {
      document.getElementById('can-repair').textContent =
        `当前${k === 'head' ? '头盔' : '护甲'}上限（${Math.floor(cur)}）低于${floor}，不可维修`;
      RESULT.classList.remove('hidden');
      return;
    }
  }

  // 公共公式组件
  const ratio = (cur - rem) / cur;
  const logTerm = Math.log10(cur / it.init);
  const loss = it.loss;
  let after = cur - cur * ratio * (loss - logTerm);

  // 局外：去尾取整，<1 强制 1
  if (mode === 'out') {
    after = Math.floor(after);
    if (after < 1) after = 1;
  } else {
    // 局内：四舍五入到 1 位小数
    after = Math.round(after * 10) / 10;
  }

  // 维修包点数
  const delta = after - rem;
  const packs = [
    { name: '自制', eff: it.m1 },
    { name: '标准', eff: it.m2 },
    { name: '精密', eff: it.m3 },
    { name: '高级组合', eff: it.m4 }
  ];
  const listHtml = packs.map(p => {
    if (delta <= 0) return `<li>${p.name}：无需维修</li>`;
    if (p.eff <= 0) return `<li>${p.name}：无效效率</li>`;
    const pts = Math.round(delta / p.eff);
    return `<li>${p.name}：${pts} 点</li>`;
  }).join('');

  // 是否可出售
  const canSell = after >= it.sell ? '可以出售' : '不可出售';

  // 输出
  document.getElementById('can-repair').textContent = '装备可以维修';
  document.getElementById('after').textContent = `维修后耐久上限：${after}`;
  document.getElementById('can-sell').textContent = `出售状态：${canSell}`;
  document.getElementById('points').innerHTML = listHtml;
  RESULT.classList.remove('hidden');
}