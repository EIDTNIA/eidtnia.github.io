console.log('----- calc.js 开始执行 -----');

let CONFIG = {};
const MODE = document.querySelectorAll('[name="mode"]');
const KIND = document.querySelectorAll('[name="kind"]');
const PICK = document.getElementById('pick');
const PARAMS = document.getElementById('params');
const RESULT = document.getElementById('result');
const ERR = document.getElementById('err');

fetch('config.json')
  .then(r => r.json())
  .then(j => { CONFIG = j; fillSelect(); })
  .catch(err => showErr('加载配置失败：' + err));

MODE.forEach(r => r.onchange = () => { fillSelect(); autoCalc(); });
KIND.forEach(r => r.onchange = () => { fillSelect(); autoCalc(); });
PICK.onchange = () => { showParams(); autoCalc(); };
['cur', 'rem'].forEach(id =>
  document.getElementById(id).addEventListener('input', autoCalc)
);

function fillSelect() {
  const k = [...KIND].find(r => r.checked).value;
  PICK.innerHTML = '';
  CONFIG[k].forEach((it, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = it.name;
    // ↓↓↓ 关键：直接从 json 读取 color 字段 ↓↓↓
    opt.style.color = it.color;          // 文字颜色
    opt.style.backgroundColor = it.color === 'red'   ? '#ffeeee' :
                                it.color === 'gold'  ? '#fff9e5' :
                                it.color === 'purple'? '#f5eeff' :
                                                       '#eef5ff';
    PICK.appendChild(opt);
  });
  showParams();
}

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
}

function autoCalc() {
  const curEl = document.getElementById('cur');
  const remEl = document.getElementById('rem');
  const cur = parseFloat(curEl.value);
  const rem = parseFloat(remEl.value);
  if (isNaN(cur) || isNaN(rem) || cur <= 0 || rem < 0) {
    showErr('请输入有效的当前上限与剩余耐久');
    return;
  }
  clearErr();
  calc();
}

function showErr(msg) {
  ERR.textContent = msg;
  ERR.classList.remove('hidden');
  RESULT.classList.add('hidden');
}
function clearErr() {
  ERR.classList.add('hidden');
}

function calc() {
  const mode = [...MODE].find(r => r.checked).value;
  const k = [...KIND].find(r => r.checked).value;
  const idx = PICK.value;
  const it = CONFIG[k][idx];

  const cur = Math.round(parseFloat(document.getElementById('cur').value) * 10) / 10;
  const rem = Math.round(parseFloat(document.getElementById('rem').value) * 10) / 10;

  if (mode === 'out') {
    const floor = k === 'head' ? 5 : 10;
    if (Math.floor(cur) < floor) {
      document.getElementById('can-repair').textContent =
        `当前${k === 'head' ? '头盔' : '护甲'}上限（${Math.floor(cur)}）低于${floor}，不可维修`;
      RESULT.classList.remove('hidden');
      return;
    }
  }

  const ratio = (cur - rem) / cur;
  const logTerm = Math.log10(cur / it.init);
  const loss = it.loss;
  let after = cur - cur * ratio * (loss - logTerm);

  if (mode === 'out') {
    after = Math.floor(after);
    if (after < 1) after = 1;
  } else {
    after = Math.round(after * 10) / 10;
  }

  const delta = after - rem;
  const packs = [
    { name: '自制', eff: it.m1 },
    { name: '标准', eff: it.m2 },
    { name: '精密', eff: it.m3 },
    { name: '高级', eff: it.m4 }
  ];
  const listHtml = packs.map(p => {
    if (delta <= 0) return `<li>${p.name}：无需维修</li>`;
    if (p.eff <= 0) return `<li>${p.name}：无效效率</li>`;
    const pts = Math.round(delta / p.eff);
    return `<li>${p.name}：${pts} 点</li>`;
  }).join('');

  const canSell = after >= it.sell ? '可以出售' : '不可出售';

  document.getElementById('can-repair').textContent = '装备可以维修';
  document.getElementById('after').textContent = `维修后耐久上限：${after}`;
  document.getElementById('can-sell').textContent = `出售状态：${canSell}`;
  document.getElementById('points').innerHTML = listHtml;
  RESULT.classList.remove('hidden');
}


