// A guitar-pick cursor (mouse/trackpad only). The pick's tip is the hotspot; it
// leans with horizontal speed, grows over anything clickable (links, buttons,
// pitch tokens, the guitar strings) and dips when pressed.
const CLICKABLE = 'a, button, [role="button"], label, summary'

export function initPickCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const root = document.documentElement

  const el = document.createElement('div')
  el.className = 'pick-cursor'
  el.setAttribute('aria-hidden', 'true')
  // Tip at (12, 23), the bottom of the viewBox; rotated so it points up-left.
  el.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 1.2C18.6 1.2 22.8 3.9 22.8 8.6C22.8 14.4 16 21.4 12 22.8C8 21.4 1.2 14.4 1.2 8.6C1.2 3.9 5.4 1.2 12 1.2Z"/></svg>'
  document.body.append(el)
  root.classList.add('has-pick')

  let x = -100
  let y = -100
  let lastX = x
  let tilt = 0
  let raf = 0

  function render() {
    // Lean into the direction of travel, settling back to upright.
    const target = reduceMotion ? 0 : Math.max(-28, Math.min(28, (x - lastX) * 1.6))
    lastX = x
    tilt += (target - tilt) * 0.18
    el.style.transform = `translate3d(${x - 12}px, ${y - 23}px, 0) rotate(${(135 + tilt).toFixed(2)}deg)`
    raf = Math.abs(tilt) > 0.05 || Math.abs(target) > 0.05 ? requestAnimationFrame(render) : 0
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    x = e.clientX
    y = e.clientY
    el.classList.add('is-visible')
    const over = !!e.target.closest?.(CLICKABLE) || root.classList.contains('is-over-string')
    el.classList.toggle('is-hover', over)
    if (!raf) raf = requestAnimationFrame(render)
  }, { passive: true })

  window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') el.classList.add('is-down') })
  window.addEventListener('pointerup', () => el.classList.remove('is-down'))
  root.addEventListener('mouseleave', () => el.classList.remove('is-visible'))
  root.addEventListener('mouseenter', () => el.classList.add('is-visible'))
}

