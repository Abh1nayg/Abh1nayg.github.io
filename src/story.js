// Scroll choreography for the hero, in viewport heights of scroll (scrollY / innerHeight).
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
