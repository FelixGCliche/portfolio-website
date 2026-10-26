import { describe, expect, test } from 'bun:test'

import { formatRange, monthsBetween } from './duration'

describe('monthsBetween', () => {
  test('exclusive month differences', () => {
    expect(monthsBetween('2023-04', '2023-05')).toBe(1)
    expect(monthsBetween('2023-05', '2024-04')).toBe(11)
    expect(monthsBetween('2022-04', '2023-01')).toBe(9)
    expect(monthsBetween('2021-06', '2021-09')).toBe(3)
  })

  test('same month is at least 1', () => {
    expect(monthsBetween('2023-05', '2023-05')).toBe(1)
  })

  test('null end uses now', () => {
    expect(monthsBetween('2024-01', null, new Date(2024, 5, 15))).toBe(5)
  })
})

describe('formatRange', () => {
  test('closed and open ranges', () => {
    expect(formatRange('2023-05', '2024-04', 'present')).toBe('2023-05 → 2024-04')
    expect(formatRange('2023-05', null, 'present')).toBe('2023-05 → present')
  })

  test('numeric years', () => {
    expect(formatRange(2018, 2021, 'present')).toBe('2018 → 2021')
  })
})
