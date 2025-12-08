let config = null;
let selectedData = null;

async function loadConfig() {
    const res = await fetch("config.json");
    config = await res.json();

    // 填充头
    config.head.forEach(v => {
        headSelect.innerHTML += `<option value="${v.id}">${v.id}</option>`;
    });

    // 填充甲
    config.armor.forEach(v => {
        armorSelect.innerHTML += `<option value="${v.id}">${v.id}</option>`;
    });
}

loadConfig();

// 选择头或甲
headSelect.onchange = function () {
    armorSelect.value = "";
    selectedData = config.head.find(v => v.id == this.value);
    calc();
};

armorSelect.onchange = function () {
    headSelect.value = "";
    selectedData = config.armor.find(v => v.id == this.value);
    calc();
};

// 输入触发计算
cur.oninput = max.oninput = calc;

function calc() {
    if (!selectedData) return;
    if (!cur.value || !max.value) return;

    const curVal = parseFloat(cur.value);
    const maxVal = parseFloat(max.value);
    const init = selectedData.init;

    // a = 当前耐久上限 - 当前耐久
    const a = maxVal - curVal;

    // b = a / 当前耐久上限
    const b = a / maxVal;

    // c = 当前耐久上限 / 初始上限
    const c = maxVal / init;

    // d = ln(c)/ln(10)
    const d = Math.log(c) / Math.log(10);

    // e = 当前耐久上限 − 当前耐久上限 × b × (维修损耗 − d)
    const e = maxVal - maxVal * b * (selectedData.loss - d);

    const finalMax = Number(e.toFixed(1));
    resultMax.innerText = finalMax;

    // 可出售判断
    if (finalMax >= selectedData.sell)
        check1.innerText = "可出售";
    else
        check1.innerText = "不可出售";

    const diff = finalMax - curVal;

    c1.innerText = (diff / selectedData.m1).toFixed(1);
    c2.innerText = (diff / selectedData.m2).toFixed(1);
    c3.innerText = (diff / selectedData.m3).toFixed(1);
    c4.innerText = (diff / selectedData.m4).toFixed(1);
}
