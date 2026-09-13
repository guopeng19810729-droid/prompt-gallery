(function () {
  const SKILLS = window.SKILLS || [];
  const order = ["客户端", "Codex工作流", "工具与自动化", "视频与出图Skill", "资讯收藏"];
  const root = document.getElementById("skillList");
  const count = document.getElementById("skillCount");
  const sortPills = document.getElementById("skillSortPills");
  if (!root) return;

  let sortDir = sessionStorage.getItem("skills_sort") || "desc";
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
  function itemDate(s) {
    return s.addedAt || snowflakeDate(s.id) || "";
  }
  function dateValue(s) {
    const v = itemDate(s);
    if (!v) return 0;
    const n = Number(v.replace(/\./g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  function sortedSkills() {
    const dir = sortDir === "asc" ? 1 : -1;
    return SKILLS.slice().sort((a, b) => {
      const dv = (dateValue(a) - dateValue(b)) * dir;
      if (dv) return dv;
      return String(a.id).localeCompare(String(b.id), "en") * dir;
    });
  }
  function syncSortPills() {
    if (!sortPills) return;
    sortPills.querySelectorAll("[data-sort]").forEach(btn => {
      btn.classList.toggle("on", btn.dataset.sort === sortDir);
    });
  }
  function render() {
    if (count) count.textContent = `${SKILLS.length} 条`;
    syncSortPills();
    const list = sortedSkills();
    const groups = {};
    list.forEach(s => {
      (groups[s.group] || (groups[s.group] = [])).push(s);
    });
    const groupOrder = order.filter(g => groups[g]).slice().sort((ga, gb) => {
      const tip = sortDir === "asc" ? Math.min : Math.max;
      const va = tip(...groups[ga].map(dateValue));
      const vb = tip(...groups[gb].map(dateValue));
      return sortDir === "asc" ? va - vb : vb - va;
    });
    root.innerHTML = groupOrder.map(g => `
    <h2 class="skill-group">${g}</h2>
    ${groups[g].map(s => {
      const d = itemDate(s);
      const title = d ? `${s.title}<span class="skill-date">（${d}）</span>` : s.title;
      return `
      <article class="skill-card">
        <h3>${title}</h3>
        <p class="src">${s.author || ""}${s.video ? " · 含视频" : ""} · <a href="${s.url}" target="_blank" rel="noreferrer">查看原帖</a></p>
        <p>${s.blurb || ""}</p>
      </article>`;
    }).join("")}
  `).join("");
  }

  if (sortPills) {
    sortPills.addEventListener("click", e => {
      const btn = e.target.closest("[data-sort]");
      if (!btn) return;
      sortDir = btn.dataset.sort === "asc" ? "asc" : "desc";
      sessionStorage.setItem("skills_sort", sortDir);
      render();
    });
  }
  render();
})();
