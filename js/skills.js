(function () {
  const SKILLS = window.SKILLS || [];
  const order = ["客户端", "Codex工作流", "工具与自动化", "视频与出图Skill", "资讯收藏"];
  const root = document.getElementById("skillList");
  const count = document.getElementById("skillCount");
  if (!root) return;
  if (count) count.textContent = `${SKILLS.length} 条`;
  const groups = {};
  SKILLS.forEach(s => {
    (groups[s.group] || (groups[s.group] = [])).push(s);
  });
  root.innerHTML = order.filter(g => groups[g]).map(g => `
    <h2 class="skill-group">${g}</h2>
    ${groups[g].map(s => `
      <article class="skill-card">
        <h3>${s.title}</h3>
        <p class="src">${s.author || ""}${s.video ? " · 含视频" : ""} · <a href="${s.url}" target="_blank" rel="noreferrer">查看原帖</a></p>
        <p>${s.blurb || ""}</p>
      </article>
    `).join("")}
  `).join("");
})();
