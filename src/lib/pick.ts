/**
 * Creates a new object by picking the specified keys from the source object.
 *
 * @template T - The type of the source object.
 * @template K - The union of keys to pick from the source object.
 *
 * @param {T} obj - The source object to pick properties from.
 * @param {K[]} keys - An array of keys to include in the result.
 *
 * @returns {Pick<T, K>} Pick<T, K> - A new object containing only the requested keys.
 *
 * @example
 * const user = { id: 1, name: "Alice", email: "[EMAIL_ADDRESS]", password: "123" };
 * const result = pick(user, ["id", "name"]);
 * result → { id: 1, name: "Alice" }
 */

const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const finalObj = {} as Pick<T, K>
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      finalObj[key] = obj[key]
    }
  }
  return finalObj
}

export { pick }
