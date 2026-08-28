import React from 'react';
import TaskCard from './TaskCard';
import { CheckSquare } from 'lucide-react';

const TaskList = ({ tasks = [], subjects = [], onToggleStatus, onEdit, onDelete, emptyMessage = 'No tasks found' }) => {
  if (tasks.length === 0) {
    return (
      <div className="glass-card" style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        }}>
          <CheckSquare size={24} />
        </div>
        <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          subjects={subjects}
          onToggleStatus={onToggleStatus}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default TaskList;
