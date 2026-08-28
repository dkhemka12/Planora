import React from 'react';
import { Target } from 'lucide-react';

const ProgressCard = ({ completed = 0, total = 0 }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary-gradient-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-light)'
          }}>
            <Target size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Overall Progress</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {completed} of {total} tasks completed
            </span>
          </div>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-light)' }}>
          {percentage}%
        </div>
      </div>

      <div style={{
        width: '100%',
        height: '10px',
        background: 'var(--bg-input)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: 'var(--primary-gradient)',
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }} />
      </div>
    </div>
  );
};

export default ProgressCard;
