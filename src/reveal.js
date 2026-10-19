import { refreshMagnetic } from './magnetic.js'

export function initReveal() {
  const root = document.documentElement
  root.classList.add('js')

  const sections = document.querySelectorAll('section:not(.hero)')

  // Give list children an index for the CSS stagger delay.
  document.querySelectorAll('[data-stagger]').forEach((list) => {
    [...list.children].forEach((child, i) => child.style.setProperty('--i', i))
  })

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    sections.forEach((s) => s.classList.add('is-visible'))
    return
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const section = entry.target
      section.classList.add('is-visible')
      io.unobserve(section) // play once

      // When the section finishes sliding up, re-measure magnetic target positions
      function onTransitionEnd(e) {
        if (e.target === section && (e.propertyName === 'transform' || e.propertyName === 'opacity')) {
          section.removeEventListener('transitionend', onTransitionEnd)
          refreshMagnetic()
        }
      }
      section.addEventListener('transitionend', onTransitionEnd)
    }
  }, { threshold: 0.15 })

  sections.forEach((s) => io.observe(s))
}
