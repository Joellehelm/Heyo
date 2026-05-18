# Heyo

A really, really fun and really, really cute sticky note app with a Ruby on Rails API backend and a React frontend.

## Features

- Create sticky notes
- Name each note
- Edit note title, body, and color
- Delete notes
- Cute colors, playful animations, and a happy little board

## Stack

- Backend: Ruby on Rails API + SQLite
- Frontend: Vite + React

## Run the backend

```bash
cd backend
bundle install
bin/rails db:prepare
bin/rails db:seed
bin/rails s
```

The API runs on `http://localhost:3000`.

## Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies `/api` requests to the Rails backend.

## API endpoints

- `GET /api/notes` ??? list notes
- `POST /api/notes` ??? create a note
- `PATCH /api/notes/:id` ??? update a note
- `DELETE /api/notes/:id` ??? delete a note

## Note colors

Supported sticky note colors are `banana`, `bubblegum`, `mint`, `sky`, `lavender`, and `peach`.
