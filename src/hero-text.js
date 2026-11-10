// Text written behind the guitar as the hero scrolls:
//   phase 1  "Hello" (by the neck) / "there" (by the body)
//   phase 2  "Here's something about me"
//   phase 4  the bio, beside the docked guitar
// Thresholds live in story.js, shared with the guitar's dock timing.
import { STORY } from './story.js'
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
  bio: "I did my high school in Nepal and I'm a CS student in Bangalore.",
}

export function initHeroText() {
  const root = document.querySelector('#hero-text')
  if (!root) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const lines = [...root.querySelectorAll('.hero-text__line')].map((el) => {
    const key = [...el.classList].find((c) => c.startsWith('hero-text__') && c !== 'hero-text__line').slice(11)
    el.classList.add('is-gone')
    return { el, text: TEXT[key], phase: Number(el.dataset.phase), timer: 0 }
  })

  let current = -1

  function write(line, delay) {
    clearTimeout(line.timer)
    line.el.textContent = ''
    line.el.classList.remove('is-gone')
    if (reduceMotion) {
      line.el.textContent = line.text
      return
    }
    let i = 0
    const step = () => {
      line.el.classList.add('is-writing')
      line.el.textContent = line.text.slice(0, ++i)
      if (i < line.text.length) {
        // Uneven rhythm, with a pause after spaces and punctuation, reads as "being written".
        const ch = line.text[i - 1]
        const pause = ch === ' ' ? 65 : /[.,']/.test(ch) ? 140 : 0
        line.timer = setTimeout(step, 34 + Math.random() * 28 + pause)
      } else {
        line.timer = setTimeout(() => line.el.classList.remove('is-writing'), 800)
      }
    }
    line.timer = setTimeout(step, delay)
  }

  function erase(line) {
    clearTimeout(line.timer)
    line.el.classList.remove('is-writing')
    line.el.classList.add('is-gone')
  }

  function update() {
    const s = window.scrollY / window.innerHeight
    const phase = PHASES.findIndex((p) => s < p.until)
    if (phase === current) return
    current = phase
    let order = 0
    for (const line of lines) {
      if (line.phase === phase) write(line, 220 + order++ * 420) // "there" follows "Hello"
      else erase(line)
    }
  }

  update()
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
}
