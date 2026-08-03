/**
 * Strips attributes injected by browser extensions (e.g. `bis_skin_checked`,
 * `bis_register` from SpeakIt / Urban VPN / hover-tracker / CAPTCHA-solver
 * extensions) from the DOM *before React hydrates*.
 *
 * `instrumentation-client.ts` executes after the HTML document is loaded but
 * before React hydration begins, so removing these attributes here prevents
 * the false "server-rendered HTML didn't match client properties" hydration
 * errors in development. This is purely defensive — real users without such
 * extensions never see these attributes, so this is a no-op for them.
 */

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
    // Remove any attribute that starts with a known extension prefix (bis_)
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('bis_')) {
        el.removeAttribute(attr.name)
      }
    }

    // Remove known exact-match attributes
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

  // Belt-and-suspenders: catch extensions that inject late, during the
  // hydration window, then stop observing once hydration has settled.
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
