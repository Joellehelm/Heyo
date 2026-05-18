import { useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'sticky-zoo-notes'
const FRIEND_SIZE = 118
const FRIEND_RADIUS = FRIEND_SIZE / 2
const ARENA_INSET = 22

const animalOptions = [
  { id: 'fox', label: 'Fox' },
  { id: 'cat', label: 'Cat' },
  { id: 'bear', label: 'Bear' },
  { id: 'panda', label: 'Panda' },
  { id: 'frog', label: 'Frog' },
  { id: 'rabbit', label: 'Rabbit' },
]

const colorOptions = [
  { id: '#f5c451', label: 'Honey' },
  { id: '#94d3b4', label: 'Moss' },
  { id: '#8ecae6', label: 'Harbor' },
  { id: '#d7b8f3', label: 'Lilac' },
  { id: '#f2a7a0', label: 'Coral' },
  { id: '#d4c4a8', label: 'Linen' },
]

const starterNotes = [
  {
    id: 'starter-fox',
    title: 'Pack snacks',
    body: 'Trail mix for tiny quests.',
    color: '#f5c451',
    animal: 'fox',
  },
  {
    id: 'starter-cat',
    title: 'Water plants',
    body: 'Start with the sunny window.',
    color: '#94d3b4',
    animal: 'cat',
  },
  {
    id: 'starter-bear',
    title: 'Dream list',
    body: 'Save one big idea.',
    color: '#d7b8f3',
    animal: 'bear',
  },
]

function loadNotes() {
  try {
    const savedNotes = window.localStorage.getItem(STORAGE_KEY)
    const parsedNotes = savedNotes ? JSON.parse(savedNotes) : starterNotes

    if (!Array.isArray(parsedNotes)) {
      return starterNotes
    }

    return parsedNotes.map((note, index) => ({
      id: String(note.id || `note-${index}`),
      title: note.title || 'Untitled friend',
      body: note.body || '',
      color: colorOptions.some((color) => color.id === note.color)
        ? note.color
        : colorOptions[index % colorOptions.length].id,
      animal: animalOptions.some((animal) => animal.id === note.animal)
        ? note.animal
        : animalOptions[index % animalOptions.length].id,
    }))
  } catch {
    return starterNotes
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function angleDifference(target, current) {
  return Math.atan2(Math.sin(target - current), Math.cos(target - current))
}

function createMotion(bounds = { width: 820, height: 460 }, timestamp = 0) {
  const minX = ARENA_INSET + FRIEND_RADIUS
  const minY = ARENA_INSET + FRIEND_RADIUS
  const maxX = Math.max(minX, bounds.width - ARENA_INSET - FRIEND_RADIUS)
  const maxY = Math.max(minY, bounds.height - ARENA_INSET - FRIEND_RADIUS)
  const angle = randomBetween(0, Math.PI * 2)
  const speed = randomBetween(10, 18)

  return {
    x: randomBetween(minX, maxX),
    y: randomBetween(minY, maxY),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed,
    angle,
    targetAngle: angle,
    radius: FRIEND_RADIUS,
    tilt: 0,
    nextTurn: timestamp + randomBetween(2400, 5600),
  }
}

function AnimalHead({ animal }) {
  return (
    <span className={`animal-head animal-head--${animal}`} aria-hidden="true">
      <span className="animal-ear animal-ear--left" />
      <span className="animal-ear animal-ear--right" />
      <span className="animal-face">
        <span className="animal-mask animal-mask--left" />
        <span className="animal-mask animal-mask--right" />
        <span className="animal-eye animal-eye--left" />
        <span className="animal-eye animal-eye--right" />
        <span className="animal-cheek animal-cheek--left" />
        <span className="animal-cheek animal-cheek--right" />
        <span className="animal-muzzle" />
        <span className="animal-nose" />
        <span className="animal-mouth" />
        <span className="animal-whisker animal-whisker--left-a" />
        <span className="animal-whisker animal-whisker--left-b" />
        <span className="animal-whisker animal-whisker--right-a" />
        <span className="animal-whisker animal-whisker--right-b" />
      </span>
    </span>
  )
}

function ColorSwatches({ value, onChange }) {
  return (
    <fieldset className="color-field">
      <legend>Color</legend>
      <div className="color-swatches">
        {colorOptions.map((color) => (
          <button
            className="color-swatch"
            key={color.id}
            style={{ '--swatch-color': color.id }}
            type="button"
            aria-label={color.label}
            aria-pressed={value === color.id}
            onClick={() => onChange(color.id)}
          />
        ))}
      </div>
    </fieldset>
  )
}

function App() {
  const [notes, setNotes] = useState(loadNotes)
  const [draft, setDraft] = useState({
    title: '',
    body: '',
    animal: animalOptions[0].id,
    color: colorOptions[0].id,
  })
  const [activeId, setActiveId] = useState(null)
  const [editorDraft, setEditorDraft] = useState(null)

  const arenaRef = useRef(null)
  const noteRefs = useRef(new Map())
  const notesRef = useRef(notes)
  const motionRef = useRef(new Map())
  const rafRef = useRef(0)
  const lastFrameRef = useRef(0)
  const titleInputRef = useRef(null)

  const activeNote = useMemo(() => notes.find((note) => note.id === activeId), [activeId, notes])
  const editorOpen = Boolean(activeId && editorDraft)

  useEffect(() => {
    notesRef.current = notes
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))

    const noteIds = new Set(notes.map((note) => note.id))
    for (const id of motionRef.current.keys()) {
      if (!noteIds.has(id)) {
        motionRef.current.delete(id)
      }
    }
  }, [notes])

  useEffect(() => {
    if (!activeNote) {
      setEditorDraft(null)
      return
    }

    setEditorDraft({
      title: activeNote.title,
      body: activeNote.body,
      color: activeNote.color,
      animal: activeNote.animal,
    })
  }, [activeNote])

  useEffect(() => {
    if (editorOpen && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [activeId, editorOpen])

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        closeEditor()
      }
    }

    if (!activeId) {
      return undefined
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => {
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [activeId])

  useEffect(() => {
    function step(timestamp) {
      const arena = arenaRef.current
      const notesForFrame = notesRef.current

      if (!arena) {
        rafRef.current = window.requestAnimationFrame(step)
        return
      }

      const bounds = arena.getBoundingClientRect()
      const deltaSeconds = Math.min((timestamp - (lastFrameRef.current || timestamp)) / 1000, 0.05)
      lastFrameRef.current = timestamp

      notesForFrame.forEach((note) => {
        if (!motionRef.current.has(note.id)) {
          motionRef.current.set(note.id, createMotion(bounds, timestamp))
        }
      })

      const movers = notesForFrame
        .map((note) => [note, motionRef.current.get(note.id)])
        .filter(([, motion]) => motion)

      movers.forEach(([, motion]) => {
        if (timestamp >= motion.nextTurn) {
          motion.targetAngle += randomBetween(-0.65, 0.65)
          motion.speed = randomBetween(10, 18)
          motion.nextTurn = timestamp + randomBetween(2600, 6200)
        }

        motion.angle += clamp(
          angleDifference(motion.targetAngle, motion.angle),
          -deltaSeconds * 0.58,
          deltaSeconds * 0.58,
        )

        const targetVx = Math.cos(motion.angle) * motion.speed
        const targetVy = Math.sin(motion.angle) * motion.speed
        const smoothing = Math.min(1, deltaSeconds * 1.85)

        motion.vx += (targetVx - motion.vx) * smoothing
        motion.vy += (targetVy - motion.vy) * smoothing
        motion.x += motion.vx * deltaSeconds
        motion.y += motion.vy * deltaSeconds
        motion.tilt += (clamp(motion.vx * 0.18, -4.5, 4.5) - motion.tilt) * Math.min(1, deltaSeconds * 3.2)

        const minX = ARENA_INSET + motion.radius
        const maxX = Math.max(minX, bounds.width - ARENA_INSET - motion.radius)
        const minY = ARENA_INSET + motion.radius
        const maxY = Math.max(minY, bounds.height - ARENA_INSET - motion.radius)

        if (motion.x < minX) {
          motion.x = minX
          motion.vx = Math.abs(motion.vx)
          motion.angle = Math.atan2(motion.vy, motion.vx)
          motion.targetAngle = motion.angle
        } else if (motion.x > maxX) {
          motion.x = maxX
          motion.vx = -Math.abs(motion.vx)
          motion.angle = Math.atan2(motion.vy, motion.vx)
          motion.targetAngle = motion.angle
        }

        if (motion.y < minY) {
          motion.y = minY
          motion.vy = Math.abs(motion.vy)
          motion.angle = Math.atan2(motion.vy, motion.vx)
          motion.targetAngle = motion.angle
        } else if (motion.y > maxY) {
          motion.y = maxY
          motion.vy = -Math.abs(motion.vy)
          motion.angle = Math.atan2(motion.vy, motion.vx)
          motion.targetAngle = motion.angle
        }
      })

      for (let firstIndex = 0; firstIndex < movers.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < movers.length; secondIndex += 1) {
          const first = movers[firstIndex][1]
          const second = movers[secondIndex][1]
          const dx = second.x - first.x
          const dy = second.y - first.y
          const distance = Math.hypot(dx, dy) || 1
          const minimumDistance = first.radius + second.radius + 6

          if (distance >= minimumDistance) {
            continue
          }

          const nx = dx / distance
          const ny = dy / distance
          const overlap = ((minimumDistance - distance) / 2) * 0.22
          first.x -= nx * overlap
          first.y -= ny * overlap
          second.x += nx * overlap
          second.y += ny * overlap

          const relativeVelocityX = second.vx - first.vx
          const relativeVelocityY = second.vy - first.vy
          const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny

          if (velocityAlongNormal >= 0) {
            continue
          }

          const bounce = velocityAlongNormal * -0.18
          first.vx -= bounce * nx
          first.vy -= bounce * ny
          second.vx += bounce * nx
          second.vy += bounce * ny
          first.angle = Math.atan2(first.vy, first.vx)
          second.angle = Math.atan2(second.vy, second.vx)
          first.targetAngle = first.angle + randomBetween(-0.28, 0.28)
          second.targetAngle = second.angle + randomBetween(-0.28, 0.28)
        }
      }

      movers.forEach(([, motion]) => {
        const minX = ARENA_INSET + motion.radius
        const maxX = Math.max(minX, bounds.width - ARENA_INSET - motion.radius)
        const minY = ARENA_INSET + motion.radius
        const maxY = Math.max(minY, bounds.height - ARENA_INSET - motion.radius)

        motion.x = clamp(motion.x, minX, maxX)
        motion.y = clamp(motion.y, minY, maxY)
      })

      movers.forEach(([note, motion]) => {
        const element = noteRefs.current.get(note.id)
        if (!element) {
          return
        }

        element.style.setProperty('--friend-tilt', `${motion.tilt}deg`)
        element.style.transform = `translate3d(${motion.x - motion.radius}px, ${motion.y - motion.radius}px, 0) rotate(var(--friend-tilt))`
      })

      rafRef.current = window.requestAnimationFrame(step)
    }

    rafRef.current = window.requestAnimationFrame(step)

    return () => {
      window.cancelAnimationFrame(rafRef.current)
    }
  }, [])

  function setFriendRef(id, element) {
    if (element) {
      noteRefs.current.set(id, element)
    } else {
      noteRefs.current.delete(id)
    }
  }

  function createNote(event) {
    event.preventDefault()

    const title = draft.title.trim()
    const body = draft.body.trim()

    if (!title && !body) {
      return
    }

    const nextNote = {
      id: `note-${Date.now()}`,
      title: title || 'Untitled friend',
      body,
      color: draft.color,
      animal: draft.animal,
    }

    setNotes((currentNotes) => [...currentNotes, nextNote])
    setDraft({
      title: '',
      body: '',
      animal: animalOptions[(notes.length + 1) % animalOptions.length].id,
      color: colorOptions[(notes.length + 1) % colorOptions.length].id,
    })
  }

  function openNote(note) {
    setActiveId(note.id)
  }

  function closeEditor() {
    setActiveId(null)
  }

  function saveActiveNote(event) {
    event.preventDefault()

    if (!activeNote || !editorDraft) {
      return
    }

    const title = editorDraft.title.trim()
    const body = editorDraft.body.trim()

    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === activeNote.id
          ? {
              ...note,
              title: title || 'Untitled friend',
              body,
              animal: editorDraft.animal,
              color: editorDraft.color,
            }
          : note,
      ),
    )
    closeEditor()
  }

  function deleteActiveNote() {
    if (!activeNote) {
      return
    }

    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== activeNote.id))
    closeEditor()
  }

  return (
    <main className="app-shell">
      <section className="sticky-zoo" aria-labelledby="sticky-zoo-title">
        <header className="zoo-header">
          <div>
            <p className="eyebrow">Sticky Zoo</p>
            <h1 id="sticky-zoo-title">Sticky Zoo</h1>
          </div>
          <div className="zoo-status" aria-label={`${notes.length} sticky friends`}>
            <span>{notes.length}</span>
            <small>friends</small>
          </div>
        </header>

        <div className="zoo-stage">
          <div className="zoo-arena" ref={arenaRef} aria-label="Sticky friends playground">
            {notes.map((note) => (
              <button
                className="sticky-friend"
                key={note.id}
                ref={(element) => setFriendRef(note.id, element)}
                style={{ '--friend-color': note.color }}
                type="button"
                onClick={() => openNote(note)}
                aria-label={`Open ${note.title}`}
              >
                <AnimalHead animal={note.animal} />
                <span>{note.title}</span>
              </button>
            ))}
          </div>

          <form className="new-sticky" onSubmit={createNote} aria-label="Create a new Sticky Friend">
            <div className="form-heading">
              <p className="eyebrow">Sticky Friend</p>
              <h2>New friend</h2>
            </div>

            <label>
              <span>Name</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Lunch plan"
              />
            </label>

            <label>
              <span>Note</span>
              <textarea
                value={draft.body}
                onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                placeholder="What should it remember?"
                rows="2"
              />
            </label>

            <label>
              <span>Animal</span>
              <select
                value={draft.animal}
                onChange={(event) => setDraft((current) => ({ ...current, animal: event.target.value }))}
              >
                {animalOptions.map((animal) => (
                  <option key={animal.id} value={animal.id}>
                    {animal.label}
                  </option>
                ))}
              </select>
            </label>

            <ColorSwatches
              value={draft.color}
              onChange={(color) => setDraft((current) => ({ ...current, color }))}
            />

            <button className="create-button" type="submit">
              Add
            </button>
          </form>
        </div>
      </section>

      {activeNote && editorDraft ? (
        <div className="note-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeEditor()}>
          <form className="note-dialog" onSubmit={saveActiveNote} role="dialog" aria-modal="true" aria-labelledby="edit-note-title">
            <div className="dialog-topline">
              <p className="eyebrow">Sticky note</p>
              <button className="icon-button" type="button" onClick={closeEditor} aria-label="Close editor">
                &times;
              </button>
            </div>

            <div className="dialog-preview" style={{ '--friend-color': editorDraft.color }}>
              <AnimalHead animal={editorDraft.animal} />
            </div>

            <label>
              <span id="edit-note-title">Name</span>
              <input
                ref={titleInputRef}
                value={editorDraft.title}
                onChange={(event) => setEditorDraft((current) => ({ ...current, title: event.target.value }))}
              />
            </label>

            <label>
              <span>Note</span>
              <textarea
                value={editorDraft.body}
                onChange={(event) => setEditorDraft((current) => ({ ...current, body: event.target.value }))}
                rows="5"
              />
            </label>

            <div className="editor-grid">
              <label>
                <span>Animal</span>
                <select
                  value={editorDraft.animal}
                  onChange={(event) => setEditorDraft((current) => ({ ...current, animal: event.target.value }))}
                >
                  {animalOptions.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.label}
                    </option>
                  ))}
                </select>
              </label>

              <ColorSwatches
                value={editorDraft.color}
                onChange={(color) => setEditorDraft((current) => ({ ...current, color }))}
              />
            </div>

            <div className="dialog-actions">
              <button className="delete-button" type="button" onClick={deleteActiveNote}>
                Delete
              </button>
              <button className="save-button" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  )
}

export default App
