import '@fontsource-variable/fraunces'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/inter'
import './style.css'
import './themes.css'
import {initTheme} from './theme.js'
import {initHero} from './three/scene.js'
import {pluck} from './audio/pluck.js'
import {initHeader} from './header.js'
import {initSquad} from './squad.js'
import {initGrid} from './grid.js'
import {initMagnetic} from './magnetic.js'
import {initReveal} from './reveal.js'
import {initContact} from './contact.js'
import {initSetlist} from './setlist.js'
import {initHeroText} from './hero-text.js'
import {initHeroSteps} from './hero-steps.js'
import {initPickCursor} from './cursor.js'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
// Index-mapped to guitar strings: string 0 = intro, 1 = squad, 2 = setlist, 3 = contact.
const targets = ['#intro', '#squad', '#setlist', '#contact']
initTheme()
initHeader()
initSquad()
initGrid()
initSetlist()
const heroText = initHeroText()
initMagnetic()
initReveal()
initContact()

const heroCanvas = document.querySelector('#hero-canvas')
const hero = initHero(heroCanvas, {
  vinyl: document.querySelector('#vinyl'),
  onPluck(index) {
    pluck(index)
    hero?.vibrate(index)
    const target = targets[index]
    if (target) {
      steps.cancel({ suppressText: true })
      // Wait so the note is heard before the page scrolls.
      setTimeout(() => {
        document.querySelector(target)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
      }, 300)
    }
  }
})
const steps = initHeroSteps({ scene: hero, text: heroText })
initPickCursor()

// Keys 1–6 play the six strings (low E to high E), without scrolling anywhere.
window.addEventListener('keydown', (e) => {
  if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return
  if (!/^[1-6]$/.test(e.key)) return
  if (e.target.closest?.('input, textarea, select, [contenteditable]')) return
  const index = Number(e.key) - 1
  pluck(index)
  hero?.vibrate(index)
  document.documentElement.classList.add('has-played')
})

// Each section's guitar string shakes and glows when the section scrolls into view.
const sectionIO = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue
    const index = targets.indexOf(`#${entry.target.id}`)
    if (index >= 0) hero?.vibrate(index)
  }
}, { threshold: 0.35 })
targets.forEach((sel) => {
  const el = document.querySelector(sel)
  if (el) sectionIO.observe(el)
})
