import { useEffect, useMemo, useRef, useState } from 'react';

const COLORS = ['banana', 'bubblegum', 'mint', 'sky', 'lavender', 'peach'];
const ANIMALS = ['🐱', '🐶', '🐻', '🦊', '🐼', '🐨', '🐯', '🐸', '🐵', '🐷', '🐮'];
const NEW_NOTE = { title: '', body: '', color: 'banana' };
const HEAD_SIZE = 72;
const BUNNY_HEAD = { id: 'bunny-guide', title: 'Bunny helper', body: 'Click an animal head to open its sticky note.', color: 'bubblegum', animal: '🐰', isGuide: true };

function App() {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(NEW_NOTE);
  const [editingId, setEditingId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState('Loading your notes...');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [heads, setHeads] = useState([]);
  const cloudRef = useRef(null);
  const headsRef = useRef([]);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    fetchNotes();
  }, []);

  const floatingItems = useMemo(() => [BUNNY_HEAD, ...notes.map((note, index) => ({ ...note, animal: ANIMALS[index % ANIMALS.length] }))], [notes]);

  const noteCountLabel = useMemo(() => {
    if (notes.length === 0) return 'No notes yet — make a tiny masterpiece!';
    if (notes.length === 1) return '1 animal head is floating with a secret sticky note.';
    return `${notes.length} animal heads are floating with secret sticky notes.`;
  }, [notes.length]);

  useEffect(() => {
    setHeads((currentHeads) => {
      const currentById = new Map(currentHeads.map((head) => [String(head.id), head]));
      const bounds = getCloudBounds();
      const nextHeads = floatingItems.map((item, index) => {
        const existing = currentById.get(String(item.id));
        if (existing) return { ...existing, item };
        return createHead(item, index, bounds);
      });
      return separateHeads(nextHeads, bounds);
    });
  }, [floatingItems]);

  useEffect(() => {
    headsRef.current = heads;
  }, [heads]);

  useEffect(() => {
    function tick(time) {
      const previous = lastTimeRef.current || time;
      const delta = Math.min((time - previous) / 1000, 0.04);
      lastTimeRef.current = time;
      const bounds = getCloudBounds();
      headsRef.current = moveHeads(headsRef.current, bounds, delta);
      setHeads(headsRef.current);
      animationRef.current = requestAnimationFrame(tick);
    }

    animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  function getCloudBounds() {
    const rect = cloudRef.current?.getBoundingClientRect();
    return {
      width: Math.max(rect?.width || 900, HEAD_SIZE * 3),
      height: Math.max(rect?.height || 320, HEAD_SIZE * 3)
    };
  }

  function createHead(item, index, bounds) {
    const seed = String(item.id).split('').reduce((sum, character) => sum + character.charCodeAt(0), 0) + index * 29;
    const radius = HEAD_SIZE / 2;
    const x = radius + ((seed * 37) % Math.max(1, bounds.width - HEAD_SIZE));
    const y = radius + ((seed * 53) % Math.max(1, bounds.height - HEAD_SIZE));
    const speed = 24 + (seed % 18);
    const angle = ((seed * 47) % 360) * (Math.PI / 180);
    return {
      id: item.id,
      item,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    };
  }

  function separateHeads(nextHeads, bounds) {
    const radius = HEAD_SIZE / 2;
    const minDistance = HEAD_SIZE + 8;
    for (let pass = 0; pass < 8; pass += 1) {
      for (let i = 0; i < nextHeads.length; i += 1) {
        for (let j = i + 1; j < nextHeads.length; j += 1) {
          const first = nextHeads[i];
          const second = nextHeads[j];
          const dx = second.x - first.x;
          const dy = second.y - first.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < minDistance) {
            const overlap = (minDistance - distance) / 2;
            const nx = dx / distance;
            const ny = dy / distance;
            first.x -= nx * overlap;
            first.y -= ny * overlap;
            second.x += nx * overlap;
            second.y += ny * overlap;
          }
        }
        nextHeads[i].x = clamp(nextHeads[i].x, radius, bounds.width - radius);
        nextHeads[i].y = clamp(nextHeads[i].y, radius, bounds.height - radius);
      }
    }
    return nextHeads;
  }

  function moveHeads(currentHeads, bounds, delta) {
    const radius = HEAD_SIZE / 2;
    const minDistance = HEAD_SIZE + 8;
    const moved = currentHeads.map((head) => {
      let x = head.x + head.vx * delta;
      let y = head.y + head.vy * delta;
      let vx = head.vx;
      let vy = head.vy;

      if (x <= radius || x >= bounds.width - radius) {
        vx *= -1;
        x = clamp(x, radius, bounds.width - radius);
      }
      if (y <= radius || y >= bounds.height - radius) {
        vy *= -1;
        y = clamp(y, radius, bounds.height - radius);
      }

      return { ...head, x, y, vx, vy };
    });

    for (let i = 0; i < moved.length; i += 1) {
      for (let j = i + 1; j < moved.length; j += 1) {
        const first = moved[i];
        const second = moved[j];
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < minDistance) {
          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = (minDistance - distance) / 2;
          first.x -= nx * overlap;
          first.y -= ny * overlap;
          second.x += nx * overlap;
          second.y += ny * overlap;

          const firstDot = first.vx * nx + first.vy * ny;
          const secondDot = second.vx * nx + second.vy * ny;
          first.vx += (secondDot - firstDot) * nx;
          first.vy += (secondDot - firstDot) * ny;
          second.vx += (firstDot - secondDot) * nx;
          second.vy += (firstDot - secondDot) * ny;
        }
      }
    }

    return moved.map((head) => ({
      ...head,
      x: clamp(head.x, radius, bounds.width - radius),
      y: clamp(head.y, radius, bounds.height - radius)
    }));
  }

  async function fetchNotes() {
    try {
      const response = await fetch('/api/notes');
      if (!response.ok) throw new Error('Could not load notes');
      const data = await response.json();
      setNotes(data);
      setMessage('Ready for sparkly ideas!');
    } catch {
      setMessage('Start the Rails API to save notes. You can still admire the app!');
    }
  }

  async function createNote(event) {
    event.preventDefault();
    const payload = {
      title: form.title.trim() || 'Untitled sparkle',
      body: form.body,
      color: form.color
    };

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: payload })
      });
      if (!response.ok) throw new Error('Could not create note');
      const note = await response.json();
      setNotes([note, ...notes]);
      setForm(NEW_NOTE);
      setActiveNoteId(note.id);
      setMessage('Boop! A new animal head floated in.');
    } catch {
      setMessage('Oopsie! Could not save that note yet.');
    }
  }

  function beginEdit(note) {
    setEditingId(note.id);
    setDrafts({ ...drafts, [note.id]: { title: note.title, body: note.body, color: note.color } });
  }

  async function saveEdit(noteId) {
    try {
      const draft = drafts[noteId];
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: { ...draft, title: draft.title.trim() || 'Untitled sparkle' } })
      });
      if (!response.ok) throw new Error('Could not update note');
      const updated = await response.json();
      setNotes(notes.map((note) => (note.id === noteId ? updated : note)));
      setEditingId(null);
      setMessage('Saved with a sprinkle of stardust!');
    } catch {
      setMessage('Eek! That edit did not stick.');
    }
  }

  async function deleteNote(noteId) {
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete note');
      setNotes(notes.filter((note) => note.id !== noteId));
      setActiveNoteId(null);
      setEditingId(null);
      setMessage('Poof! Note floated away.');
    } catch {
      setMessage('That note is being stubborn and stayed put.');
    }
  }

  function updateDraft(noteId, field, value) {
    setDrafts({
      ...drafts,
      [noteId]: { ...drafts[noteId], [field]: value }
    });
  }

  function openItem(item) {
    if (item.isGuide) {
      setMessage('Bunny says: make a note, then click its floating animal head!');
      return;
    }
    setActiveNoteId(item.id);
    setEditingId(null);
  }

  function closeModal() {
    setActiveNoteId(null);
    setEditingId(null);
  }

  const activeNote = notes.find((note) => note.id === activeNoteId);
  const activeDraft = activeNote ? drafts[activeNote.id] : null;

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Heyo sticky zoo</p>
          <h1>Floating animal heads guard your notes.</h1>
          <p>{noteCountLabel}</p>
        </div>
        <div className="mascot" aria-hidden="true">🐰</div>
      </section>

      <section className="animal-cloud" ref={cloudRef} aria-label="Floating animal note heads">
        {heads.map((head) => (
          <button
            className={`floating-animal ${head.item.id === activeNoteId ? 'active' : ''}`}
            key={head.id}
            type="button"
            onClick={() => openItem(head.item)}
            style={{ left: `${head.x}px`, top: `${head.y}px` }}
            aria-label={head.item.isGuide ? 'Bunny helper' : `Open note ${head.item.title}`}
          >
            <span aria-hidden="true">{head.item.animal}</span>
          </button>
        ))}
      </section>

      <form className="creator-card" onSubmit={createNote}>
        <h2>Create a floating note friend</h2>
        <label>
          Note name
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Tiny thought title" />
        </label>
        <label>
          Sticky note message
          <textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Write something cute..." />
        </label>
        <div className="color-row" aria-label="Choose note color">
          {COLORS.map((color) => (
            <button
              className={`swatch ${color} ${form.color === color ? 'selected' : ''}`}
              key={color}
              type="button"
              onClick={() => setForm({ ...form, color })}
              aria-label={`Choose ${color}`}
            />
          ))}
        </div>
        <button className="primary-button" type="submit">Float a new animal head</button>
      </form>

      <p className="status">{message}</p>

      {activeNote && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={closeModal}>
          <article className={`sticky-note modal-note ${activeNote.color}`} onMouseDown={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={closeModal} aria-label="Close note">×</button>
            {editingId === activeNote.id ? (
              <>
                <input value={activeDraft?.title || ''} onChange={(event) => updateDraft(activeNote.id, 'title', event.target.value)} />
                <textarea value={activeDraft?.body || ''} onChange={(event) => updateDraft(activeNote.id, 'body', event.target.value)} />
                <div className="color-row compact">
                  {COLORS.map((color) => (
                    <button
                      className={`swatch ${color} ${activeDraft?.color === color ? 'selected' : ''}`}
                      key={color}
                      type="button"
                      onClick={() => updateDraft(activeNote.id, 'color', color)}
                      aria-label={`Choose ${color}`}
                    />
                  ))}
                </div>
                <div className="note-actions">
                  <button type="button" onClick={() => saveEdit(activeNote.id)}>Save</button>
                  <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h2 id="modal-title">{activeNote.title}</h2>
                <p>{activeNote.body || 'This sticky note is waiting for words.'}</p>
                <div className="note-actions">
                  <button type="button" onClick={() => beginEdit(activeNote)}>Edit</button>
                  <button type="button" onClick={() => deleteNote(activeNote.id)}>Delete</button>
                </div>
              </>
            )}
          </article>
        </div>
      )}
    </main>
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default App;
