import { setGuitarTheme } from './three/guitar.js'

// Theme candidates. Pick with the switcher button, or ?theme=studio in the URL.
// The choice is remembered in localStorage.
const THEMES = ['editorial', 'studio']
const LABELS = { editorial: 'Editorial dark', studio: 'Studio' }
const KEY = 'theme'

function apply(name) {
  document.documentElement.dataset.theme = name
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--paper').trim())
  setGuitarTheme(name)
  localStorage.setItem(KEY, name)
  const btn = document.querySelector('.theme-switch')
  if (btn) btn.textContent = `Theme: ${LABELS[name]}`
}

export function initTheme() {
  const fromUrl = new URLSearchParams(location.search).get('theme')
  const saved = localStorage.getItem(KEY)
  const start = [fromUrl, saved].find((t) => THEMES.includes(t)) ?? THEMES[0]

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'theme-switch'
  btn.addEventListener('click', () => {
    const next = THEMES[(THEMES.indexOf(document.documentElement.dataset.theme) + 1) % THEMES.length]
    apply(next)
  })
  document.body.append(btn)
  apply(start)
}
