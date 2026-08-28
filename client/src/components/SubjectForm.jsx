import React, { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';

const SubjectForm = ({ initialData = null, onSubmit, onCancel, isLoading = false }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
    } else {
      setName('');
    }
    setError('');
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Subject name is required');
      return;
    }
    setError('');
    onSubmit({ name: name.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>
        {initialData ? 'Edit Subject' : 'Add New Subject'}
      </h3>

      <div className="form-group">
        <label className="form-label" htmlFor="subject-name">Subject Name</label>
        <input
          id="subject-name"
          type="text"
          className="form-input"
          placeholder="e.g. Data Structures & Algorithms, Physics, World History"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
        {error && <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{error}</span>}
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
          <span>{isLoading ? 'Saving...' : initialData ? 'Update Subject' : 'Create Subject'}</span>
        </button>
      </div>
    </form>
  );
};

export default SubjectForm;
