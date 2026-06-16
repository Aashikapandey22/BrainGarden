import { useState, useEffect } from 'react'
import { extractLinks } from '../utils/wiki'

const INITIAL_NOTES = [
  {
    id: '1',
    title: 'Getting Started',
    content: `# Getting Started with BrainGarden 🚀

Welcome to BrainGarden, a digital garden for your mind. This application is inspired by the modularity of Obsidian, the precision of Linear, the layout of Arc Browser, and the efficiency of Raycast.

## Structure of your garden
- **Left Icon Rail**: Easily switch between search, folders, graph, tags, and settings.
- **Secondary Sidebar**: Filter and traverse your notes tree, tags, and recent files.
- **Tab Bar**: Handle multi-tasking across different nodes in your mind-map.
- **Right Inspector**: Audit metadata, view backlinks, and map outgoing references.

Feel free to open other notes, create new ones, toggle the panels, or play with the layout!`,
    tags: ['welcome', 'guide', 'basics'],
    createdAt: '2026-06-16 10:30',
    updatedAt: '2026-06-16 15:24',
    links: ['Ideas/Garden Metaphor', 'Architecture'],
    isPinned: true
  },
  {
    id: '2',
    title: 'Ideas/Garden Metaphor',
    content: `# The Garden Metaphor in Note Taking

Unlike traditional folders which act as filing cabinets, a **Digital Garden** represents a living network of thoughts.
Notes are seeds that grow over time.

## Growth Stages
1. 🌱 **Seedlings**: Raw thoughts, quotes, or fleeting items.
2. 🌿 **Growing**: Structured drafts, connected ideas.
3. 🌳 **Evergreen**: Well-formed concepts, thoroughly backlinked.

Use double-bracket links like [[Getting Started]] to connect nodes.`,
    tags: ['philosophy', 'ideas'],
    createdAt: '2026-06-16 11:15',
    updatedAt: '2026-06-16 14:10',
    links: ['Getting Started'],
    isPinned: false
  },
  {
    id: '3',
    title: 'Architecture',
    content: `# BrainGarden Architecture

The application layout uses an optimized CSS Grid system designed for high performance:

\`\`\`css
.app-layout {
  display: grid;
  grid-template-columns: var(--rail-width) auto 1fr auto;
  grid-template-rows: 100vh;
}
\`\`\`

## Animations
Animations are driven by **Framer Motion** for sub-pixel accuracy and hardware acceleration.
- Sidebar collapses down to 0px with \`overflow: hidden\`
- Hover states transition with sleek cubic-bezier functions
- Tab active indicators slide smoothly`,
    tags: ['tech', 'architecture', 'css'],
    createdAt: '2026-06-15 09:00',
    updatedAt: '2026-06-16 12:45',
    links: [],
    isPinned: false
  },
  {
    id: '4',
    title: 'Obsidian vs Linear',
    content: `# Obsidian vs Linear: Designing the Perfect UI

When designing BrainGarden, we merged the two philosophies:

### Obsidian Style
- Deep hierarchies and flexible sidebar panels.
- Focus on content readability and rich editing.
- Local-first trust and offline performance.

### Linear Style
- Extremely clean borders, tight spacing, and micro-delight.
- Keyboard-driven command bar (Raycast style).
- Subtle gradients and active states.`,
    tags: ['design', 'ideas'],
    createdAt: '2026-06-14 14:20',
    updatedAt: '2026-06-16 11:05',
    links: [],
    isPinned: false
  }
]

export function useNotes() {
  const [notes, setNotes] = useState(() => {
    const stored = localStorage.getItem('braingarden_notes')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse notes from localStorage:', e)
      }
    }
    return INITIAL_NOTES
  })

  // Synchronize state changes with localStorage
  useEffect(() => {
    localStorage.setItem('braingarden_notes', JSON.stringify(notes))
  }, [notes])

  // Get note helper
  const getNote = (id) => {
    return notes.find(note => note.id === id)
  }

  // Create note helper
  const createNote = (
    title = 'Untitled Note',
    content = '',
    tags = ['draft'],
    links = [],
    isPinned = false
  ) => {
    const parsedLinks = content ? extractLinks(content) : links
    const newNote = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      tags,
      links: parsedLinks,
      isPinned
    }
    setNotes(prev => [...prev, newNote])
    return newNote
  }

  // Delete note helper
  const deleteNote = (id) => {
    setNotes(prev => prev.filter(note => note.id !== id))
  }

  // Update note helper
  const updateNote = (id, fields) => {
    setNotes(prev =>
      prev.map(note => {
        if (note.id === id) {
          const updatedFields = { ...fields }
          // Automatically extract wiki links if content changes
          if (fields.content !== undefined) {
            updatedFields.links = extractLinks(fields.content)
          }

          const updated = {
            ...note,
            ...updatedFields,
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
          }
          return updated
        }
        return note
      })
    )
  }

  return {
    notes,
    getNote,
    createNote,
    deleteNote,
    updateNote
  }
}
