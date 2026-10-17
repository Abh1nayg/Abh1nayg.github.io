const SELECTOR = '[data-magnetic], [data-glow]'
const EASE = 0.12
const SETTLE = 0.01
const MIN_RADIUS = 90
const MAX_RADIUS = 320
const GLOW_REACH = 60 // px outside a glow element's box where the glow still fades in
const SCROLL_IDLE = 150 // ms of no scrolling before the pull resumes
const VIEW_MARGIN = '100px'

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// Small things lean the most (0.3); big blocks lean much less (0.1).
function defaultStrength(size) {
  return 0.3 - clamp01((size - 120) / 280) * 0.2
}

let api = null

/** Re-scan the document for new/removed targets and re-measure everything. */
export function refreshMagnetic() {
  api?.refresh()
}

export function initMagnetic() {
  if (api) return api
  if (!window.matchMedia('(pointer: fine)').matches) return null

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const items = new Map() // element -> item
  const visible = new Set() // items currently on screen (plus margin)
  let lastPointer = null
  let scrolling = false
  let scrollTimer = 0
  let measureQueued = false
  let raf = 0

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const it = items.get(entry.target)
      if (!it) continue
      if (entry.isIntersecting) {
        visible.add(it)
      } else {
        visible.delete(it)
        reset(it)
      }
    }
  }, { rootMargin: VIEW_MARGIN })

  function isFixed(el) {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const p = getComputedStyle(n).position
      if (p === 'fixed' || p === 'sticky') return true
    }
    return false
  }

  function register(el) {
    if (items.has(el)) return
    const user = parseFloat(el.dataset.strength)
    items.set(el, {
      el,
      glow: !el.hasAttribute('data-magnetic'),
      userStrength: Number.isFinite(user) ? user : null,
      fixed: isFixed(el),
      cx: 0, cy: 0, w: 0, h: 0, radius: MIN_RADIUS, strength: 0,
      x: 0, y: 0, pull: 0,
      tx: 0, ty: 0, tpull: 0,
      mx: 0, my: 0,
    })
    io.observe(el)
    scheduleMeasure()
  }

  function unregister(el) {
    const it = items.get(el)
    if (!it) return
    io.unobserve(el)
    visible.delete(it)
    items.delete(el)
  }

  function reset(it) {
    it.x = it.y = it.pull = it.tx = it.ty = it.tpull = 0
    it.el.style.transform = ''
    it.el.style.removeProperty('--pull')
  }

  // Cache the resting centre in page coordinates (viewport coordinates for
  // fixed/sticky elements). The element's own offset is subtracted so the
  // cache never includes its movement, which would cause jitter.
  function measure(it) {
    const r = it.el.getBoundingClientRect()
    const ox = it.fixed ? 0 : window.scrollX
    const oy = it.fixed ? 0 : window.scrollY
    const size = Math.max(r.width, r.height)
    it.w = r.width
    it.h = r.height
    it.cx = r.left + r.width / 2 - it.x + ox
    it.cy = r.top + r.height / 2 - it.y + oy
    it.radius = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, 1.5 * size))
    it.strength = it.glow || reduceMotion
      ? 0
      : (it.userStrength ?? defaultStrength(size))
  }

  function measureAll() {
    for (const it of items.values()) measure(it)
  }

  function scheduleMeasure() {
    if (measureQueued) return
    measureQueued = true
    requestAnimationFrame(() => {
      measureQueued = false
      measureAll()
    })
  }

  function update(p) {
    lastPointer = p
    if (scrolling) return
    for (const it of visible) {
      const vcx = it.cx - (it.fixed ? 0 : window.scrollX)
      const vcy = it.cy - (it.fixed ? 0 : window.scrollY)
      const dx = p.clientX - vcx
      const dy = p.clientY - vcy

      let prox
      if (it.glow) {
        // Full strength anywhere inside the box, fading out just beyond it.
        const ex = Math.max(Math.abs(dx) - it.w / 2, 0)
        const ey = Math.max(Math.abs(dy) - it.h / 2, 0)
        prox = clamp01(1 - Math.hypot(ex, ey) / GLOW_REACH)
      } else {
        prox = clamp01(1 - Math.hypot(dx, dy) / it.radius)
      }

      it.tpull = prox
      it.tx = dx * it.strength * prox
      it.ty = dy * it.strength * prox
      // Cursor position inside the element's current (moved) box.
      it.mx = p.clientX - (vcx + it.x - it.w / 2)
      it.my = p.clientY - (vcy + it.y - it.h / 2)
    }
    start()
  }

  function release() {
    for (const it of visible) it.tx = it.ty = it.tpull = 0
    start()
  }

  function frame() {
    let moving = false
    for (const it of visible) {
      it.x += (it.tx - it.x) * EASE
      it.y += (it.ty - it.y) * EASE
      it.pull += (it.tpull - it.pull) * EASE

      if (Math.abs(it.tx - it.x) < SETTLE && Math.abs(it.ty - it.y) < SETTLE && Math.abs(it.tpull - it.pull) < SETTLE) {
        it.x = it.tx
        it.y = it.ty
        it.pull = it.tpull
      } else {
        moving = true
      }

      const s = it.el.style
      if (!it.glow) s.transform = `translate(${it.x.toFixed(2)}px, ${it.y.toFixed(2)}px)`
      s.setProperty('--pull', it.pull.toFixed(3))
      s.setProperty('--mx', it.mx.toFixed(1))
      s.setProperty('--my', it.my.toFixed(1))
    }
    raf = moving ? requestAnimationFrame(frame) : 0
  }

  function start() {
    if (!raf && !document.hidden) raf = requestAnimationFrame(frame)
  }

  function stop() {
    cancelAnimationFrame(raf)
    raf = 0
  }

  function scan(root) {
    if (root.matches?.(SELECTOR)) register(root)
    root.querySelectorAll?.(SELECTOR).forEach(register)
  }

  function cleanup() {
    for (const el of [...items.keys()]) if (!el.isConnected) unregister(el)
  }

  function refresh() {
    cleanup()
    scan(document)
    scheduleMeasure()
  }

  // Pointer, scroll, layout and tab events.
  window.addEventListener('pointermove', update, { passive: true })
  document.documentElement.addEventListener('pointerleave', release)
  window.addEventListener('blur', release)

  window.addEventListener('scroll', () => {
    // Pause the pull while scrolling, then resume from the last pointer position.
    if (!scrolling) {
      scrolling = true
      release()
    }
    clearTimeout(scrollTimer)
    scrollTimer = setTimeout(() => {
      scrolling = false
      if (lastPointer) update(lastPointer)
    }, SCROLL_IDLE)
  }, { passive: true })

  window.addEventListener('resize', scheduleMeasure)
  window.addEventListener('load', scheduleMeasure)
  document.fonts?.ready.then(scheduleMeasure)
  document.addEventListener('load', scheduleMeasure, true) // images finishing
  new ResizeObserver(scheduleMeasure).observe(document.body)
  // The header slides in and out, so re-measure when it finishes moving.
  document.addEventListener('transitionend', (e) => {
    if (e.target.closest?.('.site-header')) scheduleMeasure()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop()
    else release()
  })

  // Pick up targets that JS creates later, with no extra code.
  new MutationObserver((mutations) => {
    let removed = false
    for (const m of mutations) {
      m.addedNodes.forEach((n) => { if (n.nodeType === 1) scan(n) })
      if (m.removedNodes.length) removed = true
    }
    if (removed) cleanup()
  }).observe(document.body, { childList: true, subtree: true })

  scan(document)
  api = { refresh }
  return api
}
