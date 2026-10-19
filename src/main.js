import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/800.css'
import '@fontsource-variable/inter'
import './style.css'
import {initHero} from './three/scene.js'
import {pluck} from './audio/pluck.js'
import {initHeader} from './header.js'
import {initSquad} from './squad.js'
import {initMagnetic} from './magnetic.js'
import {initReveal} from './reveal.js'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const targets = ['#squad', '#incoming', '#setlist', '#contact']
initHeader()
initSquad()
initMagnetic()
initReveal()

const heroCanvas = document.querySelector('#hero-canvas')
initHero(heroCanvas, {
  onPluck(index) {
    pluck(index)
    const target = targets[index]
    if (target) {
      // Wait so the note is heard before the page scrolls.
      setTimeout(() => {
        document.querySelector(target)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
      }, 300)
    }
  }
})
