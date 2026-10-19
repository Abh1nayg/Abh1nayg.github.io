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
  let lastActiveToken = null;

  // Re-measure magnetic targets when the 2-column grid transition finishes
  layout?.addEventListener("transitionend", (e) => {
    if (e.target === layout) {
      refreshMagnetic();
    }
  });

  function deselectProject() {
    selectedIndex = null;
    pitch.querySelectorAll(".squad-token").forEach((t) => {
      t.classList.remove("is-selected");
      t.setAttribute("aria-pressed", "false");
    });

    if (layout) {
      layout.classList.remove("has-selection");
    }

    // Return focus to the token that opened the card
    if (lastActiveToken && document.body.contains(lastActiveToken)) {
      lastActiveToken.focus();
    }
  }

  // Close card when pressing Escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && selectedIndex !== null) {
      deselectProject();
    }
  });

  function selectProject(index, tokenEl, isKeyboard = false) {
    // If clicking the currently selected token, toggle it closed
    if (selectedIndex === index) {
      deselectProject();
      return;
    }

    const isSwitching = selectedIndex !== null;

    selectedIndex = index;
    lastActiveToken = tokenEl;

    pitch.querySelectorAll(".squad-token").forEach((t) => {
      t.classList.remove("is-selected");
      t.setAttribute("aria-pressed", "false");
    });

    if (tokenEl) {
      tokenEl.classList.add("is-selected");
      tokenEl.setAttribute("aria-pressed", "true");
    }

    if (layout) {
      layout.classList.add("has-selection");
    }

    if (isSwitching && cardContainer) {
      cardContainer.classList.add("is-swapping");
      setTimeout(() => {
        cardContainer.classList.remove("is-swapping");
      }, 120);
    }

    const project = projects[index];
    const slot = slots[index];
    if (!project || !cardContainer) return;

    // Set card accent for the left accent bar / bloom
    cardContainer.setAttribute("data-accent", project.accent || "brick");

    const roleTitle = slot ? (ROLE_NAMES[slot.role] || slot.role) : "";

    // Build DOM elements safely with textContent
    cardContainer.replaceChildren();

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "project-card__close";
    closeBtn.setAttribute("aria-label", "Close project card");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", deselectProject);

    const header = document.createElement("div");
    header.className = "project-card__header";

    const title = document.createElement("h3");
    title.className = "project-card__title";
    title.tabIndex = -1;
    title.textContent = project.name;

    const role = document.createElement("span");
    role.className = "project-card__role";
    role.textContent = `${slot?.role || ""} · ${roleTitle}`;

    header.append(title, role);

    const tagline = document.createElement("p");
    tagline.className = "project-card__tagline";
    tagline.textContent = project.tagline;

    const stack = document.createElement("div");
    stack.className = "project-card__stack";
    project.stack?.forEach((tech) => {
      const badge = document.createElement("span");
      badge.className = "project-card__badge";
      badge.textContent = tech;
      stack.appendChild(badge);
    });

    cardContainer.append(closeBtn, header, tagline, stack);

    if (project.repo) {
      const ghLink = document.createElement("a");
      ghLink.href = project.repo;
      ghLink.target = "_blank";
      ghLink.rel = "noopener noreferrer";
      ghLink.className = "project-card__github";
      ghLink.setAttribute("aria-label", `View source code for ${project.name} on GitHub`);
      ghLink.setAttribute("title", "View on GitHub");
      ghLink.setAttribute("data-magnetic", "");
      ghLink.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`;
      cardContainer.appendChild(ghLink);
    }

    // When activated via keyboard (detail === 0), move focus to card title for screen readers
    if (isKeyboard) {
      requestAnimationFrame(() => {
        title.focus();
      });
    }

    refreshMagnetic();
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
    token.setAttribute("aria-pressed", "false");
    token.setAttribute("data-magnetic", "");

    const labelText = project.cover?.label || project.name.slice(0, 3).toUpperCase();
    const roleTitle = ROLE_NAMES[slot.role] || slot.role;

    token.setAttribute("aria-label", `${project.name}, ${roleTitle}`);

    const labelSpan = document.createElement("span");
    labelSpan.className = "token-label";
    labelSpan.textContent = labelText;

    const roleSpan = document.createElement("span");
    roleSpan.className = "token-role";
    roleSpan.textContent = slot.role;

    token.append(labelSpan, roleSpan);

    token.addEventListener("click", (e) => {
      const isKeyboard = e.detail === 0;
      selectProject(index, token, isKeyboard);
    });

    wrapper.appendChild(token);
    pitch.appendChild(wrapper);
  });

  // Re-scan and re-measure magnetic targets
  refreshMagnetic();
}
