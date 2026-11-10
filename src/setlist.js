import { experience } from './data/experience.js'

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
  li.append(el('span', 'setlist__num', String(i + 1).padStart(2, '0')))
  li.lastChild.setAttribute('aria-hidden', 'true')

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
