// Keyed by squad size. Slots are in importance order: project N goes in slot N.
export const formation = {
  4: [
    { x: 50, y: 20, role: 'ST' },
    { x: 25, y: 50, role: 'CM' },
    { x: 75, y: 50, role: 'CM' },
    { x: 50, y: 78, role: 'CB' },
  ],
}

// Single source for slot lookup; falls back to the 4-player layout.
// Entries may be undefined if there are more projects than slots.
export function getSlots(count) {
  return formation[count] || formation[4] || Object.values(formation)[0] || []
}
