import { projects } from "./data/projects";
import { formation } from "./data/formations";
import { refreshMagnetic } from "./magnetic";

const ROLE_NAMES = {
  ST: "striker",
  CF: "centre-forward",
  LW: "left winger",
  RW: "right winger",
  CM: "midfielder",
  CAM: "attacking midfielder",
  CDM: "defensive midfielder",
  CB: "centre-back",
  LB: "left-back",
  RB: "right-back",
  GK: "goalkeeper",
};

export function initSquad() {
  const pitch = document.getElementById("pitch");
  if (!pitch) return;

  // Prevent duplicate tokens if called multiple times
  if (pitch.querySelector(".squad-slot")) return;

  const squadSize = projects.length;
  const slots = formation[squadSize] || formation[4] || Object.values(formation)[0] || [];
  const layout = document.querySelector(".squad-layout");
  const cardContainer = document.getElementById("project-card");

  let selectedIndex = null;

  function deselectProject() {
    selectedIndex = null;
    pitch.querySelectorAll(".squad-token").forEach((t) => {
      t.classList.remove("is-selected");
      t.removeAttribute("aria-selected");
    });
    if (layout) {
      layout.classList.remove("has-selection");
    }
    if (cardContainer) {
      cardContainer.innerHTML = "";
    }
    // Re-measure magnetic targets when pitch returns to center
    setTimeout(refreshMagnetic, 350);
  }

  function selectProject(index, tokenEl) {
    // If clicking the currently selected token, deselect and center the pitch
    if (selectedIndex === index) {
      deselectProject();
      return;
    }

    selectedIndex = index;

    pitch.querySelectorAll(".squad-token").forEach((t) => {
      t.classList.remove("is-selected");
      t.removeAttribute("aria-selected");
    });

    if (tokenEl) {
      tokenEl.classList.add("is-selected");
      tokenEl.setAttribute("aria-selected", "true");
    }

    // Move pitch to the left and show card
    if (layout) {
      layout.classList.add("has-selection");
    }

    const project = projects[index];
    const slot = slots[index];
    if (!project || !cardContainer) return;

    const roleTitle = slot ? (ROLE_NAMES[slot.role] || slot.role) : "";

    cardContainer.innerHTML = `
      <button type="button" class="project-card__close" aria-label="Close project card">&times;</button>
      <div class="project-card__header">
        <h3 class="project-card__title">${project.name}</h3>
        <span class="project-card__role">${slot?.role || ""} &middot; ${roleTitle}</span>
      </div>
      <p class="project-card__tagline">${project.tagline}</p>
      <div class="project-card__stack">
        ${project.stack.map((item) => `<span class="project-card__badge">${item}</span>`).join("")}
      </div>
      ${
        project.repo
          ? `<a href="${project.repo}" target="_blank" rel="noopener noreferrer" class="project-card__github" aria-label="View source code on GitHub" title="View on GitHub" data-magnetic>
               <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                 <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
               </svg>
             </a>`
          : ""
      }
    `;

    const closeBtn = cardContainer.querySelector(".project-card__close");
    if (closeBtn) {
      closeBtn.addEventListener("click", deselectProject);
    }

    // Re-measure magnetic targets after pitch slides left
    setTimeout(refreshMagnetic, 350);
  }

  projects.forEach((project, index) => {
    const slot = slots[index];
    if (!slot) return;

    // Centering wrapper positioned at slot percentages
    const wrapper = document.createElement("div");
    wrapper.className = "squad-slot";
    wrapper.style.left = `${slot.x}%`;
    wrapper.style.top = `${slot.y}%`;
    wrapper.style.setProperty("--i", index);

    // Uniform two-color token button (hunter disc, cream label & role tag, cream ring)
    const token = document.createElement("button");
    token.type = "button";
    token.className = "squad-token";
    token.setAttribute("data-magnetic", "");

    const label = project.cover?.label || project.name.slice(0, 3).toUpperCase();
    const roleTitle = ROLE_NAMES[slot.role] || slot.role;

    token.setAttribute("aria-label", `${project.name}, ${roleTitle}`);
    token.setAttribute("title", `${project.name} (${slot.role}): click to inspect`);

    token.innerHTML = `
      <span class="token-label">${label}</span>
      <span class="token-role">${slot.role}</span>
    `;

    token.addEventListener("click", () => {
      selectProject(index, token);
    });

    wrapper.appendChild(token);
    pitch.appendChild(wrapper);
  });

  // Re-scan and re-measure magnetic targets
  refreshMagnetic();
}
