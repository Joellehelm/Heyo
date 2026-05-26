import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const COLORS = [
  { id: 'banana', label: 'Sunbeam' },
  { id: 'bubblegum', label: 'Confetti pink' },
  { id: 'mint', label: 'Jungle mint' },
  { id: 'sky', label: 'Pool blue' },
  { id: 'lavender', label: 'Party violet' },
  { id: 'peach', label: 'Mango pop' }
]

const ANIMALS = [
  { id: 'fox', name: 'Red fox' },
  { id: 'panda', name: 'Giant panda' },
  { id: 'frog', name: 'Tree frog' },
  { id: 'tiger', name: 'Tiger' },
  { id: 'bear', name: 'Brown bear' },
  { id: 'koala', name: 'Koala' },
  { id: 'lion', name: 'Lion' },
  { id: 'monkey', name: 'Capuchin monkey' }
]

const DEFAULT_ANIMAL = ANIMALS[0].id
const DEFAULT_COLOR = COLORS[0].id
const NEW_NOTE = { title: '', body: '', color: DEFAULT_COLOR, animal: DEFAULT_ANIMAL }

function getAnimalMeta(animalId) {
  return ANIMALS.find((animal) => animal.id === animalId) || ANIMALS[0]
}

function AnimalFace({ animalId, className = '' }) {
  const animal = getAnimalMeta(animalId)

  return (
    <span className={`animal-face animal-${animal.id} ${className}`} aria-hidden="true">
      <span className="face-ear ear-left" />
      <span className="face-ear ear-right" />
      <span className="face-fluff fluff-left" />
      <span className="face-fluff fluff-right" />
      <span className="face-base">
        <span className="face-mask mask-left" />
        <span className="face-mask mask-right" />
        <span className="face-stripe stripe-one" />
        <span className="face-stripe stripe-two" />
        <span className="face-stripe stripe-three" />
        <span className="face-eye eye-left" />
        <span className="face-eye eye-right" />
        <span className="face-blush blush-left" />
        <span className="face-blush blush-right" />
        <span className="face-muzzle" />
        <span className="face-nose" />
        <span className="face-mouth" />
      </span>
    </span>
  )
}

function App() {
  const [notes, setNotes] = useState([])
  const [form, setForm] = useState(NEW_NOTE)
  const [drafts, setDrafts] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [message, setMessage] = useState('Opening the gates...')
  const [positions, setPositions] = useState({})
  const stageRef = useRef(null)
  const bodiesRef = useRef(new Map())

  useEffect(() => {
    fetchNotes()
  }, [])

  useEffect(() => {
    if (!activeId) return undefined

    function closeOnEscape(event) {
      if (event.key === 'Escape') setActiveId(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [activeId])

  const noteCountLabel = useMemo(() => {
    if (notes.length === 0) return 'No friends roaming yet.'
    if (notes.length === 1) return '1 sticky friend is exploring the habitat.'
    return `${notes.length} sticky friends are roaming the habitat.`
  }, [notes.length])

  const getAnimal = useCallback((animalId) => {
    return getAnimalMeta(animalId)
  }, [])

  const normalizeNote = useCallback((note, index = 0) => {
    const hasAnimal = ANIMALS.some((animal) => animal.id === note.animal)
    const hasColor = COLORS.some((color) => color.id === note.color)

    return {
      ...note,
      animal: hasAnimal ? note.animal : ANIMALS[index % ANIMALS.length].id,
      color: hasColor ? note.color : COLORS[index % COLORS.length].id
    }
  }, [])

  const activeNote = useMemo(() => {
    const index = notes.findIndex((note) => note.id === activeId)
    return index >= 0 ? normalizeNote(notes[index], index) : null
  }, [activeId, normalizeNote, notes])

  const activeDraft = activeNote ? drafts[activeNote.id] || activeNote : null

  async function fetchNotes() {
    try {
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Could not load notes')
      const data = await response.json()
      setNotes(data.map((note, index) => normalizeNote(note, index)))
      setMessage('Sticky Zoo is ready.')
    } catch {
      setMessage('Start the Rails API to save notes. The habitat can still be viewed.')
    }
  }

  async function createNote(event) {
    event.preventDefault()
    const nextIndex = notes.length + 1
    const payload = {
      title: form.title.trim() || 'Untitled habitat note',
      body: form.body,
      color: form.color,
      animal: form.animal
    }

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: payload })
      })
      if (!response.ok) throw new Error('Could not create note')
      const note = await response.json()
      setNotes((currentNotes) => [normalizeNote(note), ...currentNotes])
      setForm({
        ...NEW_NOTE,
        animal: ANIMALS[nextIndex % ANIMALS.length].id,
        color: COLORS[nextIndex % COLORS.length].id
      })
      setMessage('New sticky friend added.')
    } catch {
      setMessage('Could not save that sticky friend yet.')
    }
  }

  function openNote(note, index) {
    const normalized = normalizeNote(note, index)
    setActiveId(note.id)
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [note.id]: {
        title: normalized.title,
        body: normalized.body,
        color: normalized.color,
        animal: normalized.animal
      }
    }))
  }

  async function saveEdit(noteId) {
    try {
      const draft = drafts[noteId]
      const payload = {
        ...draft,
        title: draft.title.trim() || 'Untitled habitat note'
      }

      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: payload })
      })
      if (!response.ok) throw new Error('Could not update note')
      const updated = await response.json()
      setNotes((currentNotes) => currentNotes.map((note, index) => (
        note.id === noteId ? normalizeNote(updated, index) : note
      )))
      setActiveId(null)
      setMessage('Sticky friend updated.')
    } catch {
      setMessage('That edit did not save.')
    }
  }

  async function deleteNote(noteId) {
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete note')
      setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId))
      setActiveId(null)
      setMessage('Sticky friend removed.')
    } catch {
      setMessage('That sticky friend could not be removed.')
    }
  }

  function updateDraft(noteId, field, value) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [noteId]: { ...currentDrafts[noteId], [field]: value }
    }))
  }

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined

    let frameId
    let width = stage.clientWidth
    let height = stage.clientHeight
    const bodies = bodiesRef.current

    const observer = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width
      height = entry.contentRect.height
    })

    observer.observe(stage)

    function headSize() {
      if (!notes.length) return 72
      const responsiveCap = width < 560 ? 62 : 84
      const responsiveFloor = width < 560 ? 38 : 46
      const groundHeight = Math.max(height * 0.54, 1)
      const available = Math.sqrt((width * groundHeight) / Math.max(notes.length * 3.3, 1))
      return Math.max(responsiveFloor, Math.min(responsiveCap, available))
    }

    function roamingBounds(size) {
      const radius = size / 2
      const meadowTop = height * (width < 560 ? 0.39 : 0.42)
      const minY = Math.min(meadowTop + radius + 8, height - radius - 58)
      const maxY = Math.max(minY, height - radius - 58)

      return {
        minX: radius + 8,
        maxX: Math.max(radius + 8, width - radius - 8),
        minY,
        maxY
      }
    }

    function seed(id) {
      const text = String(id)
      let hash = 0
      for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) % 9973
      }
      return hash / 9973
    }

    function createBody(note, index, size) {
      const radius = size / 2
      const bounds = roamingBounds(size)
      const angle = seed(note.id) * Math.PI * 2
      const lane = 0.25 + ((index % 5) * 0.14)
      const x = bounds.minX + (bounds.maxX - bounds.minX) * ((seed(`${note.id}-x`) + lane) % 1)
      const y = bounds.minY + (bounds.maxY - bounds.minY) * ((seed(`${note.id}-y`) + lane * 0.7) % 1)
      const speed = width < 560 ? 0.22 : 0.34

      return {
        x: Number.isFinite(x) ? x : radius,
        y: Number.isFinite(y) ? y : radius,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size
      }
    }

    function tick() {
      const size = headSize()
      const bounds = roamingBounds(size)
      const noteIds = new Set(notes.map((note) => note.id))

      notes.forEach((note, index) => {
        if (!bodies.has(note.id)) {
          bodies.set(note.id, createBody(note, index, size))
        }

        const body = bodies.get(note.id)
        body.size = size
        body.x += body.vx
        body.y += body.vy

        if (body.x < bounds.minX) {
          body.x = bounds.minX
          body.vx = Math.abs(body.vx)
        }
        if (body.x > bounds.maxX) {
          body.x = bounds.maxX
          body.vx = -Math.abs(body.vx)
        }
        if (body.y < bounds.minY) {
          body.y = bounds.minY
          body.vy = Math.abs(body.vy)
        }
        if (body.y > bounds.maxY) {
          body.y = bounds.maxY
          body.vy = -Math.abs(body.vy)
        }
      })

      Array.from(bodies.keys()).forEach((id) => {
        if (!noteIds.has(id)) bodies.delete(id)
      })

      for (let pass = 0; pass < 3; pass += 1) {
        for (let first = 0; first < notes.length; first += 1) {
          for (let second = first + 1; second < notes.length; second += 1) {
            const a = bodies.get(notes[first].id)
            const b = bodies.get(notes[second].id)
            if (!a || !b) continue

            const dx = b.x - a.x
            const dy = b.y - a.y
            const distance = Math.max(Math.hypot(dx, dy), 0.01)
            const minDistance = size + 6

            if (distance < minDistance) {
              const nx = dx / distance
              const ny = dy / distance
              const overlap = (minDistance - distance) / 2

              a.x -= nx * overlap
              a.y -= ny * overlap
              b.x += nx * overlap
              b.y += ny * overlap

              const aMomentum = a.vx * nx + a.vy * ny
              const bMomentum = b.vx * nx + b.vy * ny
              a.vx += (bMomentum - aMomentum) * nx
              a.vy += (bMomentum - aMomentum) * ny
              b.vx += (aMomentum - bMomentum) * nx
              b.vy += (aMomentum - bMomentum) * ny

              a.x = Math.min(Math.max(a.x, bounds.minX), bounds.maxX)
              a.y = Math.min(Math.max(a.y, bounds.minY), bounds.maxY)
              b.x = Math.min(Math.max(b.x, bounds.minX), bounds.maxX)
              b.y = Math.min(Math.max(b.y, bounds.minY), bounds.maxY)
            }
          }
        }
      }

      const nextPositions = {}
      notes.forEach((note) => {
        const body = bodies.get(note.id)
        if (!body) return
        nextPositions[note.id] = {
          x: body.x,
          y: body.y,
          size: body.size
        }
      })
      setPositions(nextPositions)
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frameId)
    }
  }, [notes])

  return (
    <main className="app-shell">
      <header className="zoo-header">
        <div>
          <p className="eyebrow">Sticky notes, wilder ideas</p>
          <h1>Sticky Zoo</h1>
        </div>
        <div className="zoo-stat" aria-live="polite">
          <strong>{notes.length}</strong>
          <span>{notes.length === 1 ? 'friend' : 'friends'}</span>
        </div>
      </header>

      <div className="zoo-workspace">
        <section className="habitat-panel" aria-label="Sticky Zoo habitat">
          <div className="habitat-copy">
            <p>{noteCountLabel}</p>
            <span>{message}</span>
          </div>

          <div className="zoo-stage" ref={stageRef}>
            <div className="sun" aria-hidden="true" />
            <div className="cloud cloud-one" aria-hidden="true" />
            <div className="cloud cloud-two" aria-hidden="true" />
            <div className="hill hill-back" aria-hidden="true" />
            <div className="hill hill-front" aria-hidden="true" />
            <div className="canopy canopy-left" aria-hidden="true" />
            <div className="canopy canopy-right" aria-hidden="true" />
            <div className="pond" aria-hidden="true" />
            <div className="trail" aria-hidden="true" />
            <div className="flower-field" aria-hidden="true" />

            {notes.length === 0 && (
              <div className="empty-habitat">
                <span>Pick a face, choose a color, and send the first sticky friend into the zoo.</span>
              </div>
            )}

            {notes.map((note, index) => {
              const normalized = normalizeNote(note, index)
              const animal = getAnimal(normalized.animal)
              const position = positions[note.id]

              if (!position) return null

              return (
                <button
                  className={`animal-head ${normalized.color}`}
                  key={note.id}
                  onClick={() => openNote(note, index)}
                  style={{
                    '--x': `${position.x}px`,
                    '--y': `${position.y}px`,
                    '--size': `${position.size}px`
                  }}
                  type="button"
                  aria-label={`Open ${normalized.title || animal.name}`}
                >
                  <AnimalFace animalId={normalized.animal} />
                  <span className="animal-title">{normalized.title}</span>
                </button>
              )
            })}
          </div>
        </section>

        <form className={`creator-card ${form.color}`} onSubmit={createNote}>
          <div className="creator-heading">
            <p className="eyebrow">Add a New Sticky Friend</p>
            <h2>Build a buddy</h2>
            <span>{message}</span>
          </div>

          <label>
            Title
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Trail map"
              maxLength="80"
            />
          </label>

          <label>
            Description
            <textarea
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              placeholder="Add the details worth remembering..."
              maxLength="1000"
            />
          </label>

          <div className="choice-group">
            <span>Animal head</span>
            <div className="animal-picker create-picker">
              {ANIMALS.map((animal) => (
                <button
                  className={`animal-choice ${form.animal === animal.id ? 'selected' : ''}`}
                  key={animal.id}
                  onClick={() => setForm({ ...form, animal: animal.id })}
                  type="button"
                  aria-pressed={form.animal === animal.id}
                  aria-label={`Choose ${animal.name}`}
                  title={animal.name}
                >
                  <AnimalFace animalId={animal.id} />
                  <span className="animal-choice-label">{animal.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="choice-group">
            <span>Accent color</span>
            <div className="color-row">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className={`swatch ${color.id} ${form.color === color.id ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, color: color.id })}
                  aria-pressed={form.color === color.id}
                  aria-label={`Choose ${color.label}`}
                  title={color.label}
                >
                  <span className="swatch-gloss" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          <button className="primary-button" type="submit">Add friend</button>
        </form>
      </div>

      {activeNote && activeDraft && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setActiveId(null)}>
          <section
            className={`note-modal ${activeDraft.color}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="icon-button close-button" type="button" onClick={() => setActiveId(null)} aria-label="Close note">x</button>
            <h2 className="sr-only" id="note-modal-title">Edit sticky friend</h2>

            <div className="modal-face" aria-hidden="true">
              <AnimalFace animalId={activeDraft.animal} />
            </div>

            <label>
              Title
              <input
                value={activeDraft.title}
                onChange={(event) => updateDraft(activeNote.id, 'title', event.target.value)}
                maxLength="80"
              />
            </label>

            <label>
              Description
              <textarea
                value={activeDraft.body}
                onChange={(event) => updateDraft(activeNote.id, 'body', event.target.value)}
                maxLength="1000"
              />
            </label>

            <div className="choice-group">
              <span>Animal head</span>
              <div className="animal-picker">
                {ANIMALS.map((animal) => (
                  <button
                    className={`animal-choice ${activeDraft.animal === animal.id ? 'selected' : ''}`}
                    key={animal.id}
                    onClick={() => updateDraft(activeNote.id, 'animal', animal.id)}
                    type="button"
                    aria-pressed={activeDraft.animal === animal.id}
                    aria-label={`Choose ${animal.name}`}
                    title={animal.name}
                  >
                    <AnimalFace animalId={animal.id} />
                    <span className="animal-choice-label">{animal.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="choice-group">
              <span>Accent</span>
              <div className="color-row compact">
                {COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    className={`swatch ${color.id} ${activeDraft.color === color.id ? 'selected' : ''}`}
                    onClick={() => updateDraft(activeNote.id, 'color', color.id)}
                    aria-pressed={activeDraft.color === color.id}
                    aria-label={`Choose ${color.label}`}
                    title={color.label}
                  >
                    <span className="swatch-gloss" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="secondary-button danger" type="button" onClick={() => deleteNote(activeNote.id)}>Delete</button>
              <button className="secondary-button" type="button" onClick={() => setActiveId(null)}>Cancel</button>
              <button className="primary-button" type="button" onClick={() => saveEdit(activeNote.id)}>Save</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
