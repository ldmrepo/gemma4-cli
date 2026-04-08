import React, { useState, useEffect } from 'react';

function App() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('modern-todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem('modern-todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (inputValue.trim() === '') return;
    const newTodo = {
      id: Date.now(),
      text: inputValue,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTodos([newTodo, ...todos]);
    setInputValue('');
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter((todo) => !todo.completed));
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addTodo();
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <header className="app-header">
          <h1>TaskFlow</h1>
          <p className="subtitle">Organize your day with precision</p>
        </header>

        <div className="input-section">
          <div className="input-group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What needs to be done?"
            />
            <button className="add-btn" onClick={addTodo}>
              <span>Add Task</span>
            </button>
          </div>
        </div>

        <div className="controls-section">
          <div className="filter-group">
            {['all', 'active', 'completed'].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {todos.some(t => t.completed) && (
            <button className="clear-btn" onClick={clearCompleted}>
              Clear Completed
            </button>
          )}
        </div>

        <ul className="todo-list">
          {filteredTodos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>{filter === 'all' ? 'No tasks yet. Start your flow!' : `No ${filter} tasks found.`}</p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <div className="todo-content" onClick={() => toggleTodo(todo.id)}>
                  <div className="checkbox">
                    {todo.completed && <span className="checkmark">✓</span>}
                  </div>
                  <span className="todo-text">{todo.text}</span>
                </div>
                <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </li>
            ))
          )}
        </ul>
        
        <footer className="app-footer">
          <span>{todos.filter(t => !t.completed).length} items left</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
