import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

const API_URL = '/api/notes';

function App() {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [filterTag, setFilterTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState(new Set());

  // Load notes on mount
  useEffect(() => {
    fetchNotes();
  }, [filterTag]);

  // Load all tags
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchNotes = async () => {
    try {
      let url = `${API_URL}`;
      if (filterTag) {
        url = `${API_URL}/tag/${encodeURIComponent(filterTag)}`;
      } else if (searchQuery) {
        url = `${API_URL}/search?q=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_URL}/tags`);
      const data = await response.json();
      setAllTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSelectNote = async (note) => {
    if (selectedNoteIds.has(note.id)) {
      // Delete note
      try {
        await fetch(`${API_URL}/${note.id}`, {
          method: 'DELETE'
        });
        fetchNotes();
        if (currentNote?.id === note.id) {
          setCurrentNote(null);
          setTitle('');
          setContent('');
          setTags('');
        }
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    } else {
      // Select note for editing
      setCurrentNote(note);
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || '');
      setSelectedNoteIds(new Set([note.id]));
    }
  };

  const handleCreateNew = () => {
    setCurrentNote(null);
    setTitle('');
    setContent('');
    setTags('');
    setSelectedNoteIds(new Set());
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required!');
      return;
    }

    const noteData = {
      title: title.trim(),
      content: content.trim(),
      tags: tags.trim()
    };

    try {
      if (currentNote) {
        await fetch(`${API_URL}/${currentNote.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(noteData)
        });
      } else {
        await fetch(`${API_URL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(noteData)
        });
      }
      fetchNotes();
      handleCreateNew();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      setFilterTag(null);
    }
  };

  const handleTagFilter = (tagName) => {
    setFilterTag(tagName);
    setSearchQuery('');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 Markdown Notes</h1>
        <div className="header-actions">
          <button onClick={handleCreateNew} className="btn btn-primary">
            + New Note
          </button>
        </div>
      </header>

      <div className="main-content">
        {/* Sidebar with tags and search */}
        <aside className="sidebar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <div className="tags-section">
            <h3 className="section-title">Tags</h3>
            <div className="tags-list">
              {allTags.map(tag => (
                <button
                  key={tag.name}
                  onClick={() => handleTagFilter(tag.name)}
                  className={`tag-btn ${filterTag === tag.name ? 'active' : ''}`}
                >
                  <span className="tag-name">{tag.name}</span>
                  <span className="tag-count">{tag.note_count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-footer">
            <span className="note-count">{notes.length} notes</span>
          </div>
        </aside>

        {/* Notes list */}
        <div className="notes-list">
          <h2 className="list-title">
            {filterTag ? `Tag: ${filterTag}` : searchQuery ? `Search: ${searchQuery}` : 'All Notes'}
          </h2>
          <div className="notes-grid">
            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`note-item ${selectedNoteIds.has(note.id) ? 'selected' : ''}`}
              >
                <h3 className="note-title">{note.title}</h3>
                <p className="note-preview">{note.content.substring(0, 100)}...</p>
                {note.tags && (
                  <div className="note-tags">
                    {note.tags.split(', ').map(tag => (
                      <span key={tag} className="note-tag">{tag}</span>
                    ))}
                  </div>
                )}
                <span className="note-date">
                  {new Date(note.updated_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {notes.length === 0 && (
              <div className="empty-state">
                No notes found. Create your first note!
              </div>
            )}
          </div>
        </div>

        {/* Editor panel */}
        <div className="editor-panel">
          <div className="editor-header">
            <h2>{currentNote ? 'Edit Note' : 'Create Note'}</h2>
            <button onClick={handleSave} className="btn btn-save">
              💾 Save
            </button>
          </div>

          <div className="editor-content">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="note-input title-input"
            />
            
            <textarea
              placeholder="Write in Markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="note-input content-input"
              rows={10}
            />

            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="note-input tags-input"
            />
          </div>

          <div className="preview-section">
            <h3>Preview</h3>
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
