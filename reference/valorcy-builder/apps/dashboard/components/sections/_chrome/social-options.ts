/**
 * Icon choices offered by the footer social editor.
 *
 * Kept as a shared constant because every footer preset used to declare its own
 * identical copy next to a local `SOCIAL_ICONS` map. Values are stored on the
 * section props, so the historical PascalCase spellings stay valid — the
 * renderer normalises them through `iconKey`.
 */
export const SOCIAL_ICON_OPTIONS: { label: string; value: string }[] = [
  { label: 'Twitter', value: 'Twitter' },
  { label: 'Github', value: 'Github' },
  { label: 'Linkedin', value: 'Linkedin' },
  { label: 'Youtube', value: 'Youtube' },
  { label: 'Instagram', value: 'Instagram' },
  { label: 'Facebook', value: 'Facebook' },
  { label: 'Dribbble', value: 'Dribbble' },
]

/**
 * Normalises a Lucide icon name to the kebab-case key the dynamic icon loader
 * expects, so `Twitter`, `twitter` and `arrow-right` all resolve.
 */
export function iconKey (name: string | undefined): string {
  if (!name) return ''
  if (name.includes('-') || name === name.toLowerCase()) return name
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}
