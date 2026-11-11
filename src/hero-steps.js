// Stepped scrolling through the hero. Each scroll gesture (wheel, swipe or key)
// glides to the next stop in STOPS, the guitar moves into place, and only then is
// the text written. A second gesture while that is still happening finishes it
// instantly (guitar snapped, text shown in full); the one after moves on.
// Past the last stop (the intro section) the page scrolls normally.
import { STOPS, storyUnit } from './story.js'

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const GESTURE_GAP = 180      // ms of wheel silence that separates two gestures
const GESTURE_COOLDOWN = 260 // ms minimum between same-direction wheel gestures
const SWIPE_PX = 36          // finger travel that counts as a swipe

export function initHeroSteps({ scene, text }) {
  const root = document.documentElement
  const intro = document.querySelector('#intro')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const endStop = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    return Math.min(intro ? intro.offsetTop : Infinity, max)
  }
  const stops = () => [...STOPS.map((s) => s * storyUnit()), endStop()]

  // Hint classes: "scroll" cue at the very top, key hint anywhere in the hero.
  function markHero() {
    const y = window.scrollY
    root.classList.toggle('hero-top', y < 0.05 * storyUnit())
    root.classList.toggle('in-hero', y < endStop() - 0.5 * storyUnit())
  }
  markHero()
  window.addEventListener('scroll', markHero, { passive: true })
  window.addEventListener('resize', markHero)

  if (reduceMotion) return { cancel() {} }

  let tween = null
  let lastDir = 1
  let navHoldTimer = 0

  // Jump without the CSS smooth scrolling on <html> getting in the way.
  function setY(y) {
    root.style.scrollBehavior = 'auto'
    window.scrollTo(0, y)
    root.style.scrollBehavior = ''
  }

  function cancel({ suppressText = false } = {}) {
    clearTimeout(navHoldTimer)
    if (tween) {
      cancelAnimationFrame(tween.raf)
      tween = null
    }
    if (suppressText) {
      text.hold(true)
      const releaseWhenIdle = () => {
        clearTimeout(navHoldTimer)
        navHoldTimer = setTimeout(() => {
          window.removeEventListener('scroll', releaseWhenIdle)
          text.sync()
          text.hold(false)
        }, 160)
      }
      window.addEventListener('scroll', releaseWhenIdle, { passive: true })
      releaseWhenIdle()
    } else {
      text.hold(false)
    }
  }

  function tweenTo(to, dir) {
    cancel()
    lastDir = dir
    const from = window.scrollY
    const dist = Math.abs(to - from) / storyUnit()
    const duration = Math.min(1350, 320 + dist * 550)
    const t0 = performance.now()
    text.hold(true) // text waits until the guitar has arrived in position
    tween = { to, raf: 0 }
    const step = (now) => {
      const k = Math.min(1, (now - t0) / duration)
      setY(from + (to - from) * easeInOut(k))
      if (k < 1 || scene?.moving()) {
        tween.raf = requestAnimationFrame(step)
        return
      }
      tween = null
      text.sync()
      text.hold(false)
    }
    tween.raf = requestAnimationFrame(step)
  }

  function finish() {
    if (tween) {
      const to = tween.to
      cancelAnimationFrame(tween.raf)
      tween = null
      setY(to)
    }
    scene?.snap()
    text.sync()
    text.hold(false)
    text.finish()
  }

  const busy = () => !!tween || text.busy()

  function gesture(dir) {
    const reversing = tween && dir !== lastDir
    if (busy() && !reversing) {
      finish()
      return
    }
    const y = window.scrollY
    const list = stops()
    let to
    if (dir > 0) to = list.find((s) => s > y + 2)
    else for (const s of list) if (s < y - 2) to = s
    if (to === undefined) return
    tweenTo(to, dir)
  }

  // Inside the hero, or at its last stop and heading back up.
  function captures(dir) {
    const y = window.scrollY
    const end = endStop()
    return y < end - 2 || (dir < 0 && y <= end + 2)
  }

  // ── Wheel / trackpad ──────────────────────────────────────────────────────
  // A trackpad flick sends a rising ramp of deltas followed by a long decaying
  // inertia tail. A new gesture is either a pause in events, a direction flip,
  // or a sharp spike after the deltas had already started decaying.
  let lastWheel = 0
  let lastGestureAt = -Infinity
  let lastMag = 0
  let lastWheelDir = 0
  let falling = false
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return // pinch zoom / sideways
    const dir = Math.sign(e.deltaY)
    if (!dir || !captures(dir)) return
    e.preventDefault()
    const now = performance.now()
    const mag = Math.abs(e.deltaY)
    const gap = now - lastWheel > GESTURE_GAP
    const flipped = dir !== lastWheelDir
    const reaccel = falling && mag > 25 && mag > lastMag * 1.8
    const cooledDown = flipped || now - lastGestureAt > GESTURE_COOLDOWN

    if (gap || flipped) falling = false
    else if (mag < lastMag * 0.85) falling = true

    lastWheel = now
    lastMag = mag
    lastWheelDir = dir

    if (cooledDown && (gap || flipped || reaccel)) {
      falling = false
      lastGestureAt = now
      gesture(dir)
    }
  }, { passive: false })

  // ── Touch ─────────────────────────────────────────────────────────────────
  let touch = null
  window.addEventListener('touchstart', (e) => {
    touch = e.touches.length === 1 ? { y: e.touches[0].clientY, mine: null, fired: false } : null
  }, { passive: true })
  window.addEventListener('touchmove', (e) => {
    if (!touch) return
    const dy = touch.y - e.touches[0].clientY
    if (touch.mine === null) {
      if (Math.abs(dy) < 4) return
      touch.mine = captures(Math.sign(dy)) // decided once, on the first real move
    }
    if (!touch.mine) return
    if (e.cancelable) e.preventDefault()
    if (!touch.fired && Math.abs(dy) > SWIPE_PX) {
      touch.fired = true
      gesture(Math.sign(dy))
    }
  }, { passive: false })
  window.addEventListener('touchend', () => { touch = null }, { passive: true })

  // ── Keyboard ──────────────────────────────────────────────────────────────
  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return
    let dir = 0
    if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1
    else if (e.key === ' ' && !e.target.closest?.('a, button')) dir = e.shiftKey ? -1 : 1
    if (!dir || !captures(dir)) return
    e.preventDefault()
    if (!e.repeat) gesture(dir)
  })

  // In-page links and string plucks take over the scroll.
  document.addEventListener('click', (e) => {
    if (e.target.closest?.('a[href^="#"]')) cancel({ suppressText: true })
  })

  return { cancel }
}
