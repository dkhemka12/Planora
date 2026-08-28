import React, { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';

const TaskForm = ({ initialData = null, subjects = [], onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        subjectId: initialData.subjectId || (subjects[0]?.id ? String(subjects[0].id) : ''),
        priority: initialData.priority || 'medium',
        status: initialData.status || 'pending',
        dueDate: initialData.dueDate ? initialData.dueDate.split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
        priority: 'medium',
        status: 'pending',
        dueDate: '',
      });
    }
    setError('');
  }, [initialData, subjects]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }
    setError('');
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>
        {initialData ? 'Edit Task' : 'Create New Study Task'}
      </h3>

      <div className="form-group">
        <label className="form-label" htmlFor="task-title">Task Title *</label>
        <input
          id="task-title"
          name="title"
          type="text"
          className="form-input"
          placeholder="e.g. Solve Binary Tree Traversal Problems"
          value={formData.title}
          onChange={handleChange}
          disabled={isLoading}
          autoFocus
        />
        {error && <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{error}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="task-desc">Description (Optional)</label>
        <textarea
          id="task-desc"
          name="description"
          className="form-textarea"
          placeholder="Add notes, key concepts, or references..."
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="task-subject">Subject</label>
          <select
            id="task-subject"
            name="subjectId"
            className="form-select"
            value={formData.subjectId}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="">-- Select Subject --</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            name="priority"
            className="form-select"
            value={formData.priority}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="task-due">Due Date</label>
          <input
            id="task-due"
            name="dueDate"
            type="date"
            className="form-input"
            value={formData.dueDate}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary btn-sm"
            disabled={isLoading}
          >
            <X size={15} />
            <span>Cancel</span>
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={isLoading}
        >
          {initialData ? <Check size={15} /> : <Plus size={15} />}
          <span>{isLoading ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}</span>
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
