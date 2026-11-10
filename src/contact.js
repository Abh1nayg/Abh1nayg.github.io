import { links } from './data/links.js'

// Fills the "Make an offer" section with GitHub, Email and CV links.
export function initContact() {
  const container = document.querySelector('.contact-links')
  if (!container) return

  const items = [
    { label: 'GitHub', href: links?.github, external: true },
    { label: 'Credly', href: links?.credly, external: true },
    { label: 'Email', href: links?.email ? `mailto:${links.email}` : null, external: false },
    { label: 'CV', href: links?.cv, external: true },
  ].filter((item) => Boolean(item.href))

  container.replaceChildren(
    ...items.map(({ label, href, external }) => {
      const a = document.createElement('a')
      a.href = href
      a.textContent = label
      a.setAttribute('data-magnetic', '')
      if (external) {
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
      }
      return a
    })
  )
}
