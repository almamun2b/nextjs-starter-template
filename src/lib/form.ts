/**
 * Runtime check whether `key` actually exists on `obj`.
 * Narrows `key` to `keyof T` when true — no manual key lists needed.
 */
const isFormInputField = <T extends object>(
  key: string | number | symbol,
  obj: T
): key is keyof T => {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

export { isFormInputField }
