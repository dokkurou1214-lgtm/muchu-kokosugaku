/* 数学Ⅰ：判別式とx軸との共有点。既存SQ/EXは変更せず追加する。 */
(function () {
  'use strict';
  const poly = window.MATH_UTILS.poly;
  const fmt = n => n < 0 ? `−${Math.abs(n)}` : String(n);
  const signed = n => n === 0 ? '' : n < 0 ? `−${Math.abs(n)}` : `+${n}`;
  const cmp = ['2個（異なる2点で交わる）', '1個（接する）', '0個（交わらない）'];
  const SPEC_NUM = [
    [1,1,-3],  [1,2,0],     [1,-1,2],
    [1,-2,-4], [-1,-3,0],   [1,2,1],
    [2,3,-1],  [2,1,0],     [-1,3,-3],
    [-1,2,2],  [-2,2,0],    [-2,-2,-1],
    [-2,-1,3], [3,-1,0],    [2,0,2],
    [3,-1,-2], [-3,-2,0],   [-3,1,-2],
    [-3,2,1],  [1,0,0],     [3,-1,3],
    [1,4,-2],  [-1,1,0],    [-1,0,-4]
  ];
  // [a, h, c0, query]  y = a(x-h)^2 + (m+c0 - a*h*h)
  // このため b = -2ah, c = m + c0 と書け、D = -4a(m - (a*h*h-c0))。
  const SPEC_PARAM = [
    [1, 1, 1, 0], [1,-2, 0, 1], [1, 3,-2, 2],
    [-1,1, 2, 2], [-1,-2,3, 0], [-1,3,-1, 1],
    [2,-1,-2, 1], [2,2, 1, 2], [2,0,-3, 0],
    [-2,1,0, 0], [-2,-2,2, 1], [-2,0,-1, 2],
    [1,0,4, 0], [1,-1,-4, 2], [1,2,5, 1],
    [-1,0,3, 1], [-1,2,0, 2], [-1,-3,-2,0],
    [2,1,4, 2], [2,-2,-1,0], [2,3,-3, 1],
    [-2,3,2,1], [-2,-1,-2,2], [-2,2,-4,0]
  ];
  function rotate(arr, index) {
    const shift = (index * 3 + 1) % 4;
    return arr.slice(shift).concat(arr.slice(0,shift));
  }
  const questions = [];
  SPEC_NUM.forEach(([a,h,k],i) => {
    const b = -2*a*h;
    const c = a*h*h+k;
    const D = b*b - 4*a*c;
    const count = D > 0 ? 2 : D === 0 ? 1 : 0;
    const correct = count === 2 ? cmp[0] : count === 1 ? cmp[1] : cmp[2];
    const options = rotate([...cmp, '判別式だけでは決まらない'], i);
    const answer = options.indexOf(correct);
    questions.push(Object.freeze({
      id:`DI-${String(i+1).padStart(3,'0')}`, unit:'判別式・共有点', unitId:'DI', level:'basic',
      a,b,c,h,k,D,count, expression:poly(a,b,c),
      prompt:`y = ${poly(a,b,c)} のグラフとx軸の共有点は何個？`,
      options, answer,
      steps:[
        `a = ${fmt(a)}、b = ${fmt(b)}、c = ${fmt(c)} とおきます。`,
        `判別式 D = b² − 4ac = (${fmt(b)})² − 4 × (${fmt(a)}) × (${fmt(c)}) = ${fmt(D)}。`,
        D>0 ? 'D > 0 なので、x軸と異なる2点で交わります。' : D===0 ? 'D = 0 なので、x軸と1点で接します。' : 'D < 0 なので、x軸とは交わりません。',
        `したがって共有点は${count}個です。`
      ],
      tip:'二次方程式 ax²+bx+c=0 の実数解の個数と、グラフのx軸との共有点の個数は同じです。'
    }));
  });
  SPEC_PARAM.forEach(([a,h,c0,query],i) => {
    const b = -2*a*h;
    const t = a*h*h - c0;
    const form = `${poly(a,b,0)}+m${signed(c0)}`;
    // query=0は2点、1は接する、2は交わらない
    const slope = -4*a;
    const op = query===1 ? '=' : query===0 ? (slope>0 ? '>' : '<') : (slope>0 ? '<' : '>');
    const correct = `m ${op} ${fmt(t)}`;
    const options = rotate([`m < ${fmt(t)}`,`m = ${fmt(t)}`,`m > ${fmt(t)}`,`m ≦ ${fmt(t)}`],i+24);
    const answer = options.indexOf(correct);
    if (answer < 0) throw Error('正答生成失敗: '+i);
    const target = query===0?'異なる2点で交わる':query===1?'1点で接する':'交わらない';
    const condition = query===0 ? 'D > 0' : query===1 ? 'D = 0' : 'D < 0';
    questions.push(Object.freeze({
      id:`DI-${String(i+25).padStart(3,'0')}`, unit:'判別式・共有点', unitId:'DI', level:'standard',
      a,b,c0,t,query,slope,operator:op, expression:form,
      prompt:`y = ${form}（m は実数）がx軸と${target}ための条件は？`,
      options,answer,
      steps:[
        `a = ${fmt(a)}、b = ${fmt(b)}、c = m${signed(c0)} です。`,
        `D = b² − 4ac = (${fmt(b)})² − 4 × (${fmt(a)}) × (m${signed(c0)})。`,
        `整理すると D = ${fmt(slope)} × (m${signed(-t)})。`,
        `x軸と${target}条件は ${condition}。これを解くと ${correct}。`
      ],
      tip:query===1 ? '接する条件は D = 0 です。不等号ではなく等号で解きます。' : slope<0 ? '負の数で不等式の両辺を割ると、不等号の向きが逆になります。' : '不等式はDの係数の符号に注意して解きましょう。'
    }));
  });
  if (questions.length !== 48 || questions.some(q=>q.options.length!==4 || new Set(q.options).size!==4 || q.answer<0 || q.answer>3 || q.options[q.answer]===undefined)) {
    throw Error('判別式の問題生成に失敗');
  }
  window.MATH_QUESTIONS = Object.freeze([...window.MATH_QUESTIONS, ...questions]);
})();
