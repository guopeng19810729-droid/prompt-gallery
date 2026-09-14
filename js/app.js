(function () {
  const CASES = window.GALLERY_CASES || [];
  const PASSWORD = "001905";
  const catsBase = [
    "全部",
    "人物角色",
    "视频分镜",
    "AI视频",
    "真人视频",
    "海报字体",
    "UI界面",
    "3D建模",
    "国风历史",
    "图表信息",
    "插画艺术",
    "建筑空间"
  ];
  let current = "全部";
  let query = "";
  let unlocked = sessionStorage.getItem("x_unlocked") === "1";
  let sortDir = sessionStorage.getItem("gallery_sort") || "desc";

  const filters = document.getElementById("filters");
  const grid = document.getElementById("grid");
  const overlay = document.getElementById("overlay");
  const sheet = document.getElementById("sheet");
  const search = document.getElementById("search");
  const count = document.getElementById("count");
  const xGate = document.getElementById("xGate");
  const passOverlay = document.getElementById("passOverlay");
  const passForm = document.getElementById("passForm");
  const passInput = document.getElementById("passInput");
  const passErr = document.getElementById("passErr");
  const passCancel = document.getElementById("passCancel");

  function isNsfw(c) {
    return !!c.nsfw;
  }
  function cats() {
    return unlocked ? catsBase.concat("XXX") : catsBase.slice();
  }
  function hasPrompt(c) {
    return !!(c.prompt && String(c.prompt).trim());
  }
  function mediaList(c) {
    return (c.images && c.images.length ? c.images : [c.image]).filter(Boolean);
  }
  const TW_EPOCH = 1288834974657;
  function snowflakeDate(id) {
    try {
      const ms = (BigInt(String(id)) >> 22n) + BigInt(TW_EPOCH);
      const d = new Date(Number(ms));
      if (Number.isNaN(d.getTime())) return "";
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}.${m}.${day}`;
    } catch (e) {
      return "";
    }
  }
  function itemDate(c) {
    return c.addedAt || snowflakeDate(c.xid || c.id) || "";
  }
  function dateValue(c) {
    const s = itemDate(c);
    if (!s) return 0;
    const n = Number(s.replace(/\./g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  function visible() {
    const q = query.trim().toLowerCase();
    const list = CASES.filter(c => {
      if (!unlocked && isNsfw(c)) return false;
      if (current === "XXX") return isNsfw(c);
      if (isNsfw(c)) return false;
      if (current !== "全部" && c.category !== current) return false;
      if (!q) return true;
      const id = String(c.id || "");
      const idNum = String(parseInt(id, 10));
      const qDigits = q.replace(/^case\s*/i, "").trim();
      if (/^\d+$/.test(qDigits)) {
        if (id === qDigits || idNum === String(parseInt(qDigits, 10)) || id.padStart(3, "0") === qDigits.padStart(3, "0")) {
          return true;
        }
      }
      return [c.id, `case ${c.id}`, c.xid, c.title, c.blurb, c.category, c.model, c.prompt, c.source]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return list.slice().sort((a, b) => {
      const dv = (dateValue(a) - dateValue(b)) * dir;
      if (dv) return dv;
      return String(a.id).localeCompare(String(b.id), "en") * dir;
    });
  }
  function syncGate() {
    if (!xGate) return;
    xGate.classList.toggle("unlocked", unlocked);
    xGate.title = unlocked ? "已解锁，再点一次锁定" : "点击输入密码";
  }
  function renderFilters() {
    if (!filters) return;
    filters.innerHTML = cats().map(c =>
      `<button class="pill ${c === "XXX" ? "xxx" : ""} ${c === current ? "on" : ""}" data-cat="${c}">${c}</button>`
    ).join("");
  }
  function renderGrid() {
    const list = visible();
    if (count) count.textContent = `${list.length} 条案例`;
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = `<div class="empty">没有匹配的案例。换个分类或清空搜索。</div>`;
      return;
    }
    grid.innerHTML = list.map(c => {
      const n = mediaList(c).length;
      return `
      <article class="card" data-id="${c.id}">
        <div class="media">
          <img src="${c.image}" alt="${c.title}" loading="lazy" onerror="this.style.opacity='.25'" />
          ${hasPrompt(c) ? `<span class="badge-p" title="有 Prompt">P</span>` : ""}
          ${(c.videoUrl || c.driveId) ? `<span class="badge-play">▶</span>` : ""}
          ${n > 1 ? `<span class="badge-n">${n}</span>` : ""}
        </div>
        <div class="card-body">
          <div class="tag-row">
            <div class="tag">Case ${c.id} · ${current === "XXX" ? "XXX" : c.category}</div>
            ${c.model ? `<span class="tag chip model">${c.model}</span>` : ""}
            ${itemDate(c) ? `<span class="tag chip date">${itemDate(c)}</span>` : ""}
          </div>
          <h3>${c.title}</h3>
          <p>${c.blurb || ""}</p>
        </div>
      </article>`;
    }).join("");
  }
  function syncSortPills() {
    const pills = document.getElementById("sortPills");
    if (!pills) return;
    pills.querySelectorAll("[data-sort]").forEach(btn => {
      btn.classList.toggle("on", btn.dataset.sort === sortDir);
    });
  }
  function refresh() {
    syncGate();
    renderFilters();
    syncSortPills();
    renderGrid();
  }
  function sourceHtml(c) {
    const bits = [];
    if (c.sourceUrl) bits.push(`<a href="${c.sourceUrl}" target="_blank" rel="noreferrer">${c.source || "查看原帖"}</a>`);
    else if (c.source) bits.push(c.source);
    if (c.videoUrl) bits.push(`<a href="${c.sourceUrl || c.videoUrl}" target="_blank" rel="noreferrer">去 X 观看</a>`);
    if (c.driveUrl) bits.push(`<a href="${c.driveUrl}" target="_blank" rel="noreferrer">Drive 备份</a>`);
    return bits.join(" · ") || "来源待补";
  }
  function videoStage(c, poster) {
    if (c.videoUrl) {
      return `<video id="heroMedia" data-video-url="${c.videoUrl}" poster="${poster || ""}" controls playsinline preload="none" referrerpolicy="no-referrer"></video>
        <p class="src" id="videoHint" style="margin:8px 12px 0">正在加载视频…若失败请点下方「X 视频 / 原帖」</p>`;
    }
    if (c.driveId) {
      return `<iframe class="drive-player" title="Drive video" src="https://drive.google.com/file/d/${c.driveId}/preview" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
        <p class="src" style="margin:8px 12px 0">Drive 需公开分享才能在站内播放；不行就打开下方备份链接。</p>`;
    }
    return "";
  }
  async function attachTwimgVideo(videoEl, hintEl) {
    const url = videoEl && videoEl.getAttribute("data-video-url");
    if (!url) return;
    try {
      const res = await fetch(url, { referrerPolicy: "no-referrer", mode: "cors", cache: "force-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      videoEl.src = obj;
      videoEl.load();
      if (hintEl) hintEl.hidden = true;
    } catch (err) {
      if (hintEl) hintEl.textContent = "站内播放失败（X 直链限制）。请点下方「X 视频」或原帖观看。";
    }
  }
  function openCase(id) {
    const c = CASES.find(x => x.id === id);
    if (!c) return;
    if (isNsfw(c) && !unlocked) return;
    const prompted = hasPrompt(c);
    const imgs = mediaList(c);
    const hasVideo = !!(c.videoUrl || c.driveId);
    const showImageStrip = imgs.length > 0 && (hasVideo ? imgs.some(u => u && !String(u).includes("placeholder-x.png")) : imgs.length > 1);
    sheet.innerHTML = `
      <div class="gallery-stage" id="stage">
        ${hasVideo
          ? videoStage(c, imgs[0] || c.image)
          : `<img id="heroMedia" src="${imgs[0]}" alt="${c.title}" onerror="this.style.opacity='.25'" />`}
        ${prompted ? `<span class="badge-p" title="有 Prompt">P</span>` : ""}
        ${!hasVideo && imgs.length > 1 ? `
          <button class="nav-btn prev" id="prev" type="button">‹</button>
          <button class="nav-btn next" id="next" type="button">›</button>
          <div class="dots" id="dots">${imgs.map((_, i) => `<i class="${i===0?"on":""}"></i>`).join("")}</div>
        ` : ""}
      </div>
      ${hasVideo && imgs.length ? `
        <div class="thumb-row" id="thumbRow" style="display:flex;gap:8px;overflow:auto;padding:8px 12px 0">
          ${imgs.map((src, i) => `<button type="button" class="thumb" data-i="${i}" style="flex:0 0 auto;border:2px solid transparent;padding:0;background:transparent;border-radius:8px;cursor:pointer"><img src="${src}" alt="" style="height:72px;width:auto;display:block;border-radius:6px;opacity:.9" /></button>`).join("")}
        </div>` : ""}
      <div class="detail">
        <div class="tag-row">
          <div class="tag">Case ${c.id} · ${isNsfw(c) ? "XXX" : c.category}</div>
          ${c.model ? `<span class="tag chip model">${c.model}</span>` : ""}
          ${itemDate(c) ? `<span class="tag chip date">${itemDate(c)}</span>` : ""}
        </div>
        <h2>${c.title}</h2>
        <div class="src">${sourceHtml(c)}${imgs.length > 1 ? ` · ${imgs.length} 张` : ""}${hasVideo && imgs.length ? " · 视频为主，下方可翻图" : ""}</div>
        ${prompted ? `<pre id="prompt">${c.prompt}</pre>` : `<p class="src">这条没有可复制的 Prompt，只作参考。</p>`}
        <div class="row">
          ${prompted ? `<button class="copy" id="copy">复制 Prompt</button>` : ""}
          <button class="close" id="close">关闭</button>
        </div>
      </div>`;
    overlay.classList.add("show");
    const twVideo = document.getElementById("heroMedia");
    const videoHint = document.getElementById("videoHint");
    if (twVideo && twVideo.getAttribute("data-video-url")) {
      // Prefer direct src for R2 / non-twimg; keep blob fetch for twimg hotlink limits
      const vurl = twVideo.getAttribute("data-video-url");
      if (vurl && !/video\.twimg\.com/.test(vurl)) {
        twVideo.src = vurl;
        twVideo.load();
        if (videoHint) videoHint.hidden = true;
      } else {
        attachTwimgVideo(twVideo, videoHint);
      }
    }
    let idx = 0;
    const hero = document.getElementById("heroMedia");
    const dots = document.getElementById("dots");
    const stage = document.getElementById("stage");
    function showImageInStage(i) {
      if (!imgs.length) return;
      idx = (i + imgs.length) % imgs.length;
      if (hasVideo && stage) {
        stage.innerHTML = `<img id="heroMedia" src="${imgs[idx]}" alt="${c.title}" onerror="this.style.opacity='.25'" />` +
          (prompted ? `<span class="badge-p" title="有 Prompt">P</span>` : "") +
          (imgs.length > 1 ? `<button class="nav-btn prev" id="prev" type="button">‹</button><button class="nav-btn next" id="next" type="button">›</button><div class="dots" id="dots">${imgs.map((_, n) => `<i class="${n===idx?"on":""}"></i>`).join("")}</div>` : "");
        const prev2 = document.getElementById("prev");
        const next2 = document.getElementById("next");
        if (prev2) prev2.onclick = ev => { ev.stopPropagation(); showImageInStage(idx - 1); };
        if (next2) next2.onclick = ev => { ev.stopPropagation(); showImageInStage(idx + 1); };
      } else if (hero) {
        hero.src = imgs[idx];
        if (dots) [...dots.children].forEach((el, n) => el.classList.toggle("on", n === idx));
      }
    }
    function show(i) {
      if (!hero || hasVideo) return;
      idx = (i + imgs.length) % imgs.length;
      hero.src = imgs[idx];
      if (dots) {
        [...dots.children].forEach((el, n) => el.classList.toggle("on", n === idx));
      }
    }
    const prev = document.getElementById("prev");
    const next = document.getElementById("next");
    if (prev) prev.onclick = ev => { ev.stopPropagation(); show(idx - 1); };
    if (next) next.onclick = ev => { ev.stopPropagation(); show(idx + 1); };
    const thumbRow = document.getElementById("thumbRow");
    if (thumbRow) {
      thumbRow.onclick = ev => {
        const btn = ev.target.closest("[data-i]");
        if (!btn) return;
        showImageInStage(Number(btn.dataset.i));
      };
    }
    const copyBtn = document.getElementById("copy");
    if (copyBtn) {
      copyBtn.onclick = async () => {
        await navigator.clipboard.writeText(c.prompt);
        copyBtn.textContent = "已复制";
      };
    }
    document.getElementById("close").onclick = closeCase;
  }
  function closeCase() {
    overlay.classList.remove("show");
  }
  function openPass() {
    if (passErr) passErr.hidden = true;
    if (passInput) passInput.value = "";
    passOverlay.classList.add("show");
    setTimeout(() => passInput && passInput.focus(), 30);
  }
  function closePass() {
    passOverlay.classList.remove("show");
  }
  function lock() {
    unlocked = false;
    sessionStorage.removeItem("x_unlocked");
    if (current === "XXX") current = "全部";
    closeCase();
    closePass();
    refresh();
  }
  function unlock() {
    unlocked = true;
    sessionStorage.setItem("x_unlocked", "1");
    current = "XXX";
    closePass();
    refresh();
  }

  refresh();

  if (xGate) {
    xGate.addEventListener("click", () => {
      if (unlocked) lock();
      else openPass();
    });
  }
  if (passForm) {
    passForm.addEventListener("submit", e => {
      e.preventDefault();
      const val = (passInput && passInput.value || "").trim();
      if (val === PASSWORD) unlock();
      else if (passErr) passErr.hidden = false;
    });
  }
  if (passCancel) passCancel.addEventListener("click", closePass);
  if (passOverlay) {
    passOverlay.addEventListener("click", e => {
      if (e.target === passOverlay) closePass();
    });
  }
  if (filters) {
    filters.addEventListener("click", e => {
      const btn = e.target.closest("[data-cat]");
      if (!btn) return;
      current = btn.dataset.cat;
      renderFilters();
      renderGrid();
    });
  }
  const sortPills = document.getElementById("sortPills");
  if (sortPills) {
    sortPills.addEventListener("click", e => {
      const btn = e.target.closest("[data-sort]");
      if (!btn) return;
      sortDir = btn.dataset.sort === "asc" ? "asc" : "desc";
      sessionStorage.setItem("gallery_sort", sortDir);
      syncSortPills();
      renderGrid();
    });
  }
  if (grid) {
    grid.addEventListener("click", e => {
      const card = e.target.closest("[data-id]");
      if (card) openCase(card.dataset.id);
    });
  }
  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeCase();
    });
  }
  if (search) {
    search.addEventListener("input", e => {
      query = e.target.value;
      renderGrid();
    });
  }
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeCase();
      closePass();
    }
  });
})();
