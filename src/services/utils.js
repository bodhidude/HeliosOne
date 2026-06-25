/**
 * Extracts the latest valid numeric value from an array of data objects.
 * Scans backward from the end of the array for the first non-NaN value.
 * 
 * @param {Array} arr - Array of data objects
 * @param {string} key - The key to extract the value from
 * @returns {number|null} The latest valid number, or null if none found
 */
export function getLatest(arr, key) {
  if (!arr || !arr.length) return null;
  for (let i = arr.length - 1; i >= 0; i--) {
    const val = parseFloat(arr[i][key]);
    if (!isNaN(val)) return val;
  }
  return null;
}
