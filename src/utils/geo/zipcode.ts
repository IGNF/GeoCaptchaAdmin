/**
 * Checks whether a value is a valid five-digit French postal code.
 *
 * This validates the format only; it does not check whether the postal code exists or corresponds
 * to a specific commune.
 *
 * @param value - Value to validate.
 * @returns `true` when `value` consists of exactly five digits.
 */
export const isValidZipcode = (value: string): boolean => /^\d{5}$/.test(value)

/**
 * Returns the postal-code prefix associated with a French department.
 *
 * Corsica is represented by department codes `2A` and  `2B`, while its postal code use the `20`
 * prefix. Other department codes are returned unchanged.
 *
 * @param departmentCode - INSEE department code.
 * @returns Returns the corresponding postal-code prefix.
 */
export function zipcodePrefix(departmentCode: string): string {
    if (departmentCode === '2A' || departmentCode === '2B') return '20'
    return departmentCode
}