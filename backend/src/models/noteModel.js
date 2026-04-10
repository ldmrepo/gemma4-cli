const db = require('../db');

class NoteModel {
  // Get all notes with tags
  getAllNotes() {
    const notes = db.prepare(`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.created_at,
        n.updated_at,
        COALESCE(
          (SELECT GROUP_CONCAT(t.name, ', ') 
           FROM note_tags nt 
           JOIN tags t ON nt.tag_id = t.id 
           WHERE nt.note_id = n.id),
          ''
        ) as tags
      FROM notes n
      ORDER BY n.updated_at DESC
    `).all();
    return notes;
  }

  // Get note by ID
  getNoteById(id) {
    const note = db.prepare(`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.created_at,
        n.updated_at,
        COALESCE(
          (SELECT GROUP_CONCAT(t.name, ', ') 
           FROM note_tags nt 
           JOIN tags t ON nt.tag_id = t.id 
           WHERE nt.note_id = n.id),
          ''
        ) as tags
      FROM notes n
      WHERE n.id = ?
    `).get(id);
    return note;
  }

  // Create note
  createNote(title, content, tagString) {
    const note = db.prepare(`
      INSERT INTO notes (title, content)
      VALUES (?, ?)
    `).run(title, content);
    
    const noteId = note.lastInsertRowid;
    
    // Process tags
    this.updateNoteTags(noteId, tagString);
    
    return this.getNoteById(noteId);
  }

  // Update note
  updateNote(id, title, content, tagString) {
    db.prepare('UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, content, id);
    
    this.updateNoteTags(id, tagString);
    
    return this.getNoteById(id);
  }

  // Delete note
  deleteNote(id) {
    db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  }

  // Update tags for a note
  updateNoteTags(noteId, tagString) {
    // Clear existing tags
    db.prepare('DELETE FROM note_tags WHERE note_id = ?').run(noteId);
    
    if (!tagString || tagString.trim() === '') return;
    
    const tags = tagString.split(',').map(t => t.trim()).filter(t => t);
    
    for (const tagName of tags) {
      // Insert or ignore tag
      db.prepare(`
        INSERT OR IGNORE INTO tags (name)
        VALUES (?)
      `).run(tagName);
      
      // Get tag ID
      const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
      
      // Link note to tag
      db.prepare(`
        INSERT OR IGNORE INTO note_tags (note_id, tag_id)
        VALUES (?, ?)
      `).run(noteId, tag.id);
    }
  }

  // Search notes by title or content
  searchNotes(query) {
    const searchQuery = `%${query}%`;
    const notes = db.prepare(`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.created_at,
        n.updated_at,
        COALESCE(
          (SELECT GROUP_CONCAT(t.name, ', ') 
           FROM note_tags nt 
           JOIN tags t ON nt.tag_id = t.id 
           WHERE nt.note_id = n.id),
          ''
        ) as tags
      FROM notes n
      WHERE n.title LIKE ? OR n.content LIKE ?
      ORDER BY n.updated_at DESC
    `).all(searchQuery, searchQuery);
    return notes;
  }

  // Get notes by tag
  getNotesByTag(tagName) {
    const notes = db.prepare(`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.created_at,
        n.updated_at,
        COALESCE(
          (SELECT GROUP_CONCAT(t.name, ', ') 
           FROM note_tags nt 
           JOIN tags t ON nt.tag_id = t.id 
           WHERE nt.note_id = n.id),
          ''
        ) as tags
      FROM notes n
      JOIN note_tags nt ON n.id = nt.note_id
      JOIN tags t ON nt.tag_id = t.id
      WHERE t.name = ?
      ORDER BY n.updated_at DESC
    `).all(tagName);
    return notes;
  }

  // Get all tags
  getAllTags() {
    const tags = db.prepare(`
      SELECT 
        t.name,
        COUNT(DISTINCT nt.note_id) as note_count
      FROM tags t
      LEFT JOIN note_tags nt ON t.id = nt.tag_id
      GROUP BY t.id
      ORDER BY t.name
    `).all();
    return tags;
  }
}

module.exports = new NoteModel();
