import React from 'react';
import { BookOpen, Edit3, Trash2, Calendar } from 'lucide-react';

const SubjectCard = ({ subject, taskCount = 0, onEdit, onDelete }) => {
  const formattedDate = subject.created_at
    ? new Date(subject.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="glass-card interactive" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '1rem',
      height: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-gradient-subtle)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-light)'
          }}>
            <BookOpen size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{subject.name}</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {onEdit && (
            <button
              onClick={() => onEdit(subject)}
              className="btn btn-secondary btn-icon btn-sm"
              title="Edit Subject"
            >
              <Edit3 size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(subject.id)}
              className="btn btn-danger btn-icon btn-sm"
              title="Delete Subject"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {formattedDate && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <Calendar size={12} />
          <span>Added {formattedDate}</span>
        </div>
      )}
    </div>
  );
};

export default SubjectCard;
