const express = require('express');
const router = express.Router();
const noteModel = require('../models/noteModel');

// GET all tags (must be before /:id to avoid being caught by note ID parameter)
router.get('/tags', (req, res) => {
  try {
    const tags = noteModel.getAllTags();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET search notes (must be before /:id)
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const notes = noteModel.searchNotes(q);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET notes by tag (must be before /:id)
router.get('/tag/:tagName', (req, res) => {
  try {
    const notes = noteModel.getNotesByTag(req.params.tagName);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all notes
router.get('/', (req, res) => {
  try {
    const notes = noteModel.getAllNotes();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET note by ID
router.get('/:id', (req, res) => {
  try {
    const note = noteModel.getNoteById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create note
router.post('/', (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const note = noteModel.createNote(title, content, tags);
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update note
router.put('/:id', (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const note = noteModel.getNoteById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const updatedNote = noteModel.updateNote(title, content, tags);
    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE note
router.delete('/:id', (req, res) => {
  try {
    const note = noteModel.getNoteById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    noteModel.deleteNote(req.params.id);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
