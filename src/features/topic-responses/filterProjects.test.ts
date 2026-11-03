import { describe, expect, test } from 'bun:test'

import { filterProjects } from './filterProjects'

const projects = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }]

describe('filterProjects', () => {
  test('lists every project without slugs', () => {
    expect(filterProjects(projects)).toEqual(projects)
    expect(filterProjects(projects, [])).toEqual(projects)
  })

  test('lists only the requested projects, in their own order', () => {
    expect(filterProjects(projects, ['c', 'a'])).toEqual([{ slug: 'a' }, { slug: 'c' }])
  })

  test('ignores unknown and duplicate slugs', () => {
    expect(filterProjects(projects, ['b', 'nope', 'b'])).toEqual([{ slug: 'b' }])
  })

  test('falls back to every project when no slug matches', () => {
    expect(filterProjects(projects, ['nope'])).toEqual(projects)
  })
})
