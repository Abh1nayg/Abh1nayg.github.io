import { projects } from "./data/projects";
import { getSlots } from "./data/formations";
import { buildCard } from "./card";

export function initGrid() {
  const grid = document.getElementById("project-grid");
  if (!grid || grid.children.length) return;

  const slots = getSlots(projects.length);

  projects.forEach((project, index) => {
    const { nodes } = buildCard(project, slots[index], {
      closable: false,
      focusableTitle: false,
    });

    // buildCard returns child nodes only, so the wrapper element is created here
    const card = document.createElement("article");
    card.className = "project-card";
    card.setAttribute("data-accent", project.accent || "brick");
    card.replaceChildren(...nodes);
    grid.appendChild(card);
  });
}
