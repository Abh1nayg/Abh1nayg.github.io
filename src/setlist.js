import { experience } from './data/experience.js'
import { pluck, canPlay } from './audio/pluck.js'

// Builds "The Setlist": experience (work, education, activities) and certifications,
// numbered like tracks.
export function initSetlist() {
  const root = document.querySelector('#setlist-body')
  if (!root) return

  const groups = [
    { heading: 'Experience', items: experience.filter((e) => e.type !== 'cert') },
    { heading: 'Certifications', items: experience.filter((e) => e.type === 'cert') },
  ].filter((g) => g.items.length)

  root.replaceChildren(...groups.map(buildGroup))
  initNowPlaying(root)
}

// Hovering a track plays a soft note and swaps its number for a little
// equaliser. Notes walk down the strings, high E first.
function initNowPlaying(root) {
  const items = [...root.querySelectorAll('.setlist__item')]
  // pointerenter also fires when the page scrolls under a still cursor, so only
  // count it as a hover if the mouse actually moved just now.
  let lastMove = 0
  window.addEventListener('pointermove', () => { lastMove = performance.now() }, { passive: true })

  items.forEach((li, i) => {
    li.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return
      li.classList.add('is-playing')
      if (performance.now() - lastMove < 120 && canPlay()) pluck(5 - (i % 6), { gain: 0.1 })
    })
    li.addEventListener('pointerleave', () => li.classList.remove('is-playing'))
    li.addEventListener('focusin', () => li.classList.add('is-playing'))
    li.addEventListener('focusout', () => li.classList.remove('is-playing'))
  })
}

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

function buildGroup({ heading, items }) {
  const group = el('div', 'setlist-group')
  group.append(el('h3', null, heading))

  const list = el('ol', 'setlist')
  list.setAttribute('data-stagger', '')
  items.forEach((item, i) => list.append(buildItem(item, i)))
  group.append(list)
  return group
}

function buildItem(item, i) {
  const li = el('li', 'setlist__item')
  const num = el('span', 'setlist__num')
  num.setAttribute('aria-hidden', 'true')
  num.append(el('span', 'setlist__n', String(i + 1).padStart(2, '0')))
  const eq = el('span', 'eq')
  for (let b = 0; b < 4; b++) eq.append(el('i'))
  num.append(eq)
  li.append(num)

  const body = el('div')
  body.append(el('p', 'setlist__title', item.title))
  body.append(el('p', 'setlist__meta', [item.org, item.date].filter(Boolean).join(' · ')))
  if (item.blurb) body.append(el('p', 'setlist__blurb', item.blurb))
  if (item.link) {
    const a = el('a', 'setlist__link', 'Verify credential')
    a.href = item.link
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.setAttribute('aria-label', `Verify credential: ${item.title}`)
    body.append(a)
  }
  li.append(body)
  return li
}
