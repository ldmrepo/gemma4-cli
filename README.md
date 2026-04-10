# Markdown Notes App

A modern markdown note-taking application built with React, Express, and SQLite.

## Features

- ✅ **CRUD Operations**: Create, Read, Update, and Delete notes
- ✅ **Markdown Support**: Real-time markdown preview with formatting
- ✅ **Tag Management**: Organize notes with tags
- ✅ **Tag Filtering**: Filter notes by tags
- ✅ **Search**: Search notes by title or content
- ✅ **Responsive UI**: Works on desktop and mobile

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Markdown**: react-markdown with remark-gfm

## Installation

```bash
# Install dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd todo-app && npm install && cd ..
```

## Usage

### Development

```bash
# Start both backend and frontend concurrently
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Production Build

```bash
# Build the frontend
npm run build

# Start the backend server (serves the built frontend)
cd backend && npm start
```

## API Endpoints

- `GET /api/notes` - Get all notes
- `GET /api/notes/:id` - Get note by ID
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note
- `GET /api/notes/search?q=query` - Search notes
- `GET /api/notes/tag/:tagName` - Get notes by tag
- `GET /api/notes/tags` - Get all tags

## Data Model

### Notes
- `id`: Primary key
- `title`: Note title
- `content`: Markdown content
- `tags`: Comma-separated tags
- `created_at`: Creation timestamp
- `updated_at`: Update timestamp

### Tags
- `id`: Primary key
- `name`: Tag name (unique)
- `note_count`: Number of notes with this tag

## Project Structure

```
gemma4-cli/
├── backend/
│   ├── src/
│   │   ├── db.js              # Database setup
│   │   ├── models/
│   │   │   └── noteModel.js   # Database models
│   │   ├── routes/
│   │   │   └── notes.js       # API routes
│   │   └── server.js          # Express server
│   └── data/
│       └── notes.db           # SQLite database
├── todo-app/
│   ├── src/
│   │   ├── App.jsx            # Main app component
│   │   ├── App.css            # Styles
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   └── dist/                  # Built files
└── README.md
```

## License

MIT
