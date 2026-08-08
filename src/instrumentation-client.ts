const KNOWN_EXTENSION_ATTRIBUTES = [
  'bis_skin_checked',
  'bis_register',
  'data-lt-installed',
  'data-lt-temp-id',
  'data-extension-installed',
  'form_signature',
  'alternative_form_signature',
  'field_signature',
  'visibility_annotation',
]

const stripExtensionAttributes = () => {
  for (const el of document.querySelectorAll('*')) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('bis_')) {
        el.removeAttribute(attr.name)
      }
    }

    for (const name of KNOWN_EXTENSION_ATTRIBUTES) {
      if (el.hasAttribute(name)) {
        el.removeAttribute(name)
      }
    }
  }
}

const stripHtml = () => {
  const html = document.documentElement
  if (!html) return
  for (const attr of Array.from(html.attributes)) {
    if (
      attr.name.startsWith('bis_') ||
      KNOWN_EXTENSION_ATTRIBUTES.includes(attr.name)
    ) {
      html.removeAttribute(attr.name)
    }
  }
}

try {
  stripHtml()
  stripExtensionAttributes()

  // Belt-and-suspenders: watches for late-injecting extensions.
  // catch extensions that inject late, during the hydration window,
  // then stop observing once hydration has settled.
  const observer = new MutationObserver(() => {
    stripHtml()
    stripExtensionAttributes()
  })
  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
  })
  setTimeout(() => observer.disconnect(), 5000)
} catch {
  // Never let extension-cleanup break the app.
}
