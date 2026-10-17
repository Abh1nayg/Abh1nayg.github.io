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
      entry.target.classList.add('is-visible')
      io.unobserve(entry.target) // play once
    }
  }, { threshold: 0.15 })

  sections.forEach((s) => io.observe(s))
}
