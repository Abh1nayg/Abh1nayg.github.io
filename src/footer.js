import { links } from './data/links.js'

export function initFooter() {
  let container = document.querySelector('.footer-links')
  if (!container) {
    const parent = document.querySelector('footer .container') || document.querySelector('footer')
    if (!parent) return
    container = document.createElement('nav')
    container.className = 'footer-links'
    container.setAttribute('aria-label', 'Social and Contact')
    parent.appendChild(container)
  }

  const items = [
    { label: 'GitHub', href: links?.github, external: true },
    { label: 'Email', href: links?.email ? `mailto:${links.email}` : null, external: false },
    { label: 'CV', href: links?.cv, external: true },
  ].filter((item) => Boolean(item.href))

  container.replaceChildren(
    ...items.map(({ label, href, external }) => {
      const a = document.createElement('a')
      a.href = href
      a.textContent = label
      if (external) {
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
      }
      return a
    })
  )
}
