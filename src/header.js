const header = document.querySelector('.site-header')
const TOP_ZONE = 80
const THRESHOLD = 8

let lastY = window.scrollY
let ticking = false

function update() {
  const y = window.scrollY
  if (y <= TOP_ZONE) {
    header.classList.remove('header--hidden')
    lastY = y
  } else if (Math.abs(y - lastY) >= THRESHOLD) {
    header.classList.toggle('header--hidden', y > lastY)
    lastY = y
  }
  ticking = false
}

export function initHeader() {
  if (!header) return
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(update)
    }
  }, { passive: true })
}
