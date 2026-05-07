import { useEffect, useMemo, useState } from 'react'

const COLORS = ['banana', 'bubblegum', 'mint', 'sky', 'lavender', 'peach']
const NEW_NOTE = { title: '', body: '', color: 'banana' }

function App() {
  const [notes, setNotes] = useState([])
  const [form, setForm] = useState(NEW_NOTE)
  const [editingId, setEditingId] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [message, setMessage] = useState('Loading your notes...')

  useEffect(() => {
    fetchNotes()
  }, [])

  const noteCountLabel = useMemo(() => {
    if (notes.length === 0) return 'No notes yet — capture your first bright idea.'
    if (notes.length === 1) return '1 note is ready on your board.'
    return `${notes.length} notes are ready on your board.`
  }, [notes.length])

  async function fetchNotes() {
    try {
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Could not load notes')
      const data = await response.json()
      setNotes(data)
      setMessage('Ready for your next idea.')
    } catch {
      setMessage('Start the Rails API to save notes. Your board is ready when you are.')
    }
  }

  async function createNote(event) {
    event.preventDefault()
    const payload = {
      title: form.title.trim() || 'Untitled idea',
      body: form.body,
      color: form.color
    }

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: payload })
      })
      if (!response.ok) throw new Error('Could not create note')
      const note = await response.json()
      setNotes([note, ...notes])
      setForm(NEW_NOTE)
      setMessage('New note added to your board.')
    } catch {
      setMessage('Could not save that note yet. Please try again.')
    }
  }

  function beginEdit(note) {
    setEditingId(note.id)
    setDrafts({ ...drafts, [note.id]: { title: note.title, body: note.body, color: note.color } })
  }

  async function saveEdit(noteId) {
    try {
      const draft = drafts[noteId]
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: { ...draft, title: draft.title.trim() || 'Untitled idea' } })
      })
      if (!response.ok) throw new Error('Could not update note')
      const updated = await response.json()
      setNotes(notes.map((note) => (note.id === noteId ? updated : note)))
      setEditingId(null)
      setMessage('Note updated successfully.')
    } catch {
      setMessage('That edit did not save. Please try again.')
    }
  }

  async function deleteNote(noteId) {
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete note')
      setNotes(notes.filter((note) => note.id !== noteId))
      setMessage('Note removed from your board.')
    } catch {
      setMessage('That note could not be deleted yet.')
    }
  }

  function updateDraft(noteId, field, value) {
    setDrafts({
      ...drafts,
      [noteId]: { ...drafts[noteId], [field]: value }
    })
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Colorful notes. Clear momentum.</p>
          <h1>Premium sticky notes for bold ideas</h1>
          <p>{noteCountLabel}</p>
        </div>
        <div className="brand-orb" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </section>

      <form className="creator-card" onSubmit={createNote}>
        <h2>Create a new note</h2>
        <label>
          Title
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Project launch" />
        </label>
        <label>
          Details
          <textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Add the reminder, plan, or idea..." />
        </label>
        <div className="color-row">
          {COLORS.map((color) => (
            <button key={color} type="button" className={`swatch ${color} ${form.color === color ? 'selected' : ''}`} onClick={() => setForm({ ...form, color })} aria-label={`Choose ${color}`} />
          ))}
        </div>
        <button className="primary-button" type="submit">Add note</button>
      </form>

      <p className="status">{message}</p>

      <section className="notes-grid">
        {notes.map((note, index) => {
          const isEditing = editingId === note.id
          const draft = drafts[note.id] || note
          return (
            <article className={`sticky-note ${draft.color}`} style={{ '--tilt': `${(index % 5) - 2}deg` }} key={note.id}>
              {isEditing ? (
                <>
                  <input className="note-title-input" value={draft.title} onChange={(event) => updateDraft(note.id, 'title', event.target.value)} />
                  <textarea className="note-body-input" value={draft.body} onChange={(event) => updateDraft(note.id, 'body', event.target.value)} />
                  <div className="color-row compact">
                    {COLORS.map((color) => (
                      <button key={color} type="button" className={`swatch ${color} ${draft.color === color ? 'selected' : ''}`} onClick={() => updateDraft(note.id, 'color', color)} aria-label={`Choose ${color}`} />
                    ))}
                  </div>
                  <div className="note-actions">
                    <button onClick={() => saveEdit(note.id)}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <h3>{note.title}</h3>
                  <p>{note.body || 'A blank note with plenty of potential.'}</p>
                  <div className="note-actions">
                    <button onClick={() => beginEdit(note)}>Edit</button>
                    <button onClick={() => deleteNote(note.id)}>Delete</button>
                  </div>
                </>
              )}
            </article>
          )
        })}
      </section>
    </main>
  )
}

export default App
