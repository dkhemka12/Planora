import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, Loader2, Search } from 'lucide-react';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import { taskAPI, subjectAPI } from '../services/api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [tasksRes, subjectsRes] = await Promise.all([
        taskAPI.getAll().catch(() => ({ data: [] })),
        subjectAPI.getAll().catch(() => ({ data: [] })),
      ]);

      const tasksList = Array.isArray(tasksRes) ? tasksRes : (tasksRes?.data || []);
      const subjectsList = Array.isArray(subjectsRes) ? subjectsRes : (subjectsRes?.data || []);

      setTasks(tasksList);
      setSubjects(subjectsList);
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks');
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
      if (editingTask) {
        const res = await taskAPI.update(editingTask._id, formData);
        const updated = res?.data || res;
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? updated : t)));
        setSuccessMsg(`Task "${updated.title}" updated successfully!`);
      } else {
        const res = await taskAPI.create(formData);
        const created = res?.data || res;
        setTasks((prev) => [created, ...prev]);
        setSuccessMsg(`Task "${created.title}" created successfully!`);
      }
      setShowForm(false);
      setEditingTask(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t))
    );

    try {
      const res = await taskAPI.update(task._id, { status: nextStatus });
      const updated = res?.data || res;
      setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)));
    } catch (err) {
      // Rollback on error
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: task.status } : t))
      );
      setError('Failed to update task status');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskAPI.delete(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      setSuccessMsg('Task deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete task');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSubject = !subjectFilter || String(task.subjectId) === String(subjectFilter);
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSubject && matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Study Tasks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage daily goals, set priorities, and track task completion.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => { setEditingTask(null); setShowForm(true); }}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Create Task</span>
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
        <TaskForm
          initialData={editingTask}
          subjects={subjects}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => { setShowForm(false); setEditingTask(null); }}
          isLoading={isSubmitting}
        />
      )}

      {/* Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="completed">Completed Only</option>
          </select>

          <select
            className="form-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
          <p>Loading tasks...</p>
        </div>
      ) : (
        <TaskList
          tasks={filteredTasks}
          subjects={subjects}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage={tasks.length === 0 ? 'No study tasks yet. Click "Create Task" to add one!' : 'No tasks match the active filters.'}
        />
      )}
    </div>
  );
};

export default Tasks;
