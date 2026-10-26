/* 数学Ⅰ：2次関数の最大・最小。旧SQ問題IDを変更せず、追加のみ行う。 */
(function () {
  'use strict';
  const {poly, completed} = window.MATH_UTILS;
  const format = n => n < 0 ? `−${Math.abs(n)}` : String(n);
  const SPECS_FREE = [
    [1, 2, -1], [-1, -3, 2], [1, -1, 3], [-1, 1, -2],
    [2, -2, 4], [-2, 3, 1], [1, 0, -3], [-1, 0, 4],
    [2, 1, 0], [-2, -1, -1], [1, -3, 2], [-1, 2, -3]
  ];
  // 各組から「最大値」と「最小値」の2問を生成。頂点の内側・左・右・端点を含む。
  const SPECS_DOMAIN = [
    [1, 0, -2, -3, 2], [1, 2, 1, -1, 4],
    [-1, 1, 3, -2, 3], [-1, -2, 2, -4, 2],
    [2, 1, -3, -2, 2], [-2, -1, 4, -3, 2],
    [1, -1, 2, -2, 3], [-1, 2, -1, 0, 4],
    [1, -3, 1, -2, 2], [-1, -2, 3, -1, 3],
    [2, -2, -1, 0, 4], [-2, -3, 2, -2, 1],
    [1, 3, -2, -2, 2], [-1, 4, 1, -1, 3],
    [2, 1, 0, 1, 4], [-2, -2, 1, -4, -2]
  ];
  const f = (a,h,k,x) => a * (x-h)*(x-h) + k;
  function chooseOptions(correct, distractors, serial) {
    const values = [correct], seen = new Set([correct]);
    const candidates = [...distractors, correct+1, correct-1, correct+2, correct-2, -correct, correct+3, correct-3];
    for (const n of candidates) {
      if (Number.isInteger(n) && !seen.has(n)) {
        values.push(n); seen.add(n);
        if (values.length === 4) break;
      }
    }
    if (values.length !== 4) throw Error('選択肢不足');
    const shift = (serial * 3 + 1) % 4;
    const rotated = values.slice(shift).concat(values.slice(0,shift));
    return {options:rotated.map(format), answer:rotated.indexOf(correct)};
  }
  const result = [];
  SPECS_FREE.forEach(([a,h,k], i) => {
    const b = -2*a*h, c = a*h*h+k;
    const kind = a>0 ? '最小値' : '最大値';
    const answer = chooseOptions(k, [-k, h, c, k+a, k-a], result.length);
    result.push(Object.freeze({
      id:`EX-${String(i+1).padStart(3,'0')}`, unit:'最大・最小', unitId:'EX', level:'basic',
      a,b,c,h,k, expression:poly(a,b,c), completed:completed(a,h,k),
      prompt:`y = ${poly(a,b,c)}（x はすべての実数）の${kind}は？`,
      ...answer,
      steps:[
        `平方完成すると y = ${completed(a,h,k)}。`,
        `2乗の部分は必ず0以上です。頂点のx座標は ${format(h)}。`,
        `x = ${format(h)} のとき y = ${format(k)}。したがって${kind}は ${format(k)}。`
      ],
      tip:a>0 ? '上に開くため最小値はありますが、最大値はありません。' : '下に開くため最大値はありますが、最小値はありません。'
    }));
  });
  SPECS_DOMAIN.forEach(([a,h,k,L,R], idx) => {
    const b = -2*a*h, c = a*h*h+k;
    const candidates = [[L,f(a,h,k,L)],[R,f(a,h,k,R)]];
    if (L<=h && h<=R) candidates.push([h,k]);
    for (const type of ['max','min']) {
      const value = type === 'max' ? Math.max(...candidates.map(p=>p[1])) : Math.min(...candidates.map(p=>p[1]));
      const kind = type === 'max' ? '最大値' : '最小値';
      const attained = candidates.filter(p=>p[1]===value).map(p=>p[0]);
      const at = [...new Set(attained)].map(format).join('、');
      const checks = [`端点 x = ${format(L)} では y = ${format(f(a,h,k,L))}。`, `端点 x = ${format(R)} では y = ${format(f(a,h,k,R))}。`];
      if (L<=h && h<=R) checks.push(`頂点 x = ${format(h)} は定義域内にあり、y = ${format(k)}。`);
      else checks.push(`頂点 x = ${format(h)} は定義域の外なので、端点の値だけを比較します。`);
      const answer = chooseOptions(value, [k, f(a,h,k,L), f(a,h,k,R), -value, f(a,h,k,L)+1], result.length);
      result.push(Object.freeze({
        id:`EX-${String(result.length+1).padStart(3,'0')}`, unit:'最大・最小', unitId:'EX', level:'standard',
        a,b,c,h,k,L,R, type, expression:poly(a,b,c), completed:completed(a,h,k),
        prompt:`y = ${poly(a,b,c)}（${format(L)} ≦ x ≦ ${format(R)}）の${kind}は？`,
        ...answer,
        steps:[`平方完成すると y = ${completed(a,h,k)}。`, ...checks, `比較すると${kind}は ${format(value)}（x = ${at} のとき）。`],
        tip:'定義域があるときは、両端の値と、定義域内に頂点がある場合は頂点の値を比較します。'
      }));
    }
  });
  if (result.length !== 44 || result.some(q=>q.options.length !== 4 || q.answer < 0)) throw Error('最大・最小の問題生成に失敗');
  window.MATH_QUESTIONS = Object.freeze([...window.MATH_QUESTIONS, ...result]);
})();
