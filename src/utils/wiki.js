/**
 * Extracts all unique wiki links from notes content body.
 * Regex: \[\[(.*?)\]\]
 * 
 * @param {string} content Markdown content text
 * @returns {string[]} Array of target note titles
 */
export function extractLinks(content) {
  if (!content || typeof content !== 'string') {
    return []
  }

  const regex = /\[\[(.*?)\]\]/g
  const links = []
  let match

  while ((match = regex.exec(content)) !== null) {
    // Trim target title space to keep names uniform
    const title = match[1].trim()
    if (title) {
      links.push(title)
    }
  }

  // Deduplicate array
  return [...new Set(links)]
}
