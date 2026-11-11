import { projects } from "./data/projects";
import { getSlots } from "./data/formations";
import { refreshMagnetic } from "./magnetic";
import { ROLE_NAMES, buildCard } from "./card";

export function initSquad() {
  const pitch = document.getElementById("pitch");
  if (!pitch) return;

  // Prevent duplicate tokens if called multiple times
  if (pitch.querySelector(".squad-slot")) return;

  const squadSize = projects.length;
  const slots = getSlots(squadSize);
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

    const { nodes, title } = buildCard(project, slot, {
      closable: true,
      focusableTitle: true,
      onClose: deselectProject,
    });
    cardContainer.replaceChildren(...nodes);

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

    const drag = makeDraggable(wrapper, token, pitch);

    token.addEventListener("click", (e) => {
      if (drag.justDragged()) return; // a drag ends with a click; don't open the card
      const isKeyboard = e.detail === 0;
      selectProject(index, token, isKeyboard);
    });

    wrapper.appendChild(token);
    pitch.appendChild(wrapper);
  });

  // Re-scan and re-measure magnetic targets
  refreshMagnetic();
}

// Tokens can be dragged around the pitch; on release they spring back to their
// slot in the formation. The wrapper moves (CSS translate) so the token's own
// transform stays free for the magnetic pull.
function makeDraggable(wrapper, token, pitch) {
  const THRESHOLD = 6; // px before a press becomes a drag
  let start = null;
  let dragging = false;
  let suppress = false;

  token.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const p = pitch.getBoundingClientRect();
    const w = wrapper.getBoundingClientRect();
    const cx = w.left + w.width / 2;
    const cy = w.top + w.height / 2;
    start = {
      id: e.pointerId, x: e.clientX, y: e.clientY,
      // Keep the token's centre on the pitch.
      minX: p.left - cx, maxX: p.right - cx,
      minY: p.top - cy, maxY: p.bottom - cy,
    };
    dragging = false;
    token.setPointerCapture(e.pointerId); // keep receiving moves if the cursor outruns the token
  });

  token.addEventListener("pointermove", (e) => {
    if (!start || e.pointerId !== start.id) return;
    let dx = e.clientX - start.x;
    let dy = e.clientY - start.y;
    if (!dragging) {
      if (Math.hypot(dx, dy) < THRESHOLD) return;
      dragging = true;
      wrapper.classList.add("is-dragging");
    }
    dx = Math.min(start.maxX, Math.max(start.minX, dx));
    dy = Math.min(start.maxY, Math.max(start.minY, dy));
    wrapper.style.translate = `${dx}px ${dy}px`;
  });

  const end = (e) => {
    if (!start || e.pointerId !== start.id) return;
    start = null;
    if (!dragging) return;
    dragging = false;
    wrapper.classList.remove("is-dragging");
    wrapper.style.translate = ""; // CSS transition springs it back
    suppress = true;
    setTimeout(() => { suppress = false; }, 0);
  };
  token.addEventListener("pointerup", end);
  token.addEventListener("pointercancel", end);

  return { justDragged: () => suppress };
}
