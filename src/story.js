// Scroll choreography for the hero, in "screens" of scroll (scrollY / storyUnit()).
// The guitar holds still while each line of text is on screen. It moves only in
// the gaps: a part-way slide left before "about", then the full dock (or fade on
// mobile) before the bio.
// The last value must fit inside the .hero height in style.css (360svh = 3.6 screens,
// so the intro section starts entering at 2.6).
export const STORY = {
  helloFrom: 0.03,  // "Hello" / "there"
  shiftFrom: 0.42,  // Hello/there cleared, guitar slides part-way left
  shiftTo: 0.6,
  aboutFrom: 0.6,   // "Here's something about me", right of the guitar
  dockFrom: 1.1,    // text cleared, guitar moves
  dockTo: 1.7,
  bioFrom: 1.75,    // bio beside the docked guitar
  bioTo: 2.5,       // cleared before the intro arrives
}

// Resting points for stepped scrolling (hero-steps.js). One scroll gesture moves
// to the next stop; the final stop (the intro section) is measured at runtime.
export const STOPS = [
  0,     // just the guitar
  0.16,  // Hello / there
  0.72,  // about
  1.88,  // bio, guitar docked
]

// Must match the .hero height in style.css.
export const HERO_SCREENS = 3.6

// One "screen" of story scroll, in px. Measured from the hero's real height
// (svh) instead of window.innerHeight, which grows and shrinks with the mobile
// address bar and would push the text out of step with the page.
const hero = document.querySelector('.hero')
let unit = window.innerHeight
function measure() {
  const h = hero?.offsetHeight
  unit = h ? h / HERO_SCREENS : window.innerHeight
}
measure()
if (hero) new ResizeObserver(measure).observe(hero)
window.addEventListener('resize', measure)

export function storyUnit() {
  if (!unit && hero) measure()
  return unit || window.innerHeight
}
