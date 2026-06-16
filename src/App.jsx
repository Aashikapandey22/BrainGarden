import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  FileText,
  Share2,
  Tag,
  Settings,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  PanelLeftClose,
  PanelLeft,
  Info,
  Calendar,
  Clock,
  BarChart,
  ExternalLink,
  Folder,
  FolderOpen,
  Sparkles,
  Command,
  HelpCircle,
  Hash,
  Eye,
  Sliders,
  Trash2,
  Pin
} from 'lucide-react'
import { useNotes } from './hooks/useNotes'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ForceGraph2D from 'react-force-graph-2d'
import './App.css'

export default function App() {
  const { notes, createNote, deleteNote, updateNote } = useNotes()

  // Navigation State
  const [activeRailTab, setActiveRailTab] = useState('notes') // 'search', 'notes', 'graph', 'tags', 'settings'
  
  // Collapse Panel States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  
  // Notes State
  const [openTabIds, setOpenTabIds] = useState(['1', '3'])
  const [activeNoteId, setActiveNoteId] = useState('1')
  
  // Tree Folders State
  const [expandedFolders, setExpandedFolders] = useState({
    root: true,
    ideas: true
  })

  // Search State
  const [searchQuery, setSearchQuery] = useState('')

  // Local editor content buffer state for auto-save and rendering speed
  const [localContent, setLocalContent] = useState('')

  // Sorting State
  const [sortBy, setSortBy] = useState('updated') // 'updated', 'alphabetical', 'created'

  // Sort notes logic
  const getSortedNotes = (notesList) => {
    return [...notesList].sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title)
      } else if (sortBy === 'created') {
        return new Date(b.createdAt) - new Date(a.createdAt)
      } else {
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      }
    })
  }

  // Active Note details
  const activeNote = notes.find(n => n.id === activeNoteId)

  // Wiki Links Missing Creation Dialog State
  const [showCreateWikiModal, setShowCreateWikiModal] = useState(false)
  const [wikiModalTargetTitle, setWikiModalTargetTitle] = useState('')

  // Knowledge Graph Modal State
  const [showGraphModal, setShowGraphModal] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Command Palette State & Ref
  const [showPaletteModal, setShowPaletteModal] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(0)
  const paletteInputRef = useRef(null)

  // Keep graph dimensions synchronized with screen size
  useEffect(() => {
    if (!showGraphModal) return
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 62
      })
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showGraphModal])



  // Sync localContent buffer when active note changes
  useEffect(() => {
    if (activeNote) {
      setLocalContent(activeNote.content)
    } else {
      setLocalContent('')
    }
  }, [activeNoteId])

  // Auto-save buffer to localStorage state once per second
  useEffect(() => {
    if (!activeNoteId) return

    const interval = setInterval(() => {
      const currentNote = notes.find(n => n.id === activeNoteId)
      if (currentNote && currentNote.content !== localContent) {
        updateNote(activeNoteId, { content: localContent })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [localContent, activeNoteId, notes])

  // Compute backlinks dynamically matching target note titles
  const backlinks = activeNote
    ? notes
        .filter(n => n.links && n.links.includes(activeNote.title))
        .map(n => ({
          id: n.id,
          title: n.title,
          snippet: n.content.substring(0, 80) + '...'
        }))
    : []

  // Toggle folders
  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder]: !prev[folder]
    }))
  }

  // Handle Tab switches
  const selectNote = (noteId) => {
    // Commit pending buffer changes before switching active note
    if (activeNoteId) {
      const currentNote = notes.find(n => n.id === activeNoteId)
      if (currentNote && currentNote.content !== localContent) {
        updateNote(activeNoteId, { content: localContent })
      }
    }

    if (!openTabIds.includes(noteId)) {
      setOpenTabIds(prev => [...prev, noteId])
    }
    setActiveNoteId(noteId)
  }

  // Close Note tab
  const closeTab = (e, idToClose) => {
    e.stopPropagation()
    // Commit pending buffer changes if we close the active note
    if (idToClose === activeNoteId) {
      const currentNote = notes.find(n => n.id === activeNoteId)
      if (currentNote && currentNote.content !== localContent) {
        updateNote(activeNoteId, { content: localContent })
      }
    }

    const remainingTabs = openTabIds.filter(id => id !== idToClose)
    setOpenTabIds(remainingTabs)
    
    if (activeNoteId === idToClose) {
      if (remainingTabs.length > 0) {
        setActiveNoteId(remainingTabs[remainingTabs.length - 1])
      } else {
        setActiveNoteId(null)
      }
    }
  }

  // Create new note
  const createNewNote = () => {
    // Commit pending buffer changes before switching active note
    if (activeNoteId) {
      const currentNote = notes.find(n => n.id === activeNoteId)
      if (currentNote && currentNote.content !== localContent) {
        updateNote(activeNoteId, { content: localContent })
      }
    }

    const newNote = createNote(
      `Untitled Note ${notes.length + 1}`,
      `# Untitled Note ${notes.length + 1}\n\nStart writing here...`,
      ['draft'],
      []
    )
    setOpenTabIds(prev => [...prev, newNote.id])
    setActiveNoteId(newNote.id)
  }


  // Delete note trigger
  const handleDeleteNote = (id) => {
    deleteNote(id)
    const remainingTabs = openTabIds.filter(tabId => tabId !== id)
    setOpenTabIds(remainingTabs)
    if (activeNoteId === id) {
      if (remainingTabs.length > 0) {
        setActiveNoteId(remainingTabs[remainingTabs.length - 1])
      } else {
        setActiveNoteId(null)
      }
    }
  }

  // Edit Note content (updates local state buffer)
  const handleNoteContentChange = (e) => {
    setLocalContent(e.target.value)
  }

  // Handle editor keyboard formatting shortcuts (Ctrl+B/Ctrl+I)
  const handleEditorKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'i')) {
      e.preventDefault()
      const textarea = e.target
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const selectedText = text.substring(start, end)

      const isBold = e.key.toLowerCase() === 'b'
      const marker = isBold ? '**' : '*'

      let replacement = ''
      if (selectedText.startsWith(marker) && selectedText.endsWith(marker)) {
        // Unwrap
        replacement = selectedText.slice(marker.length, selectedText.length - marker.length)
      } else {
        // Wrap
        replacement = `${marker}${selectedText}${marker}`
      }

      const newValue = text.substring(0, start) + replacement + text.substring(end)
      setLocalContent(newValue)

      // Also trigger auto-save write buffer immediately
      updateNote(activeNoteId, { content: newValue })

      // Reset cursor selection range after insertion
      setTimeout(() => {
        textarea.focus()
        if (selectedText) {
          textarea.setSelectionRange(start, start + replacement.length)
        } else {
          textarea.setSelectionRange(start + marker.length, start + marker.length)
        }
      }, 0)
    }
  }

  // Edit Note Title
  const handleNoteTitleChange = (e) => {
    const updatedTitle = e.target.value
    updateNote(activeNoteId, { title: updatedTitle })
  }

  // Wiki Link Preprocessor & Trigger Actions
  const preprocessWikiLinks = (text) => {
    if (!text) return ''
    return text.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
      return `[${p1}](#wikilink-${encodeURIComponent(p1)})`
    })
  }

  const handleWikiLinkClick = (targetTitle) => {
    const foundNote = notes.find(n => n.title.toLowerCase() === targetTitle.toLowerCase())
    if (foundNote) {
      selectNote(foundNote.id)
    } else {
      setWikiModalTargetTitle(targetTitle)
      setShowCreateWikiModal(true)
    }
  }

  const handleCreateNoteFromWiki = () => {
    const newNote = createNote(
      wikiModalTargetTitle,
      `# ${wikiModalTargetTitle}\n\nSeed note created from wiki link.`,
      ['draft'],
      []
    )
    setOpenTabIds(prev => [...prev, newNote.id])
    setActiveNoteId(newNote.id)
    setShowCreateWikiModal(false)
  }

  // Keyboard shortcut listener mock simulation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle sidebar: cmd + \
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setIsSidebarOpen(prev => !prev)
      }
      // Toggle inspector: cmd + i
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault()
        setIsInspectorOpen(prev => !prev)
      }
      // Create new note: cmd + n
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        createNewNote()
      }
      // Toggle Command Palette: cmd + k or ctrl + k
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowPaletteModal(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [notes])

  // Focus Command Palette input when toggled
  useEffect(() => {
    if (showPaletteModal) {
      setTimeout(() => {
        if (paletteInputRef.current) {
          paletteInputRef.current.focus()
        }
      }, 50)
    } else {
      setPaletteQuery('')
      setSelectedPaletteIndex(0)
    }
  }, [showPaletteModal])

  // Reset selection index when query changes
  useEffect(() => {
    setSelectedPaletteIndex(0)
  }, [paletteQuery])

  // Static Layout & Command Palette actions
  const staticCommands = [
    {
      id: 'create-note',
      title: 'Create Note',
      subtitle: 'Plant a new seed note',
      icon: Plus,
      action: () => {
        createNewNote()
        setShowPaletteModal(false)
      },
      shortcut: '⌘N'
    },
    {
      id: 'open-graph',
      title: 'Open Graph',
      subtitle: 'View knowledge graph visualization',
      icon: Share2,
      action: () => {
        setShowGraphModal(true)
        setShowPaletteModal(false)
      },
      shortcut: '⌘G'
    },
    {
      id: 'search-notes',
      title: 'Search Notes',
      subtitle: 'Search notes in sidebar explorer',
      icon: Search,
      action: () => {
        setActiveRailTab('search')
        setIsSidebarOpen(true)
        setShowPaletteModal(false)
        setTimeout(() => {
          const input = document.querySelector('.search-input')
          if (input) input.focus()
        }, 50)
      },
      shortcut: '/'
    },
    ...(activeNoteId ? [{
      id: 'delete-note',
      title: 'Delete Note',
      subtitle: `Delete "${activeNote?.title}" permanently`,
      icon: Trash2,
      action: () => {
        handleDeleteNote(activeNoteId)
        setShowPaletteModal(false)
      },
      shortcut: '⌘D'
    }] : []),
    {
      id: 'toggle-sidebar',
      title: 'Toggle Sidebar',
      subtitle: isSidebarOpen ? 'Collapse left sidebar' : 'Expand left sidebar',
      icon: PanelLeft,
      action: () => {
        setIsSidebarOpen(prev => !prev)
        setShowPaletteModal(false)
      },
      shortcut: '⌘\\'
    },
    {
      id: 'open-settings',
      title: 'Open Settings',
      subtitle: 'Manage user preferences',
      icon: Settings,
      action: () => {
        setActiveRailTab('settings')
        setIsSidebarOpen(true)
        setShowPaletteModal(false)
      },
      shortcut: '⌘,'
    }
  ]

  // Note Search items mapped to same structure
  const noteItems = notes.map(note => ({
    id: `note-${note.id}`,
    title: `Open: ${note.title}`,
    subtitle: note.content.substring(0, 80).replace(/#/g, '').trim() + '...',
    icon: FileText,
    action: () => {
      selectNote(note.id)
      setShowPaletteModal(false)
    },
    shortcut: 'Enter',
    isNote: true
  }))

  // Real-time Query Filtering
  const filteredCommands = staticCommands.filter(item => 
    item.title.toLowerCase().includes(paletteQuery.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(paletteQuery.toLowerCase())
  )

  const filteredPaletteNotes = noteItems.filter(item => {
    const originalNote = notes.find(n => `note-${n.id}` === item.id)
    const contentMatch = originalNote ? originalNote.content.toLowerCase().includes(paletteQuery.toLowerCase()) : false
    return item.title.toLowerCase().includes(paletteQuery.toLowerCase()) || contentMatch
  })

  const paletteItems = [...filteredCommands, ...filteredPaletteNotes]

  const handlePaletteKeyDown = (e) => {
    if (paletteItems.length === 0) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowPaletteModal(false)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedPaletteIndex(prev => (prev + 1) % paletteItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedPaletteIndex(prev => (prev - 1 + paletteItems.length) % paletteItems.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selectedItem = paletteItems[selectedPaletteIndex]
      if (selectedItem) {
        selectedItem.action()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowPaletteModal(false)
    }
  }

  // Filters notes based on query
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedNotes = getSortedNotes(filteredNotes)

  // Dynamic Knowledge Graph Data Resolver
  const getGraphData = () => {
    const nodes = notes.map(note => {
      // Outgoing links (extracted wiki links)
      const outgoingCount = note.links ? note.links.length : 0
      // Incoming backlinks (other notes referencing this note title)
      const incomingCount = notes.filter(n => n.links && n.links.includes(note.title)).length
      const connectivity = outgoingCount + incomingCount

      // Color Coding: Green = Pinned, Purple = High connectivity, Blue = Normal
      let color = '#3B82F6' // Blue
      if (note.isPinned) {
        color = '#10B981' // Green
      } else if (connectivity >= 2) {
        color = '#8B5CF6' // Purple
      }

      return {
        id: note.id,
        name: note.title,
        color: color,
        val: connectivity >= 2 ? 8 : 5
      }
    })

    const links = []
    notes.forEach(note => {
      if (note.links) {
        note.links.forEach(targetTitle => {
          const targetNote = notes.find(n => n.title.toLowerCase() === targetTitle.toLowerCase())
          if (targetNote) {
            links.push({
              source: note.id,
              target: targetNote.id
            })
          }
        })
      }
    })

    return { nodes, links }
  }

  const graphData = getGraphData()


  return (
    <div className="app-layout">
      {/* 1. Left Icon Rail (48px fixed) */}
      <aside className="left-rail">
        <div className="rail-top">
          {/* Logo */}
          <div className="rail-logo" title="BrainGarden">
            <div className="rail-logo-glow" />
            <Sparkles size={20} strokeWidth={2.5} />
          </div>

          {/* Search Icon */}
          <button 
            className={`rail-button ${activeRailTab === 'search' ? 'active' : ''}`}
            onClick={() => {
              setActiveRailTab('search')
              setIsSidebarOpen(true)
            }}
            data-tooltip="Search (⌘K)"
          >
            <Search size={18} />
          </button>

          {/* Notes Explorer */}
          <button 
            className={`rail-button ${activeRailTab === 'notes' ? 'active' : ''}`}
            onClick={() => {
              setActiveRailTab('notes')
              setIsSidebarOpen(true)
            }}
            data-tooltip="Notes Explorer (⌘\)"
          >
            <FileText size={18} />
          </button>

          {/* Graph View */}
          <button 
            className="rail-button"
            onClick={() => setShowGraphModal(true)}
            data-tooltip="Knowledge Graph"
          >
            <Share2 size={18} />
          </button>

          {/* Tags */}
          <button 
            className={`rail-button ${activeRailTab === 'tags' ? 'active' : ''}`}
            onClick={() => {
              setActiveRailTab('tags')
              setIsSidebarOpen(true)
            }}
            data-tooltip="Tags"
          >
            <Tag size={18} />
          </button>
        </div>

        <div className="rail-bottom">
          {/* Settings */}
          <button 
            className={`rail-button ${activeRailTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveRailTab('settings')
              setIsSidebarOpen(true)
            }}
            data-tooltip="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </aside>

      {/* 2. Secondary Sidebar (280px collapsible) */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside 
            className="secondary-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          >
            {/* Header with Search and Create Button */}
            <div className="sidebar-header">
              <div className="search-container">
                <Search size={14} className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Quick Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="search-shortcut">⌘K</span>
              </div>

              <button className="btn-create-note" onClick={createNewNote}>
                <Plus size={14} />
                New Note
              </button>
            </div>

            {/* Scrollable Explorer List */}
            <div className="sidebar-scrollable">
              {activeRailTab === 'notes' && (
                <>
                  {/* File Tree Section */}
                  <div className="sidebar-section">
                    <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Notes Explorer</span>
                      
                      {/* Sort Selector */}
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          padding: '1px 4px',
                          cursor: 'pointer',
                          outline: 'none',
                          maxWidth: '125px'
                        }}
                      >
                        <option value="updated">Recently Updated</option>
                        <option value="alphabetical">Alphabetical</option>
                        <option value="created">Created Date</option>
                      </select>
                    </div>

                    {notes.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p style={{ fontSize: '12px', marginBottom: '8px' }}>Your garden is empty</p>
                        <button className="btn-create-note" onClick={createNewNote} style={{ padding: '4px 8px', fontSize: '11px', margin: '0 auto' }}>
                          <Plus size={12} /> Plant Note
                        </button>
                      </div>
                    ) : (
                      <div className="tree-container">
                        {/* Root Folder */}
                        <div 
                          className="tree-node folder" 
                          onClick={() => toggleFolder('root')}
                        >
                          {expandedFolders.root ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          {expandedFolders.root ? <FolderOpen size={14} className="chevron-icon" /> : <Folder size={14} className="chevron-icon" />}
                          <span>BrainGarden Vault</span>
                        </div>

                        {expandedFolders.root && (
                          <div style={{ marginLeft: '12px' }}>
                            {/* Empty state for search filtering */}
                            {sortedNotes.length === 0 && searchQuery && (
                              <div style={{ padding: '8px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                                No matching notes found
                              </div>
                            )}

                            {/* Item: Getting Started / Root Notes */}
                            <AnimatePresence initial={false}>
                              {sortedNotes.filter(n => !n.title.includes('/')).map(note => (
                                <motion.div 
                                  key={note.id}
                                  layout
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className={`tree-node ${activeNoteId === note.id ? 'active' : ''}`}
                                  onClick={() => selectNote(note.id)}
                                >
                                  <div className="tree-indent" />
                                  <FileText size={13} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {note.title}.md
                                  </span>
                                </motion.div>
                              ))}
                            </AnimatePresence>

                            {/* Sub Folder: Ideas */}
                            <div 
                              className="tree-node folder" 
                              onClick={() => toggleFolder('ideas')}
                            >
                              <div className="tree-indent" />
                              {expandedFolders.ideas ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              {expandedFolders.ideas ? <FolderOpen size={14} className="chevron-icon" /> : <Folder size={14} className="chevron-icon" />}
                              <span>Ideas</span>
                            </div>

                            {expandedFolders.ideas && (
                              <div style={{ marginLeft: '24px' }}>
                                <AnimatePresence initial={false}>
                                  {sortedNotes.filter(n => n.title.startsWith('Ideas/')).map(note => (
                                    <motion.div 
                                      key={note.id}
                                      layout
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className={`tree-node ${activeNoteId === note.id ? 'active' : ''}`}
                                      onClick={() => selectNote(note.id)}
                                    >
                                      <div className="tree-indent" />
                                      <FileText size={13} />
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {note.title.replace('Ideas/', '')}.md
                                      </span>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recent Notes Section */}
                  <div className="sidebar-section" style={{ marginTop: '16px' }}>
                    <div className="sidebar-section-title">
                      <span>Recent Changes</span>
                    </div>
                    <div className="recent-list">
                      {notes.slice(0, 3).map(note => (
                        <div 
                          key={note.id} 
                          className="recent-item"
                          onClick={() => selectNote(note.id)}
                        >
                          <span className="recent-item-title">{note.title}.md</span>
                          <div className="recent-item-meta">
                            <span>{note.updatedAt}</span>
                            <span style={{ fontSize: '9px', opacity: 0.6 }}>
                              {note.content.trim().split(/\s+/).filter(Boolean).length} words
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeRailTab === 'search' && (
                <div className="sidebar-section">
                  <div className="sidebar-section-title">
                    <span>Search Results ({sortedNotes.length})</span>
                  </div>
                  <div className="recent-list">
                    <AnimatePresence initial={false}>
                      {sortedNotes.length > 0 ? (
                        sortedNotes.map(note => (
                          <motion.div 
                            key={note.id}
                            layout
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className={`recent-item ${activeNoteId === note.id ? 'active' : ''}`}
                            onClick={() => selectNote(note.id)}
                            style={{ 
                              borderColor: activeNoteId === note.id ? 'var(--accent)' : 'transparent',
                              backgroundColor: activeNoteId === note.id ? 'var(--bg-active)' : 'transparent'
                            }}
                          >
                            <span className="recent-item-title">{note.title}.md</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {note.content.substring(0, 40).replace(/#/g, '')}...
                            </span>
                          </motion.div>
                        ))
                      ) : (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          No matching notes found
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {activeRailTab === 'graph' && (
                <div className="sidebar-section" style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Share2 size={32} color="var(--accent)" style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.8 }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Interactive Graph</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Click nodes in graph mode to jump to connected files instantly.</span>
                  <div style={{ marginTop: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', height: '120px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>[ Graph Canvas Placeholder ]</span>
                  </div>
                </div>
              )}

              {activeRailTab === 'tags' && (
                <div className="sidebar-section">
                  <div className="sidebar-section-title">
                    <span>All Tags</span>
                  </div>
                  <div className="tags-container">
                    <div className="tag-pill"><Hash size={10} /><span>welcome</span><span className="tag-count">1</span></div>
                    <div className="tag-pill"><Hash size={10} /><span>guide</span><span className="tag-count">1</span></div>
                    <div className="tag-pill"><Hash size={10} /><span>basics</span><span className="tag-count">1</span></div>
                    <div className="tag-pill"><Hash size={10} /><span>ideas</span><span className="tag-count">2</span></div>
                    <div className="tag-pill"><Hash size={10} /><span>philosophy</span><span className="tag-count">1</span></div>
                    <div className="tag-pill"><Hash size={10} /><span>tech</span><span className="tag-count">1</span></div>
                    <div className="tag-pill"><Hash size={10} /><span>css</span><span className="tag-count">1</span></div>
                    <div className="tag-pill"><Hash size={10} /><span>design</span><span className="tag-count">1</span></div>
                  </div>
                </div>
              )}

              {activeRailTab === 'settings' && (
                <div className="sidebar-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="sidebar-section-title">
                    <span>Preferences</span>
                  </div>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span>Theme</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Obsidian Dark</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span>Active Editor</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Markdown</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span>Auto Save</span>
                      <span style={{ color: 'var(--text-secondary)' }}>On</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace */}
      <main className="main-workspace">
        {/* Top Tab Bar */}
        <div className="top-tab-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Sidebar toggle */}
            <button 
              className="panel-toggle-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Collapse Sidebar (⌘\\)" : "Expand Sidebar (⌘\\)"}
            >
              {isSidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
            </button>
          </div>

          {/* Open Tabs */}
          <div className="tabs-scrollable-container">
            {openTabIds.map(tabId => {
              const note = notes.find(n => n.id === tabId)
              if (!note) return null
              const displayName = note.title.includes('/') ? note.title.split('/').pop() : note.title
              return (
                <div 
                  key={tabId}
                  className={`tab-item ${activeNoteId === tabId ? 'active' : ''}`}
                  onClick={() => setActiveNoteId(tabId)}
                >
                  <FileText size={12} />
                  <span>{displayName}.md</span>
                  <button className="tab-close-btn" onClick={(e) => closeTab(e, tabId)}>
                    <X size={10} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Tabs Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button className="tab-new-btn" onClick={createNewNote} title="New Note (⌘N)">
              <Plus size={14} />
            </button>

            {/* Inspector Toggle */}
            <button 
              className="panel-toggle-btn"
              onClick={() => setIsInspectorOpen(!isInspectorOpen)}
              title="Toggle Right Inspector (⌘I)"
              style={{ color: isInspectorOpen ? 'var(--accent)' : 'var(--text-secondary)', borderColor: isInspectorOpen ? 'var(--accent-border)' : 'var(--border-color)', backgroundColor: isInspectorOpen ? 'var(--bg-active)' : 'var(--bg-card)' }}
            >
              <Info size={14} />
            </button>
          </div>
        </div>

        {/* Workspace content (Editor Area / Empty State) */}
        <div className="workspace-content">
          <AnimatePresence mode="wait">
            {activeNote ? (
              <motion.div 
                key={activeNote.id}
                className="editor-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="editor-content" style={{ height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <input 
                      type="text" 
                      className="editor-title-input" 
                      value={activeNote.title} 
                      onChange={handleNoteTitleChange}
                      placeholder="Note Title"
                      style={{ borderBottom: 'none', paddingBottom: 0 }}
                    />
                    
                    <button
                      onClick={() => updateNote(activeNote.id, { isPinned: !activeNote.isPinned })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: activeNote.isPinned ? '#34D399' : 'var(--text-secondary)',
                        backgroundColor: activeNote.isPinned ? 'rgba(52, 211, 153, 0.08)' : 'var(--bg-card)',
                        borderColor: activeNote.isPinned ? 'rgba(52, 211, 153, 0.3)' : 'var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'var(--transition-smooth)'
                      }}
                      title={activeNote.isPinned ? 'Unpin Note' : 'Pin Note'}
                    >
                      <Pin size={13} fill={activeNote.isPinned ? '#34D399' : 'none'} />
                      <span>{activeNote.isPinned ? 'Pinned' : 'Pin Note'}</span>
                    </button>
                  </div>

                  
                  <div className="editor-meta-tags" style={{ marginTop: '12px' }}>
                    {activeNote.tags.map(t => (
                      <span key={t} className="tag-pill">
                        <Hash size={9} />
                        <span>{t}</span>
                      </span>
                    ))}
                  </div>

                  <div className="editor-split-container">
                    <div className="editor-pane">
                      <textarea 
                        className="editor-body-textarea" 
                        value={localContent}
                        onChange={handleNoteContentChange}
                        onKeyDown={handleEditorKeyDown}
                        placeholder="Start typing markdown here..."
                      />
                    </div>
                    <div className="preview-pane markdown-body">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children }) => {
                            if (href && href.includes('#wikilink-')) {
                              const targetTitle = decodeURIComponent(
                                href.substring(href.indexOf('#wikilink-') + '#wikilink-'.length)
                              )
                              return (
                                <span 
                                  className="wiki-link" 
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleWikiLinkClick(targetTitle)
                                  }}
                                  style={{
                                    color: 'var(--accent)',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                  }}
                                >
                                  {children}
                                </span>
                              )
                            }
                            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                          }
                        }}
                      >
                        {preprocessWikiLinks(localContent)}
                      </ReactMarkdown>

                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                className="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="empty-state-card">
                  <div className="empty-state-logo">
                    <Sparkles size={28} />
                  </div>
                  <h2 className="empty-state-title">Welcome to BrainGarden</h2>
                  <p className="empty-state-desc">
                    A clean, fast digital garden for drafting notes, planting ideas, and weaving tags together. Select a node or create a new seed note.
                  </p>

                  <div className="keyboard-shortcuts">
                    <div className="shortcut-row">
                      <span className="shortcut-label">Create new note</span>
                      <div className="shortcut-keys">
                        <kbd className="kbd">⌘</kbd>
                        <kbd className="kbd">N</kbd>
                      </div>
                    </div>
                    <div className="shortcut-row">
                      <span className="shortcut-label">Toggle folder sidebar</span>
                      <div className="shortcut-keys">
                        <kbd className="kbd">⌘</kbd>
                        <kbd className="kbd">\</kbd>
                      </div>
                    </div>
                    <div className="shortcut-row">
                      <span className="shortcut-label">Toggle file inspector</span>
                      <div className="shortcut-keys">
                        <kbd className="kbd">⌘</kbd>
                        <kbd className="kbd">I</kbd>
                      </div>
                    </div>
                    <div className="shortcut-row">
                      <span className="shortcut-label">Search in vault</span>
                      <div className="shortcut-keys">
                        <kbd className="kbd">⌘</kbd>
                        <kbd className="kbd">K</kbd>
                      </div>
                    </div>
                  </div>

                  <button className="btn-create-note" onClick={createNewNote} style={{ width: '100%', marginTop: '8px' }}>
                    <Plus size={14} />
                    Plant a New Seed Note
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 4. Right Inspector Panel (280px collapsible) */}
      <AnimatePresence initial={false}>
        {isInspectorOpen && (
          <motion.aside 
            className="right-inspector"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          >
            <div className="inspector-header">
              <span className="inspector-title">
                <Info size={14} color="var(--accent)" />
                File Inspector
              </span>
              <button className="tab-close-btn" onClick={() => setIsInspectorOpen(false)}>
                <X size={12} />
              </button>
            </div>

            {activeNote ? (
              <div className="inspector-scrollable">
                <div className="sidebar-section">
                  <div className="sidebar-section-title">
                    <span>Note Metadata</span>
                  </div>
                  
                  <div className="metadata-grid">
                    <span className="metadata-label">Created</span>
                    <span className="metadata-value mono">{activeNote.createdAt}</span>

                    <span className="metadata-label">Modified</span>
                    <span className="metadata-value mono">{activeNote.updatedAt}</span>

                    <span className="metadata-label">Words</span>
                    <span className="metadata-value">
                      {activeNote.content.trim().split(/\s+/).filter(Boolean).length} words
                    </span>

                    <span className="metadata-label">Characters</span>
                    <span className="metadata-value">{activeNote.content.length} chars</span>
                  </div>
                </div>

                <div className="sidebar-section" style={{ marginTop: '16px' }}>
                  <div className="sidebar-section-title">
                    <span>Backlinks ({backlinks.length})</span>
                  </div>
                  
                  <div className="backlinks-list">
                    {backlinks.length > 0 ? (
                      backlinks.map(link => {
                        const originalNote = notes.find(n => n.id === link.id)
                        return (
                          <div 
                            key={link.id} 
                            className="backlink-card"
                            onClick={() => selectNote(link.id)}
                          >
                            <div className="backlink-title">{originalNote ? originalNote.title : link.title}.md</div>
                            <div className="backlink-context">{link.snippet}</div>
                          </div>
                        )
                      })
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>No references linking to this note</span>
                    )}
                  </div>
                </div>

                <div className="sidebar-section" style={{ marginTop: '16px' }}>
                  <div className="sidebar-section-title">
                    <span>Actions & Formats</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="btn-create-note" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: 'none' }}>
                      <Eye size={12} />
                      <span style={{ fontSize: '12px' }}>Enter Focus Mode</span>
                    </button>
                    <button className="btn-create-note" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: 'none' }}>
                      <ExternalLink size={12} />
                      <span style={{ fontSize: '12px' }}>Export as Markdown</span>
                    </button>
                    <button 
                      className="btn-create-note" 
                      onClick={() => handleDeleteNote(activeNote.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', boxShadow: 'none' }}
                    >
                      <Trash2 size={12} />
                      <span style={{ fontSize: '12px' }}>Delete Note</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Sliders size={24} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.6 }} />
                <span style={{ fontSize: '12px' }}>Select a note to view attributes, references, and backlinks.</span>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateWikiModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(5, 7, 10, 0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}
          >
            <motion.div 
              className="modal-card"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--bg-active)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Create Note</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Wiki link target missing</p>
                </div>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                The note <strong style={{ color: 'var(--text-primary)' }}>"{wikiModalTargetTitle}"</strong> does not exist. Would you like to create it?
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button 
                  className="btn-create-note" 
                  onClick={() => setShowCreateWikiModal(false)}
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', boxShadow: 'none' }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-create-note" 
                  onClick={handleCreateNoteFromWiki}
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Knowledge Graph Modal */}
      <AnimatePresence>
        {showGraphModal && (
          <motion.div
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#0B0F14',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header top bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: '#07090d',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="var(--accent)" />
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Knowledge Graph</h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {/* Legend Guide */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span>Pinned (Green)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B5CF6' }} />
                    <span>High Connectivity (Purple)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                    <span>Normal (Blue)</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowGraphModal(false)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition-smooth)'
                  }}
                  title="Close Graph"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#0B0F14' }}>
              <ForceGraph2D
                graphData={graphData}
                width={dimensions.width}
                height={dimensions.height}
                nodeLabel="name"
                nodeColor={node => node.color}
                nodeVal={node => node.val}
                linkColor={() => 'rgba(139, 92, 246, 0.25)'}
                linkWidth={2}
                onNodeClick={(node) => {
                  selectNote(node.id)
                  setShowGraphModal(false)
                }}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.name
                  const fontSize = Math.max(5, Math.min(11 / globalScale, 13))
                  ctx.font = `${fontSize}px var(--font-sans)`
                  ctx.textAlign = 'center'
                  ctx.textBaseline = 'middle'

                  // Draw glow outline around node
                  ctx.beginPath()
                  ctx.arc(node.x, node.y, node.val + 2, 0, 2 * Math.PI, false)
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
                  ctx.fill()

                  // Draw node circle center
                  ctx.beginPath()
                  ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false)
                  ctx.fillStyle = node.color
                  ctx.fill()

                  // Draw note title label underneath
                  ctx.fillStyle = '#F3F4F6'
                  ctx.fillText(label, node.x, node.y + node.val + 4 + (8 / globalScale))
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Raycast-style Command Palette Modal */}
      <AnimatePresence>
        {showPaletteModal && (
          <motion.div
            className="palette-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPaletteModal(false)}
          >
            <motion.div
              className="palette-modal"
              initial={{ scale: 0.96, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Input Area */}
              <div className="palette-input-container">
                <Command size={18} className="text-secondary" style={{ opacity: 0.6 }} />
                <input
                  ref={paletteInputRef}
                  type="text"
                  className="palette-input"
                  placeholder="Type a command or search notes..."
                  value={paletteQuery}
                  onChange={(e) => setPaletteQuery(e.target.value)}
                  onKeyDown={handlePaletteKeyDown}
                />
                <kbd className="palette-kbd">ESC</kbd>
              </div>

              {/* Results Area */}
              <div className="palette-results">
                {paletteItems.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Search size={24} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <div style={{ fontSize: '13px' }}>No matches found for "{paletteQuery}"</div>
                  </div>
                ) : (
                  <>
                    {filteredCommands.length > 0 && (
                      <div className="palette-group-title">Commands</div>
                    )}
                    {filteredCommands.map((item, index) => {
                      const IconComponent = item.icon
                      const isSelected = index === selectedPaletteIndex
                      return (
                        <div
                          key={item.id}
                          onClick={() => item.action()}
                          onMouseEnter={() => setSelectedPaletteIndex(index)}
                          className={`palette-item ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="palette-item-left">
                            <div className="palette-item-icon">
                              <IconComponent size={16} />
                            </div>
                            <span className="palette-item-title">{item.title}</span>
                            <span className="palette-item-subtitle">— {item.subtitle}</span>
                          </div>
                          <kbd className="palette-kbd">{item.shortcut}</kbd>
                        </div>
                      )
                    })}

                    {filteredPaletteNotes.length > 0 && (
                      <div className="palette-group-title">Notes</div>
                    )}
                    {filteredPaletteNotes.map((item, index) => {
                      const IconComponent = item.icon
                      const itemIndex = filteredCommands.length + index
                      const isSelected = itemIndex === selectedPaletteIndex
                      return (
                        <div
                          key={item.id}
                          onClick={() => item.action()}
                          onMouseEnter={() => setSelectedPaletteIndex(itemIndex)}
                          className={`palette-item ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="palette-item-left">
                            <div className="palette-item-icon">
                              <IconComponent size={16} />
                            </div>
                            <span className="palette-item-title">{item.title}</span>
                            <span className="palette-item-subtitle">— {item.subtitle}</span>
                          </div>
                          <kbd className="palette-kbd">{item.shortcut}</kbd>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>

              {/* Footer Helper */}
              <div className="palette-footer">
                <div className="palette-footer-keys">
                  <span>Navigate: <kbd className="palette-kbd-key">↑</kbd> <kbd className="palette-kbd-key">↓</kbd></span>
                  <span>Select: <kbd className="palette-kbd-key">↵</kbd></span>
                </div>
                <div>
                  <span>BrainGarden Command Palette</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


