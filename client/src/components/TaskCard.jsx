import React from 'react';
import { Calendar, CheckCircle2, Circle, Edit3, Trash2, BookOpen } from 'lucide-react';

const TaskCard = ({ task, subjects = [], onToggleStatus, onEdit, onDelete }) => {
  const isCompleted = task.status === 'completed';
  const subject = subjects.find(s => String(s.id) === String(task.subjectId));

  const priorityClass = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high'
  }[task.priority] || 'badge-medium';

  const formattedDate = task.dueDate 
    ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className={`glass-card interactive ${isCompleted ? 'opacity-80' : ''}`} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem',
      position: 'relative',
      borderLeft: isCompleted ? '4px solid var(--accent-emerald)' : '4px solid var(--primary)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
          <button
            onClick={() => onToggleStatus && onToggleStatus(task)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isCompleted ? 'var(--accent-emerald)' : 'var(--text-muted)',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              marginTop: '0.1rem'
            }}
            title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
          >
            {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>
          
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 600,
              textDecoration: isCompleted ? 'line-through' : 'none',
              color: isCompleted ? 'var(--text-muted)' : 'var(--text-main)'
            }}>
              {task.title}
            </h4>
            {task.description && (
              <p style={{
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                marginTop: '0.3rem',
                lineHeight: 1.4
              }}>
                {task.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="btn btn-secondary btn-icon btn-sm"
              title="Edit Task"
            >
              <Edit3 size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(task._id)}
              className="btn btn-danger btn-icon btn-sm"
              title="Delete Task"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.6rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.8rem'
      }}>
        {subject && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
            <BookOpen size={14} color="var(--primary-light)" />
            {subject.name}
          </span>
        )}

        <span className={`badge ${priorityClass}`}>
          {task.priority || 'medium'}
        </span>

        {formattedDate && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            <Calendar size={13} />
            {formattedDate}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
