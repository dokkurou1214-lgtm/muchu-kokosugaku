/* 夢中になる高校数学 v1 - 全問題は(a, h, k)から式・解答・解説を生成 */
(function () {
  'use strict';

  const SPECS = [
    [1,  2, -1], [1, -3,  2], [1,  4,  3], [1, -2, -4],
    [1,  1, -5], [1, -4,  1], [1,  3, -2], [1, -1,  4],
    [-1, 2,  3], [-1, -3, -2], [-1, 1, -4], [-1, -2, 5],
    [1,  5,  1], [1, -5, -3], [-1, 3,  2], [-1, -4, -1],
    [1,  2,  6], [1, -2, -6], [-1, 4,  3], [-1, -1, -5],
    [2,  1, -3], [2, -2,  4], [-2, 2,  1], [-2, -1, -3],
    [3,  1,  2], [3, -2, -1], [-3, 1,  4], [-3, -1, -2],
    [2,  3, -2], [-2, -2,  3], [3,  2, -4], [-3, -2,  1]
  ];

  const numberSign = (n) => n < 0 ? '−' : '+';
  const signedNum = (n) => n < 0 ? `−${Math.abs(n)}` : `+${n}`;
  const polyTerm = (n, suffix) => n === 0 ? '' : `${n < 0 ? '−' : '+'}${Math.abs(n) === 1 && suffix ? '' : Math.abs(n)}${suffix}`;

  function poly(a, b, c) {
    const first = a === 1 ? 'x²' : (a === -1 ? '−x²' : `${a < 0 ? '−' : ''}${Math.abs(a)}x²`);
    return first + polyTerm(b, 'x') + (c === 0 ? '' : signedNum(c));
  }

  function bracket(h) { return `(x${signedNum(-h)})`; }

  function completed(a, h, k) {
    const coef = a === 1 ? '' : a === -1 ? '−' : String(a).replace('-', '−');
    return `${coef}${bracket(h)}²${k === 0 ? '' : signedNum(k)}`;
  }

  function vertex(h, k) { return `(${h < 0 ? '−' + Math.abs(h) : h}, ${k < 0 ? '−' + Math.abs(k) : k})`; }

  const questions = SPECS.map(([a, h, k], i) => {
    const b = -2 * a * h;
    const c = a * h * h + k;
    const choicesRaw = [[h, k], [-h, k], [h, -k], [-h, -k], [h, k+a], [-h, k+a]];
    const uniq = [], seen = new Set();
    choicesRaw.forEach(pair => {
      const key = pair.join(',');
      if (!seen.has(key)) { uniq.push(pair); seen.add(key); }
    });
    const firstFour = uniq.slice(0, 4);
    const correctOriginal = firstFour.findIndex(([x,y]) => x === h && y === k);
    const pivot = (i * 3 + 1) % 4;
    const shuffled = firstFour.slice(pivot).concat(firstFour.slice(0,pivot));
    const correctIndex = shuffled.findIndex(([x,y]) => x === h && y === k);
    if (firstFour.length !== 4 || correctIndex < 0 || correctOriginal !== 0) {
      throw Error(`問題${i + 1}の選択肢生成に失敗`);
    }
    const complete = completed(a, h, k);
    const innerCoef = -2 * h;
    const inner = `x²${polyTerm(innerCoef, 'x')}`;
    const cSigned = c === 0 ? '' : signedNum(c);
    return Object.freeze({
      id: `SQ-${String(i + 1).padStart(3,'0')}`,
      unit: '平方完成・頂点',
      level: Math.abs(a) === 1 ? 'basic' : 'standard',
      a, b, c, h, k,
      expression: poly(a, b, c),
      completed: complete,
      prompt: `y = ${poly(a, b, c)} の頂点の座標は？`,
      options: shuffled.map(([x,y]) => vertex(x,y)),
      answer: correctIndex,
      steps: [
        `x² の係数 ${a < 0 ? '−' + Math.abs(a) : a} でくくる： y = ${a < 0 ? '−' + Math.abs(a) : a}(${inner})${cSigned}`,
        `かっこの中を平方にする： x²${polyTerm(innerCoef, 'x')} = ${bracket(h)}²−${h * h}`,
        `整理すると y = ${complete}。`,
        `頂点は ${vertex(h,k)}。かっこの中が 0 になる x = ${h < 0 ? '−' + Math.abs(h) : h}、そのとき y = ${k < 0 ? '−' + Math.abs(k) : k}。`
      ],
      tip: a > 0 ? '上に開く放物線なので、頂点の y 座標は最小値です。' : '下に開く放物線なので、頂点の y 座標は最大値です。'
    });
  });

  // 公開する問題一覧は固定し、並び順・正答位置をバージョン内で維持する
  window.MATH_QUESTIONS = Object.freeze(questions);
  window.MATH_UTILS = Object.freeze({poly, completed, vertex});
})();
