/**
 * The projects to list for the requested slugs, in the projects' own order. Unknown slugs are
 * ignored; with no slugs, or none that match, every project is listed.
 */
export const filterProjects = <T extends { slug: string }>(
  projects: readonly T[],
  slugs?: readonly string[]
): T[] => {
  if (!slugs?.length) return [...projects]
  const wanted = new Set(slugs)
  const matching = projects.filter((project) => wanted.has(project.slug))
  return matching.length > 0 ? matching : [...projects]
}
