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

  projects.forEach((project, index) => {
    const slot = slots[index];
    if (!slot) return;

    // Centering wrapper positioned at slot percentages
    const wrapper = document.createElement("div");
    wrapper.className = "squad-slot";
    wrapper.style.left = `${slot.x}%`;
    wrapper.style.top = `${slot.y}%`;
    wrapper.style.setProperty("--i", index);

    // Interactive token button inside wrapper
    const token = document.createElement("button");
    token.type = "button";
    token.className = "squad-token";
    token.setAttribute("data-magnetic", "");

    const [bgColor, textColor] = project.cover?.colors || ["#0b0b0f", "#d9d9d9"];
    const label = project.cover?.label || project.name.slice(0, 3).toUpperCase();
    const roleTitle = ROLE_NAMES[slot.role] || slot.role;

    token.setAttribute("aria-label", `${project.name}, ${roleTitle}`);
    token.setAttribute("data-accent", textColor);
    token.style.setProperty("--token-bg", bgColor);
    token.style.setProperty("--token-color", textColor);
    token.style.setProperty("--bloom", textColor);

    if (project.tagline) {
      token.setAttribute("title", `${project.name} (${slot.role}): ${project.tagline}`);
    }

    if (project.repo) {
      token.addEventListener("click", () => {
        window.open(project.repo, "_blank", "noopener,noreferrer");
      });
    }

    token.innerHTML = `
      <span class="token-label">${label}</span>
      <span class="token-role">${slot.role}</span>
    `;

    wrapper.appendChild(token);
    pitch.appendChild(wrapper);
  });

  // Re-scan and re-measure magnetic targets now that JS has added them to DOM
  refreshMagnetic();
}
