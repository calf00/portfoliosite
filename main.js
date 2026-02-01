    /* =========================================================
      直感的な説明（初心者向け）
      - スクロールで“見えた要素”に .in を付ける → ふわっと出る
      - data-parallax を付けた要素をスクロール量に応じてズラす → パララックス
      - カルーセルは track を横にスクロールさせる（ボタンで位置を変える）
    ========================================================= */

    // 年号
    document.getElementById('y').textContent = new Date().getFullYear();

    // 1) スクロール出現（IntersectionObserver：見えた瞬間を検知する仕組み）
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in');
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // 2) パララックス（スクロールに合わせて translateY をちょい足し）
    const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function onScroll(){
      if (prefersReduce) return;

      const y = window.scrollY || 0;
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax || "0.2");
        // “スクロール量 × 速度” だけズラす（ズレすぎ防止で少し丸める）
        const offset = Math.round(y * speed * 0.12);
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();

    // 3) カルーセル（横スクロール：次のスライド位置へ移動）
    const track = document.querySelector('[data-track]');
    const prevBtn = document.querySelector('[data-prev]');
    const nextBtn = document.querySelector('[data-next]');

    function slideBy(dir){
      const slides = track.querySelectorAll('.slide');
      if (!slides.length) return;

      // “今の見えている位置”に近いスライドを探して、そこから±1へ
      const left = track.scrollLeft;
      let idx = 0, best = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs(s.offsetLeft - left);
        if (d < best){ best = d; idx = i; }
      });

      const next = Math.max(0, Math.min(slides.length - 1, idx + dir));
      track.scrollTo({ left: slides[next].offsetLeft, behavior:'smooth' });
    }

    prevBtn?.addEventListener('click', () => slideBy(-1));
    nextBtn?.addEventListener('click', () => slideBy( 1));

    // 自動送り（触っている間は止める）
    let auto = null;
    function startAuto(){
      if (prefersReduce) return;
      stopAuto();
      auto = setInterval(() => slideBy(1), 5200);
    }
    function stopAuto(){
      if (auto) clearInterval(auto);
      auto = null;
    }
    track?.addEventListener('mouseenter', stopAuto);
    track?.addEventListener('mouseleave', startAuto);
    track?.addEventListener('touchstart', stopAuto, { passive:true });
    track?.addEventListener('touchend', startAuto, { passive:true });

    // “最後まで行ったら先頭へ戻る”をゆるく実現（端に到達したらワープ）
    track?.addEventListener('scroll', () => {
      if (!track) return;
      const nearEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 6;
      if (nearEnd){
        // ちょい待ってから先頭に戻す（急すぎると不自然）
        setTimeout(() => track.scrollTo({ left: 0, behavior:'smooth' }), 450);
      }
    });

    startAuto();

/* =========================================================
  Split / Dicer Background FX（スクロール量で“割って開く”）
  感覚：
  - スクロールが進むほど、上の幕は上へ、下の幕は下へズレる
  - 中央の刃は少し“追従”して、光が強くなる
  - 0〜maxSplit の範囲で自然に止まる（開き過ぎ防止）
========================================================= */

(() => {
  const fx = document.querySelector('.splitfx');
  if (!fx) return;

  const topHalf = fx.querySelector('.splitfx-half.top');
  const bottomHalf = fx.querySelector('.splitfx-half.bottom');
  const blade = fx.querySelector('.splitfx-blade');

  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduce) return;

  // 開き具合（px）。大きくすると派手になる（例：220〜360）
  const maxSplit = 300;

  // どのスクロール範囲で開くか（px）。小さいほど早く開く（例：600〜1100）
  const travel = 900;

  // スクロール量を 0〜1 に正規化して、なめらかに変形（ease）
  const ease = (t) => 1 - Math.pow(1 - t, 3); // cubic-out（最後ゆっくり）

  let raf = 0;

  function update(){
    raf = 0;

    const y = window.scrollY || 0;

    // 0〜1 に収める（範囲外は止まる）
    const raw = Math.min(1, Math.max(0, y / travel));
    const t = ease(raw);

    // 上下に割る（上はマイナス、下はプラス）
    const split = Math.round(maxSplit * t);

    topHalf.style.transform = `translate3d(0, ${-split}px, 0)`;
    bottomHalf.style.transform = `translate3d(0, ${split}px, 0)`;

    // 刃は少しだけ追従（割れ目が“切ってる”感じ）
    const bladeShift = Math.round(split * 0.18);
    blade.style.transform = `translate3d(0, ${bladeShift}px, 0)`;

    // 光の強さ（開くほど存在感アップ）
    blade.style.opacity = (0.25 + 0.75 * t).toFixed(3);

    // ついでに“割れ目周辺の空気感”として、ほんのり影を足す
    // （上面/下面に境界の陰影を付ける）
    topHalf.style.filter = `drop-shadow(0 ${Math.round(8*t)}px ${Math.round(18*t)}px rgba(31,35,40,${(0.10*t).toFixed(3)}))`;
    bottomHalf.style.filter = `drop-shadow(0 ${Math.round(-8*t)}px ${Math.round(18*t)}px rgba(31,35,40,${(0.10*t).toFixed(3)}))`;
  }

  function onScroll(){
    if (raf) return;
    raf = requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  update();
})();

