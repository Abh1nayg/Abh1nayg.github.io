// Text written behind the guitar as the hero scrolls:
//   phase 1  "Hello" (by the neck) / "there" (by the body)
//   phase 2  "Here's something about me"
//   phase 4  the bio, beside the docked guitar
// Thresholds live in story.js, shared with the guitar's dock timing.
// hero-steps.js holds the writing back while the guitar is still moving, and can
// finish a line instantly when the user scrolls again.
import { STORY, storyUnit } from './story.js'
const PHASES = [
  { until: STORY.helloFrom }, // 0: nothing until the user starts scrolling
  { until: STORY.shiftFrom }, // 1: Hello / there
  { until: STORY.aboutFrom }, // shift: no text while the guitar slides left
  { until: STORY.dockFrom },  // 2: about
  { until: STORY.bioFrom },   // dock: no text while the guitar moves
  { until: STORY.bioTo },     // 4: bio
  { until: Infinity },        // cleared before the intro section arrives
]

const TEXT = {
  hello: 'Hello',
  there: 'there',
  about: "Here's something about me",
  bio: "I am a fanatic for linux, currently working with Arch on WSL",
}

// Typing rhythm in ms: roughly 11–12 characters a second, a comfortable typing
// speed, with short pauses after words and longer ones after punctuation.
const TYPE = {
  start: 220,   // before the first character
  base: 62,     // every character
  jitter: 34,   // random extra per character, so it doesn't feel mechanical
  space: 70,    // extra after a space
  punct: 260,   // extra after . , '
  lineGap: 320, // between two lines of the same phase ("Hello" → "there")
}

export function initHeroText() {
  const root = document.querySelector('#hero-text')
  const noop = { sync() {}, hold() {}, busy: () => false, finish() {} }
  if (!root) return noop
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const lines = [...root.querySelectorAll('.hero-text__line')].map((el) => {
    const key = [...el.classList].find((c) => c.startsWith('hero-text__') && c !== 'hero-text__line').slice(11)
    el.classList.add('is-gone')
    return { el, text: TEXT[key], phase: Number(el.dataset.phase) }
  })

  let current = -1
  let held = false    // true while the guitar is moving to its stop
  let pending = false // a phase is waiting for hold to lift
  let typing = false  // a phase is part-way through being written
  let timer = 0
  let caretTimer = 0

  const phaseLines = () => lines.filter((l) => l.phase === current)

  function clearTimers() {
    clearTimeout(timer)
    clearTimeout(caretTimer)
  }

  function show(line) {
    line.el.textContent = line.text
    line.el.classList.remove('is-gone', 'is-writing')
  }

  function erase(line) {
    line.el.classList.remove('is-writing')
    line.el.classList.add('is-gone')
  }

  // Writes the phase's lines one after another.
  function startPhase() {
    clearTimers()
    const queue = phaseLines()
    if (!queue.length) return
    if (reduceMotion) {
      queue.forEach(show)
      return
    }
    queue.forEach((l) => { l.el.textContent = '' })
    typing = true

    let li = 0
    let i = 0
    const step = () => {
      const line = queue[li]
      line.el.classList.remove('is-gone')
      line.el.classList.add('is-writing')
      line.el.textContent = line.text.slice(0, ++i)
      if (i < line.text.length) {
        const ch = line.text[i - 1]
        const pause = ch === ' ' ? TYPE.space : /[.,']/.test(ch) ? TYPE.punct : 0
        timer = setTimeout(step, TYPE.base + Math.random() * TYPE.jitter + pause)
        return
      }
      // Line done: keep the caret blinking briefly, then move to the next line.
      const done = line
      caretTimer = setTimeout(() => done.el.classList.remove('is-writing'), 700)
      li++
      i = 0
      if (li < queue.length) timer = setTimeout(step, TYPE.lineGap)
      else typing = false
    }
    timer = setTimeout(step, TYPE.start)
  }

  function update() {
    const s = window.scrollY / storyUnit()
    const phase = PHASES.findIndex((p) => s < p.until)
    if (phase === current) return
    current = phase
    clearTimers()
    typing = false
    lines.forEach(erase)
    if (held) pending = phaseLines().length > 0
    else startPhase()
  }

  update()
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)

  return {
    // Re-read the scroll position now (after a programmatic jump).
    sync: update,
    // While held, text for a newly reached phase waits instead of starting.
    hold(value) {
      held = value
      if (!held && pending) {
        pending = false
        startPhase()
      }
    },
    busy: () => pending || typing,
    // Show the current phase's text in full, straight away.
    finish() {
      clearTimers()
      pending = false
      typing = false
      phaseLines().forEach(show)
    },
  }
}
