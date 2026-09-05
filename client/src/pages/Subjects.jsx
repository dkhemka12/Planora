import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, AlertCircle, Loader2 } from 'lucide-react';
import SubjectCard from '../components/SubjectCard';
import SubjectForm from '../components/SubjectForm';
import { subjectAPI, taskAPI } from '../services/api';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [subsRes, tsksRes] = await Promise.all([
        subjectAPI.getAll().catch(() => ({ data: [] })),
        taskAPI.getAll().catch(() => ({ data: [] })),
      ]);

      const subsList = Array.isArray(subsRes) ? subsRes : (subsRes?.data || []);
      const tsksList = Array.isArray(tsksRes) ? tsksRes : (tsksRes?.data || []);

      setSubjects(subsList);
      setTasks(tsksList);
    } catch (err) {
      setError(err.message || 'Failed to fetch subjects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setIsSubmitting(true);
      setError('');
      if (editingSubject) {
        const res = await subjectAPI.update(editingSubject.id, formData);
        const updated = res?.data || res;
        setSubjects((prev) => prev.map((s) => (s.id === editingSubject.id ? updated : s)));
        setSuccessMsg(`Subject "${updated.name}" updated successfully!`);
      } else {
        const res = await subjectAPI.create(formData);
        const created = res?.data || res;
        setSubjects((prev) => [...prev, created]);
        setSuccessMsg(`Subject "${created.name}" created successfully!`);
      }
      setShowForm(false);
      setEditingSubject(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await subjectAPI.delete(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      setSuccessMsg('Subject deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete subject');
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Subjects Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Organize your curriculum and link tasks to specific courses.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => { setEditingSubject(null); setShowForm(true); }}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Add New Subject</span>
          </button>
        )}
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-rose-bg)',
          color: 'var(--accent-rose)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-emerald-bg)',
          color: 'var(--accent-emerald)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
        }}>
          {successMsg}
        </div>
      )}

      {showForm && (
        <SubjectForm
          initialData={editingSubject}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setShowForm(false); setEditingSubject(null); }}
          isLoading={isSubmitting}
        />
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
          <p>Loading subjects...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <BookOpen size={40} color="var(--primary-light)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No subjects added yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Add your course subjects to start tracking tasks and generating study plans.
          </p>
          <button
            onClick={() => { setEditingSubject(null); setShowForm(true); }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>Create Your First Subject</span>
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {subjects.map((sub) => {
            const taskCount = tasks.filter((t) => String(t.subjectId) === String(sub.id)).length;
            return (
              <SubjectCard
                key={sub.id}
                subject={sub}
                taskCount={taskCount}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Subjects;
