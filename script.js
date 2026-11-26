(() => {
  const works = window.WORKS || [];
  const profile = window.PROFILE || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const archive = $("#archive");
  const detail = $("#detail");
  const about = $("#about");
  const cursor = $(".cursor");
  // 카테고리 (works.js의 type 값)
  const TYPE_LABEL = { video: "Video", image: "Image", aesthetic: "Aesthetic", photo: "Photo", design: "Design" };
  // 상세 화면 형태: 폴더 위치로 결정 (ai work/Image/… = 이미지 폼, 그 외 = 영상 폼)
  const isVideoForm = (w) => (w.form ? w.form === "video" : w.type === "video");

  const state = {
    view: localStorage.getItem("view") === "gallery" ? "gallery" : "grid", // Grid / Gallery (List는 없앰)
    filter: "all",
    current: -1, // index in visible list
  };

  const visible = () =>
    state.filter === "all" ? works : works.filter((w) => w.type === state.filter);

  // 시드 기반 난수 — 새로고침해도 같은 배치를 유지
  const rand = (seed) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // 툴 목록 → "아이콘 이름 아이콘 이름" (공백으로 구분, 아이콘은 works.js의 TOOL_ICONS)
  const toolsHTML = (tools = [], end = "") =>
    tools
      .map((t) => {
        const ico = (window.TOOL_ICONS || {})[t];
        return `<span class="tool">${ico ? `<img class="tool-ico" src="${encodeURI(ico)}" alt="" />` : ""}${esc(t)}</span>`;
      })
      .join(" ") + (tools.length ? end : "");

  /* ---------- 렌더 ---------- */
  // 썸네일 이미지가 없으면 영상의 앞 장면을 썸네일로 사용
  const thumbMedia = (w) =>
    w.thumb
      ? `<img src="${w.thumb}" alt="" loading="lazy" decoding="async" />`
      : w.video
        ? `<video src="${w.video}#t=0.5" muted loop playsinline preload="metadata" aria-hidden="true" tabindex="-1"></video>`
        : "";

  function card(w) {
    return `
      <button class="work" type="button" data-no="${w.no}" aria-label="${esc(w.title)}, ${TYPE_LABEL[w.type]} ${w.year} — 자세히 보기">
        <span class="work-frame">
          ${thumbMedia(w)}
          ${isVideoForm(w) ? '<span class="badge">Video</span>' : ""}
          <span class="work-title" aria-hidden="true"><span>${esc(w.title)}</span></span>
        </span>
      </button>`;
  }

  // 썸네일 가운데 제목: 좌우 폭에 꽉 차도록 글자 크기를 맞춤 (한 줄)
  function fitTitles() {
    $$(".work-title", archive).forEach((box) => {
      const t = box.firstElementChild;
      const cs = getComputedStyle(box);
      const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); // 안쪽 여백 제외
      if (avail <= 0) return;
      t.style.fontSize = "100px";
      const wNow = t.offsetWidth || 1; // offsetWidth는 확대·축소 애니메이션 중에도 실제 크기
      const size = Math.min((100 * avail) / wNow, box.clientHeight * 0.6); // 짧은 제목은 높이 기준으로 제한
      t.style.fontSize = `${size.toFixed(2)}px`;
    });
  }

  /* ---------- Gallery: 아래로 스크롤하는 전시 ----------
   * 작품마다 큰 이미지 + 옆에 제목·툴·인트로 설명 (좌우 번갈아 배치) */
  function exItem(w, i) {
    const n = String(i + 1).padStart(2, "0");
    const lines = String(w.intro || w.desc || "").split("\n").filter(Boolean);
    const txt = (html, k) => `<div class="ex-line" style="--i:${k}">${html}</div>`;
    let k = 0;
    return `
      <article class="ex-item" data-item="${w.no}">
        <button class="work g-card" type="button" data-no="${w.no}"
          aria-label="${esc(w.title)}, ${TYPE_LABEL[w.type]} ${w.year} — 자세히 보기">
          <span class="g-index" aria-hidden="true">${n}</span>
          <span class="work-frame">
            ${thumbMedia(w).replace(' loading="lazy"', "")}
            ${isVideoForm(w) ? '<span class="badge">Video</span>' : ""}
          </span>
        </button>
        <div class="ex-text">
          ${txt(`<p class="ex-k"><span>No.${w.no}</span><span>${TYPE_LABEL[w.type]}</span><span>${w.year}</span></p>`, k++)}
          ${txt(`<h2 class="ex-title">${esc(w.title)}</h2>`, k++)}
          ${(w.tools || []).length ? txt(`<p class="ex-tools">${toolsHTML(w.tools)}</p>`, k++) : ""}
          ${lines.length ? txt(`<div class="ex-desc">${lines.map((s) => `<p>${esc(s)}</p>`).join("")}</div>`, k++) : ""}
          ${w.introNote ? txt(`<p class="ex-note">${esc(w.introNote)}</p>`, k++) : ""}
          ${txt(`<button class="ex-open" type="button" data-no="${w.no}">View project <span aria-hidden="true">→</span></button>`, k++)}
        </div>
      </article>`;
  }

  function exHTML(list) {
    const n = String(list.length).padStart(2, "0");
    return `
      <header class="ex-head">
        <div class="exh-top">
          <span>Archive Index</span>
          <span>AI Photo · Video · Design</span>
          <span>©${new Date().getFullYear()}</span>
        </div>
        <h2 class="exh-title"><em>Selected</em> Works<sup>(${n})</sup></h2>
        <div class="exh-bottom">
          <ol class="exh-list">
            ${list
              .map(
                (w, i) => `<li><button type="button" data-jump="${w.no}">
                  <span class="n">${String(i + 1).padStart(2, "0")}</span>
                  <span class="t">${esc(w.title)}</span>
                  <span class="c">${TYPE_LABEL[w.type]}</span>
                </button></li>`
              )
              .join("")}
          </ol>
          <p class="ri-hint">Scroll <span>↓</span></p>
        </div>
      </header>
      ${list.map(exItem).join("")}
      <footer class="ex-end" aria-hidden="true">
        <p class="exh-title"><em>End of</em> Archive<sup>(${n}/${n})</sup></p>
      </footer>
      <div class="rail-hud" aria-hidden="true">
        <span class="rh-count"><b>01</b> / ${n}</span>
        <span class="rh-bar"><i></i></span>
        <span class="rh-title"></span>
      </div>`;
  }

  function render() {
    const list = visible();
    archive.dataset.view = state.view;
    archive.style.height = "";
    syncScrollLock();
    scrollTo(0, 0);
    stopRail();

    if (!list.length) {
      archive.innerHTML = '<p class="empty">No works in this category yet</p>';
      return;
    }

    if (state.view === "gallery") {
      archive.innerHTML = exHTML(list);
      startRail();
    } else {
      archive.innerHTML = list.map(card).join("");
      $$(".work", archive).forEach((el, i) => (el.style.animationDelay = `${Math.min(i * 25, 500)}ms`));
      layoutGrid();
    }

    $$("img", archive).forEach((img) => {
      const done = () => img.classList.add("is-loaded");
      img.complete && img.naturalWidth ? done() : img.addEventListener("load", done, { once: true });
      img.addEventListener("error", () => (img.style.visibility = "hidden"), { once: true });
    });
    $$("video", archive).forEach((v) => {
      const done = () => v.classList.add("is-loaded");
      v.readyState >= 2 ? done() : v.addEventListener("loadeddata", done, { once: true });
    });
  }

  // 영상 썸네일: 마우스를 올리면 재생, 벗어나면 정지
  const canHoverPlay = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  archive.addEventListener("pointerover", (e) => {
    const v = e.target.closest(".work")?.querySelector("video");
    if (v && canHoverPlay && v.paused) v.play().catch(() => {});
  });
  archive.addEventListener("pointerout", (e) => {
    const card = e.target.closest(".work");
    if (!card || card.contains(e.relatedTarget)) return;
    const v = card.querySelector("video");
    if (v) { v.pause(); v.currentTime = 0.5; }
  });

  // 흩뿌린 그리드: 셀 안에서만 흔들어 겹치지 않게 배치
  function layoutGrid() {
    const items = $$(".work", archive);
    const count = items.length;
    const W = archive.clientWidth;
    // 스크롤 없이 한 화면에 모두 들어가도록: 남은 화면 높이 안에서 가장 크게 배치되는 열 수를 찾음
    const top = archive.getBoundingClientRect().top;
    const H = Math.max(240, innerHeight - top - 24);
    const CAP = 0; // 제목은 썸네일 안에 있어 위 캡션 자리가 없음
    let best = { cols: 1, size: 0 };
    for (let c = 1; c <= count; c++) {
      const rows = Math.ceil(count / c);
      const size = Math.min((W / c) * 0.72, (H / rows - CAP) * 0.82, 300);
      if (size > best.size) best = { cols: c, size };
    }
    const cols = best.cols;
    const rows = Math.ceil(count / cols);
    const cellW = W / cols;
    const cellH = H / rows;
    const base = Math.max(48, best.size / 1.1); // 아래 크기 변화(최대 1.1배)를 감안

    items.forEach((el, i) => {
      const no = Number(el.dataset.no);
      const size = base * (0.82 + rand(no) * 0.28);
      const col = i % cols;
      const r = Math.floor(i / cols);
      const x = col * cellW + rand(no + 7) * Math.max(0, cellW - size);
      const y = r * cellH + rand(no + 13) * Math.max(0, cellH - size - CAP);
      el.style.width = `${size}px`;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    });
    archive.style.height = `${H}px`;
    fitTitles();
    document.fonts?.ready.then(() => state.view === "grid" && fitTitles()); // 폰트를 다 불러온 뒤 다시 맞춤
  }

  // Grid는 한 화면 고정, Gallery는 아래로 스크롤
  const syncScrollLock = () => document.documentElement.classList.toggle("lock-scroll", state.view === "grid");

  /* ---------- Gallery 스크롤 움직임 ----------
   * 화면에 들어온 작품: 이미지가 열리듯 나타나고 글이 한 줄씩 올라옴
   * 스크롤 중에는 사진이 움직이지 않음 (멀미 방지)
   * 화면 가운데 온 작품만 컬러 + 번호 강조 / 하단에 현재 번호·진행 바·제목 */
  const rail = { raf: 0, items: [], io: null, y: 0, vel: 0 };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function measureRail() {} // 세로 스크롤은 따로 잴 것이 없음 (창 크기 변경 시 호출됨)

  function startRail() {
    rail.items = $$(".ex-item", archive);
    rail.y = scrollY;
    rail.vel = 0;
    rail.io?.disconnect();
    rail.io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")),
      { threshold: 0.15 }
    );
    $$(".ex-item, .ex-head, .ex-end", archive).forEach((el) => rail.io.observe(el));
    cancelAnimationFrame(rail.raf);
    rail.raf = requestAnimationFrame(tickRail);
  }
  function stopRail() {
    cancelAnimationFrame(rail.raf);
    rail.raf = 0;
    rail.items = [];
    rail.io?.disconnect();
    archive.style.removeProperty("--skew");
  }

  function tickRail() {
    if (state.view !== "gallery") return;
    const quick = reduceMotion();

    // 화면 가운데와 가장 가까운 작품 찾기 (컬러로 표시 · 하단 번호)
    const H = innerHeight;
    let near = -1, nearD = Infinity;
    rail.items.forEach((it, i) => {
      const r = it.getBoundingClientRect();
      if (r.bottom < -200 || r.top > H + 200) return;
      const p = clamp((r.top + r.height / 2 - H / 2) / H, -1.2, 1.2);
      if (Math.abs(p) < nearD) { nearD = Math.abs(p); near = i; }
    });
    const focused = nearD < 0.55 ? near : -1;
    rail.items.forEach((it, i) => it.classList.toggle("is-near", i === focused));

    const hud = $(".rail-hud", archive);
    if (hud) {
      hud.classList.toggle("is-on", focused >= 0);
      if (focused >= 0) {
        $(".rh-count b", hud).textContent = String(focused + 1).padStart(2, "0");
        const t = $(".ex-title", rail.items[focused])?.textContent || "";
        if ($(".rh-title", hud).textContent !== t) $(".rh-title", hud).textContent = t;
      }
      const max = document.documentElement.scrollHeight - H;
      $(".rh-bar i", hud).style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1) : 1})`;
    }

    rail.raf = requestAnimationFrame(tickRail);
  }

  /* ---------- 커스텀 커서 (사이트 전체) ----------
   * 작은 점(마우스 위치 그대로) + 링(부드럽게 따라옴)
   * - 버튼·링크 위: 링이 커짐
   * - 작품 위: 링이 채워지며 "View"
   * - 큰 사진 넘기기(상세 이미지) 위: "Next" / 커버 화면 위: "Open"
   * - 글자·사진 위 어디서든 보이도록 반전(difference) 색 */
  const fine = matchMedia("(pointer: fine)").matches;
  const cursorPos = { x: -100, y: -100, tx: -100, ty: -100 };
  if (cursor && fine) {
    document.documentElement.classList.add("has-cursor");
    const label = $(".cursor-label", cursor);
    const setState = (el) => {
      const t = el?.closest?.(".work, .g-card") ? "View"
        : el?.closest?.(".zoom-layer.is-cover") ? (el.closest(".cover-close") ? "" : "Open")
        : el?.closest?.(".detail.is-image .viewer img") ? "Next"
        : el?.closest?.(".detail:not(.is-image) .detail-gallery img") ? "View"
        : el?.closest?.(".lightbox") && !el.closest("button") ? "Close"
        : "";
      const link = !t && !!el?.closest?.("a, button, [role='button'], .notice, label");
      cursor.classList.toggle("is-label", !!t);
      cursor.classList.toggle("is-link", link);
      if (t) label.textContent = t;
    };
    window.addEventListener("pointermove", (e) => {
      cursorPos.tx = e.clientX;
      cursorPos.ty = e.clientY;
      cursor.classList.add("is-on");
      setState(e.target);
    }, { passive: true });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));
    window.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    window.addEventListener("pointerup", () => cursor.classList.remove("is-down"));
    // 스크롤로 다른 요소가 커서 밑을 지나가도 상태가 맞도록
    window.addEventListener("scroll", () => setState(document.elementFromPoint(cursorPos.tx, cursorPos.ty)), { passive: true });
    const dot = $(".cursor-dot", cursor), ring = $(".cursor-ring", cursor);
    const loop = () => {
      // 상세·About 창(dialog)은 맨 위 레이어라, 열려 있으면 커서를 그 안으로 옮겨야 위에 보임
      const host = document.querySelector("dialog[open]") || document.body;
      if (cursor.parentElement !== host) host.append(cursor);
      const k = reduceMotion() ? 1 : 0.18;
      cursorPos.x += (cursorPos.tx - cursorPos.x) * k;
      cursorPos.y += (cursorPos.ty - cursorPos.y) * k;
      dot.style.transform = `translate3d(${cursorPos.tx}px, ${cursorPos.ty}px, 0)`;
      ring.style.transform = `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function updateCounts() {
    $("#count").textContent = visible().length;
    $$(".filters button").forEach((b) => {
      const f = b.dataset.filter;
      $("sup", b).textContent = f === "all" ? works.length : works.filter((w) => w.type === f).length;
    });
  }

  /* ---------- 상세 ---------- */
  function openDetail(index, push = true) {
    const list = visible();
    const w = list[index];
    if (!w) return;
    state.current = index;

    $("#detail-no").textContent = `${w.no} / ${String(works.length).padStart(3, "0")}`;
    $("#detail-title").textContent = w.title;
    $("#detail-type").textContent = TYPE_LABEL[w.type];
    $("#detail-year").textContent = w.year;
    $("#detail-tools").innerHTML = toolsHTML(w.tools) || "—";
    $("#detail-desc").textContent = w.desc || "";
    $("#detail-prompt").textContent = w.prompt || "";
    $("#detail-prompt-wrap").hidden = !w.prompt;
    $("#detail-desc").hidden = !w.desc;

    const isVid = (s) => /\.(mp4|webm)$/i.test(s);
    const imageForm = !isVideoForm(w) && (w.gallery || []).length > 0;
    detail.classList.toggle("is-image", imageForm);
    const media = $("#detail-media");

    if (imageForm) {
      // 이미지 폼: 왼쪽 큰 이미지 + 오른쪽 썸네일 격자 (누르면 왼쪽이 바뀜)
      const total = w.gallery.length;
      $("#detail-gallery").innerHTML = w.gallery
        .map(
          (src, i) => `
          <button class="g-thumb" type="button" data-i="${i}" aria-label="${i + 1}번째 이미지 보기"${i === 0 ? ' aria-current="true"' : ""}>
            ${isVid(src) ? `<video src="${src}#t=0.3" muted playsinline preload="metadata" aria-hidden="true"></video>` : `<img src="${src}" alt="" loading="lazy" decoding="async" />`}
            <span class="g-no" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
          </button>`
        )
        .join("");
      media.classList.remove("has-more");
      media.innerHTML = `
        <div class="viewer"><div class="v-slide">${viewerItem(w, 0)}</div></div>
        <p class="viewer-count" aria-live="polite"><span>01</span> / ${String(total).padStart(2, "0")}</p>`;
      media.dataset.i = "0";
      pendingImage = null;
      $(".detail-info").scrollTop = 0;
      $("#prev").disabled = list.length < 2;
      $("#next").disabled = list.length < 2;
      if (!detail.open) { detail.showModal(); detail.focus({ preventScroll: true }); }
      if (push) history.replaceState(null, "", `#work-${w.no}`);
      return;
    }

    // 영상 폼: 오른쪽 패널 이미지 (제목 없이 순서대로)
    $("#detail-gallery").innerHTML = (w.gallery || [])
      .map((src, i) =>
        isVid(src)
          ? `<video src="${src}" autoplay muted loop playsinline controls aria-label="${esc(w.title)} 영상 ${i + 1}"></video>`
          : `<img src="${src}" alt="${esc(w.title)} 이미지 ${i + 1}" loading="lazy" decoding="async" />`
      )
      .join("");
    $(".detail-info").scrollTop = 0;

    const extra = (w.images || []).map((src) => `<img src="${src}" alt="${esc(w.title)} 추가 이미지" />`).join("");
    media.classList.toggle("has-more", !!extra);
    media.innerHTML =
      (isVideoForm(w) && w.video
        ? `<video src="${w.video}"${w.src ? ` poster="${w.src}"` : ""} controls autoplay muted loop playsinline aria-label="${esc(w.title)}"></video>`
        : `<img src="${w.src}" alt="${esc(w.title)}" />`) + extra;
    media.scrollTop = 0;
    // 영상을 못 불러오면 이유를 화면에 표시
    $("video", media)?.addEventListener("error", (e) => {
      const err = e.target.error;
      media.insertAdjacentHTML(
        "beforeend",
        `<p class="media-error">영상을 재생할 수 없습니다 (${err ? `code ${err.code}` : "unknown"}) — ${esc(decodeURI(w.video))}</p>`
      );
    });

    $("#prev").disabled = list.length < 2;
    $("#next").disabled = list.length < 2;

    if (!detail.open) {
      detail.showModal();
      detail.focus({ preventScroll: true }); // 첫 버튼(Prev)에 포커스 테두리가 생기지 않게
    }
    if (push) history.replaceState(null, "", `#work-${w.no}`);
  }

  /* ---------- 이미지 폼: 왼쪽 큰 이미지 바꾸기 ---------- */
  function viewerItem(w, i) {
    const src = w.gallery[i];
    return /\.(mp4|webm)$/i.test(src)
      ? `<video src="${src}" autoplay muted loop playsinline controls aria-label="${esc(w.title)} ${i + 1}"></video>`
      : `<img src="${src}" alt="${esc(w.title)} ${i + 1} / ${w.gallery.length}" />`;
  }

  let swapping = false;
  let pendingImage = null; // 전환 중에 들어온 마지막 요청 (키를 빠르게 눌러도 놓치지 않게)
  let swapTarget = 0;
  // 지금 보이는(또는 곧 보일) 사진 번호
  const currentImage = () =>
    pendingImage !== null ? pendingImage : swapping ? swapTarget : Number($("#detail-media").dataset.i) || 0;
  async function showImage(i) {
    const w = visible()[state.current];
    const media = $("#detail-media");
    if (!w) return;
    if (swapping) { pendingImage = i; return; }
    if (String(i) === media.dataset.i) return;
    swapping = true;
    swapTarget = i;
    const viewer = $(".viewer", media);
    const from = Number(media.dataset.i) || 0;

    // 오른쪽 격자에서 지금 사진 기준으로 새 사진이 어느 방향(오른쪽·아래·대각선…)에 있는지
    const cols = galleryCols();
    const dx = Math.sign((i % cols) - (from % cols));
    const dy = Math.sign(Math.floor(i / cols) - Math.floor(from / cols));

    const oldSlide = $(".v-slide", viewer);
    const newSlide = document.createElement("div");
    newSlide.className = "v-slide";
    newSlide.innerHTML = viewerItem(w, i);
    const img = $("img", newSlide);
    if (img) await img.decode().catch(() => {}); // 다 불러온 뒤에 움직이기
    viewer.append(newSlide);

    if (reduceMotion() || (!dx && !dy)) {
      oldSlide?.remove();
    } else {
      // 화면이 그 방향으로 이동: 지금 사진은 반대쪽으로 밀려나고, 새 사진이 그 방향에서 들어옴
      const W = viewer.clientWidth, H = viewer.clientHeight;
      const off = (k) => `translate(${dx * W * k}px, ${dy * H * k}px)`;
      const opt = { duration: 650, easing: "cubic-bezier(0.7, 0, 0.2, 1)", fill: "forwards" };
      await Promise.all([
        oldSlide?.animate([{ transform: "translate(0, 0)" }, { transform: off(-1) }], opt).finished,
        newSlide.animate([{ transform: off(1) }, { transform: "translate(0, 0)" }], opt).finished,
      ]);
      oldSlide?.remove();
      newSlide.getAnimations().forEach((a) => a.cancel()); // 끝난 위치(0,0)와 같으니 정리
    }
    media.dataset.i = String(i);
    $(".viewer-count span", media).textContent = String(i + 1).padStart(2, "0");
    $$(".g-thumb", detail).forEach((b) =>
      Number(b.dataset.i) === i ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")
    );
    swapping = false;
    if (pendingImage !== null) { const p = pendingImage; pendingImage = null; showImage(p); }
  }

  $("#detail-gallery").addEventListener("click", (e) => {
    const b = e.target.closest(".g-thumb");
    if (b) return showImage(Number(b.dataset.i));
    // 영상 폼: 옆 사진을 누르면 크게 보기
    const im = e.target.closest("img");
    if (im && !detail.classList.contains("is-image")) openLightbox(im);
  });

  /* ---------- 영상 폼: 사진 크게 보기 (←→ 이동, 클릭·Esc 닫기) ---------- */
  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.hidden = true;
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-label", "사진 크게 보기");
  lb.innerHTML = `
    <img class="lb-img" alt="" />
    <button class="lb-close" type="button">Close ✕</button>
    <button class="lb-arrow lb-prev" type="button" aria-label="이전 사진">←</button>
    <button class="lb-arrow lb-next" type="button" aria-label="다음 사진">→</button>
    <p class="lb-count" aria-live="polite"></p>`;
  detail.append(lb);
  let lbList = [], lbIndex = 0;
  const lbOpen = () => !lb.hidden;

  function lbShow(i, dir = 0) {
    lbIndex = (i + lbList.length) % lbList.length;
    const img = $(".lb-img", lb);
    img.src = lbList[lbIndex].src;
    img.alt = lbList[lbIndex].alt;
    $(".lb-count", lb).textContent = `${String(lbIndex + 1).padStart(2, "0")} / ${String(lbList.length).padStart(2, "0")}`;
    lb.classList.toggle("is-single", lbList.length < 2);
    if (dir && !reduceMotion())
      img.animate([{ opacity: 0, transform: `translateX(${24 * dir}px)` }, { opacity: 1, transform: "none" }], { duration: 360, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  }
  function openLightbox(im) {
    lbList = $$("#detail-gallery img");
    lb.hidden = false;
    lbShow(lbList.indexOf(im));
    if (!reduceMotion()) {
      lb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
      $(".lb-img", lb).animate([{ transform: "scale(0.96)" }, { transform: "scale(1)" }], { duration: 500, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    }
    lb.focus?.();
  }
  async function closeLightbox() {
    if (!lbOpen()) return;
    if (!reduceMotion()) await lb.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-in" }).finished;
    lb.hidden = true;
    detail.focus({ preventScroll: true });
  }
  lb.tabIndex = -1;
  lb.addEventListener("click", (e) => {
    if (e.target.closest(".lb-prev")) return lbShow(lbIndex - 1, -1);
    if (e.target.closest(".lb-next")) return lbShow(lbIndex + 1, 1);
    closeLightbox(); // 사진·바탕·Close 어디든 누르면 닫힘
  });
  // 왼쪽 큰 이미지를 누르면 다음 이미지로
  $("#detail-media").addEventListener("click", (e) => {
    if (!detail.classList.contains("is-image") || !e.target.closest(".viewer img")) return;
    const w = visible()[state.current];
    showImage((Number($("#detail-media").dataset.i) + 1) % w.gallery.length);
  });

  /* ---------- 전환 효과 ---------- */
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(0.65, 0, 0.2, 1)";
  let busy = false;

  // 커버 화면에서 사용자가 고를 때까지 대기: 화면 클릭/Enter → "play", Close/Esc → "close"
  function waitCoverChoice(layer) {
    return new Promise((resolve) => {
      const done = (v) => { document.removeEventListener("keydown", onKey, true); resolve(v); };
      const onKey = (e) => {
        if (e.key === "Escape") { e.preventDefault(); done("close"); }
        else if ((e.key === "Enter" || e.key === " ") && !e.target.closest?.(".cover-close")) { e.preventDefault(); done("play"); }
      };
      document.addEventListener("keydown", onKey, true);
      layer.addEventListener("click", (e) => done(e.target.closest(".cover-close") ? "close" : "play"), { once: true });
    });
  }

  // 은은한 확대: 썸네일이 부드럽게 커져 화면을 채움 → 커버(어둡게 + 설명) → 클릭하면 상세 화면으로
  const SOFT = "cubic-bezier(0.22, 1, 0.36, 1)"; // 천천히 멈추는 부드러운 곡선
  const rectFrames = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  const FULL = { left: "0px", top: "0px", width: "100vw", height: "100vh" };

  async function zoomOpen(card, index) {
    const w = visible()[index];
    const frame = card.querySelector(".work-frame");
    const still = w && (w.thumb || (!isVideoForm(w) && w.src));
    if (busy || !frame || !still || reduceMotion()) return openDetail(index);
    busy = true;

    const r = frame.getBoundingClientRect();
    const layer = document.createElement("div");
    layer.className = "zoom-layer";
    layer.innerHTML = `<img src="${still}" alt="" />`;
    Object.assign(layer.style, rectFrames(r));
    document.body.append(layer);
    frame.style.visibility = "hidden";

    try {
      await $("img", layer).decode().catch(() => {});
      $("img", layer).animate([{ transform: "scale(1.06)" }, { transform: "scale(1)" }], { duration: 1100, easing: SOFT, fill: "forwards" });
      await layer.animate([rectFrames(r), FULL], { duration: 1000, easing: SOFT, fill: "forwards" }).finished;

      // --- 커버 화면 ---
      layer.classList.add("is-cover");
      layer.setAttribute("role", "dialog");
      layer.setAttribute("aria-modal", "true");
      layer.setAttribute("aria-label", w.title);
      layer.insertAdjacentHTML(
        "beforeend",
        `<div class="cover-shade${w.intro ? " has-text" : ""}"></div>
         ${
           w.intro
             ? `<div class="cover-text${w.intro.length > 30 ? " is-long" : ""}">
                  ${String(w.intro).split("\n").map((s) => `<p>${esc(s)}</p>`).join("")}
                  ${(w.tools || []).length ? `<p class="cover-tools">${toolsHTML(w.tools)}</p>` : ""}
                </div>`
             : ""
         }
         ${w.introNote ? `<p class="cover-note">${esc(w.introNote)}</p>` : ""}
         <button class="cover-close" type="button">Close ✕</button>`
      );
      layer.tabIndex = -1;
      document.documentElement.style.overflow = "hidden";
      const behind = $$(".bar, .filters, #archive");
      behind.forEach((el) => (el.inert = true)); // 커버 뒤 화면은 포커스/클릭 불가
      layer.focus({ preventScroll: true });

      const choice = await waitCoverChoice(layer);
      document.documentElement.style.overflow = "";
      behind.forEach((el) => (el.inert = false));
      layer.classList.add("is-leaving"); // 글·버튼 먼저 사라짐
      await Promise.all(
        $$(".cover-text, .cover-note, .cover-close", layer).map(
          (el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-in", fill: "forwards" }).finished
        )
      );

      if (choice === "close") {
        // 원래 썸네일 자리로 부드럽게 다시 작아짐
        const r2 = frame.getBoundingClientRect();
        $(".cover-shade", layer).animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" });
        await layer.animate([FULL, rectFrames(r2)], { duration: 800, easing: SOFT, fill: "forwards" }).finished;
        card.focus({ preventScroll: true });
        return;
      }

      // --- 상세 화면으로 ---
      openDetail(index);
      detail.append(layer); // 모달(최상위 레이어) 안으로 옮겨서 계속 위에 보이게
      $("img", layer).animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }], { duration: 600, easing: "ease-out", fill: "forwards" });
      await layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: "ease-out", fill: "forwards" }).finished;
    } finally {
      document.documentElement.style.overflow = "";
      $$(".bar, .filters, #archive").forEach((el) => (el.inert = false));
      layer.remove();
      frame.style.visibility = "";
      busy = false;
    }
  }

  // 닫기: 화면이 살짝 작아지며 서서히 사라짐
  async function closeDetail() {
    if (!detail.open || busy) return;
    if (reduceMotion()) return detail.close();
    busy = true;
    await detail.animate(
      [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.985)" }],
      { duration: 280, easing: "ease-in" }
    ).finished;
    busy = false;
    detail.close();
  }

  // 이전/다음: 내용이 부드럽게 교차
  async function step(dir) {
    const n = visible().length;
    if (busy || n < 2) return;
    const body = $(".detail-body");
    if (reduceMotion()) return openDetail((state.current + dir + n) % n);
    busy = true;
    await body.animate([{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: `translateX(${-16 * dir}px)` }], { duration: 180, easing: "ease-in" }).finished;
    openDetail((state.current + dir + n) % n);
    await body.animate([{ opacity: 0, transform: `translateX(${16 * dir}px)` }, { opacity: 1, transform: "translateX(0)" }], { duration: 320, easing: EASE }).finished;
    busy = false;
  }

  detail.addEventListener("cancel", (e) => { e.preventDefault(); lbOpen() ? closeLightbox() : closeDetail(); }); // Esc

  detail.addEventListener("close", () => {
    lb.hidden = true;
    $("#detail-media").innerHTML = ""; // 영상 정지
    history.replaceState(null, "", location.pathname + location.search);
    const no = visible()[state.current]?.no;
    $(`[data-no="${no}"]`, archive)?.focus({ preventScroll: true });
  });

  $("#prev").addEventListener("click", () => step(-1));
  $("#next").addEventListener("click", () => step(1));
  $("#close").addEventListener("click", closeDetail);
  // 이미지 폼: 오른쪽 격자의 열 개수 (↑↓ 이동 칸 수)
  const galleryCols = () => {
    const g = $("#detail-gallery");
    return Math.max(1, getComputedStyle(g).gridTemplateColumns.split(" ").filter(Boolean).length);
  };

  detail.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("video")) return; // 영상 탐색 키는 영상에 맡김
    const keys = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: "up", ArrowDown: "down" };
    if (!(e.key in keys)) return;

    // 사진 크게 보기 중: ←→ 사진 이동
    if (lbOpen()) {
      e.preventDefault();
      if (e.key === "ArrowLeft") lbShow(lbIndex - 1, -1);
      if (e.key === "ArrowRight") lbShow(lbIndex + 1, 1);
      return;
    }

    // 이미지 폼: 방향키로 사진 이동 (←→ 한 장, ↑↓ 한 줄, 끝에서는 처음/마지막으로 순환)
    if (detail.classList.contains("is-image")) {
      const w = visible()[state.current];
      const n = (w?.gallery || []).length;
      if (n < 2) return;
      e.preventDefault();
      const cur = currentImage();
      const d = keys[e.key];
      const move = d === "up" ? -galleryCols() : d === "down" ? galleryCols() : d;
      let next = cur + move;
      if (Math.abs(move) === 1) next = (next + n) % n;
      else next = Math.min(n - 1, Math.max(0, next));
      if (next === cur) return;
      showImage(next);
      $(`.g-thumb[data-i="${next}"]`, detail)?.scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
      return;
    }

    // 영상 폼: ←→ 이전/다음 작품
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  /* ---------- 이벤트 ---------- */
  archive.addEventListener("click", (e) => {
    // Gallery 머리의 목차: 누르면 그 작품으로 스크롤
    const jump = e.target.closest("[data-jump]");
    if (jump) {
      $(`.ex-item[data-item="${jump.dataset.jump}"]`, archive)?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
      return;
    }
    const el = e.target.closest("[data-no]");
    if (!el) return;
    // Gallery의 "View project" 버튼도 같은 작품 이미지에서 커지도록
    const card = el.closest(".ex-item")?.querySelector(".g-card") || el;
    zoomOpen(card, visible().findIndex((w) => w.no === el.dataset.no));
  });

  $$(".views button").forEach((b) =>
    b.addEventListener("click", () => {
      state.view = b.dataset.view;
      localStorage.setItem("view", state.view);
      $$(".views button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      render();
    })
  );

  $$(".filters button").forEach((b) =>
    b.addEventListener("click", () => {
      state.filter = b.dataset.filter;
      $$(".filters button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      updateCounts();
      render();
    })
  );

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => (state.view === "grid" ? layoutGrid() : measureRail()), 120);
  });

  /* ---------- About ---------- */
  $("#about-title").textContent = profile.name || "";
  $("#about-role").textContent = profile.role || "";
  $("#about-bio").textContent = profile.bio || "";
  const mail = $("#about-mail");
  mail.textContent = profile.email ? `${profile.email} ↗` : "";
  mail.href = profile.email ? `mailto:${profile.email}` : "#";
  $("#about-links").innerHTML = (profile.links || [])
    .map((l) => `<li><a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`)
    .join("");
  $("#about-open").addEventListener("click", () => about.showModal());
  $("#about-close").addEventListener("click", () => about.close());
  [detail, about].forEach((d) =>
    d.addEventListener("click", (e) => e.target === d && d === about && d.close())
  );

  /* ---------- 시작 ---------- */
  $$(".views button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.view === state.view));
  updateCounts();
  render();

  const openFromHash = () => {
    const m = location.hash.match(/^#work-(\d{3})$/);
    if (m) openDetail(works.findIndex((w) => w.no === m[1]), false);
  };

  /* ---------- 첫 화면 인트로 + 안내 ---------- */
  const notice = $("#notice");
  if (notice) {
    const behind = $$(".bar, .filters, #archive");
    behind.forEach((el) => (el.inert = true));
    document.documentElement.style.overflow = "hidden";

    // 1) 큰 이름을 한 글자씩 나눠 아래에서 순서대로 올라오게
    $$("[data-split]", notice).forEach((word) => {
      const text = word.textContent.trim();
      word.innerHTML = [...text].map((c) => `<span class="nt-char">${esc(c)}</span>`).join("");
    });
    $$(".nt-char", notice).forEach((c, i) => c.style.setProperty("--d", `${0.5 + i * 0.06}s`));

    // 이름이 명함 폭에 맞도록 글자 크기 맞춤 (양옆 여백을 조금 남김)
    const nameEl = $(".notice-title", notice);
    const card = $(".bcard", notice);
    const fitName = () => {
      if (notice.classList.contains("is-hidden")) return;
      nameEl.style.fontSize = "100px";
      const w = nameEl.scrollWidth || 1;
      const box = $(".bc-name", notice);
      nameEl.style.fontSize = `${Math.min((100 * box.clientWidth * 0.94) / w, card.clientHeight * 0.36).toFixed(1)}px`;
    };
    fitName();
    document.fonts?.ready.then(fitName);
    addEventListener("resize", fitName);

    // 명함 연락처: works.js의 PROFILE에서 가져옴
    if (profile.email) $(".bc-mail", notice).textContent = profile.email;
    const ig = (profile.links || []).find((l) => /instagram/i.test(l.label || l.href));
    const igId = ig?.href?.match(/instagram\.com\/([^/?#]+)/i)?.[1];
    if (igId) $(".bc-ig", notice).textContent = `@${igId}`;

    // 마우스를 따라 명함이 살짝 기울어짐
    notice.addEventListener("pointermove", (e) => {
      if (reduceMotion() || leaving) return;
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      card.style.setProperty("--ty", `${(x * 8).toFixed(2)}deg`);
      card.style.setProperty("--tx", `${(-y * 8).toFixed(2)}deg`);
    });
    notice.addEventListener("pointerleave", () => { card.style.setProperty("--tx", "0deg"); card.style.setProperty("--ty", "0deg"); });

    // 2) 명함 아래: 서울 현재 시각
    const clock = $(".nt-clock", notice);
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" });
    const setClock = () => (clock.textContent = fmt.format(new Date()));
    setClock();
    const clockTimer = setInterval(setClock, 15000);

    notice.focus({ preventScroll: true }); // Enter 키로도 입장

    // 3) 클릭(또는 Enter): 명함이 왼쪽 위 모서리를 축으로 위로 돌아가며 사라짐
    let leaving = false;
    /* 입장: 명함의 왼쪽 위 모서리에 힘점(축)을 두고, 명함이 시계 반대 방향으로
     * 위쪽으로 휙 돌아 올라가며 사라짐. 책상 바탕이 걷히고 그 아래로 사이트가 은은하게 나타남 */
    async function enterWarp() {
      leaving = true;
      notice.classList.add("is-swinging");
      behind.forEach((el) => (el.inert = false));
      document.documentElement.style.overflow = "";
      render();

      const back = $$(".bar, .filters, #archive");
      const D = 1150;
      const lift = innerHeight; // 돌아가면서 화면 위로 빠질 거리
      await Promise.all([
        card.animate(
          [
            { transform: "translateY(0) rotate(0deg)", easing: "cubic-bezier(0.5, 0, 0.75, 0)" },
            { transform: "translateY(4px) rotate(2deg)", offset: 0.12, easing: "cubic-bezier(0.55, 0, 0.2, 1)" }, // 힘을 싣는 순간 살짝 반대로
            { transform: `translateY(${-lift}px) rotate(-80deg)` },
          ],
          { duration: D, fill: "forwards" }
        ).finished,
        $(".notice-text", notice).animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }).finished,
        notice.animate([{ backgroundColor: getComputedStyle(notice).backgroundColor }, { backgroundColor: "rgba(233, 232, 227, 0)" }], {
          duration: 700, delay: 300, easing: "ease-in-out", fill: "forwards",
        }).finished,
        ...back.map((el) =>
          el.animate(
            [
              { opacity: 0, transform: "scale(0.97)" },
              { opacity: 1, transform: "scale(1)" },
            ],
            { duration: D, delay: 200, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" }
          ).finished
        ),
      ]);
    }

    const enter = async () => {
      if (leaving) return;
      leaving = true;
      document.removeEventListener("keydown", onKey);
      clearInterval(clockTimer);
      if (!reduceMotion()) {
        await enterWarp();
      } else {
        behind.forEach((el) => (el.inert = false));
        document.documentElement.style.overflow = "";
      }
      notice.classList.add("is-hidden");
      openFromHash();
    };
    const onKey = (e) => {
      if (["Enter", " ", "Escape"].includes(e.key)) { e.preventDefault(); enter(); }
    };
    notice.addEventListener("click", enter);
    document.addEventListener("keydown", onKey);
  } else {
    openFromHash();
  }
})();
