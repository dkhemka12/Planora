import React from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

const DayCard = ({ dayPlan }) => {
  const { day, topic, duration, tasks = [] } = dayPlan;

  const formatDuration = (mins) => {
    if (!mins) return '';
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `${hrs}h ${rem}m` : `${hrs} hours`;
    }
    return `${mins} mins`;
  };

  return (
    <div className="glass-card interactive" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem',
      borderLeft: '4px solid var(--accent-purple)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-pending" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
            Day {day}
          </span>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{topic}</h4>
        </div>

        {duration && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface)',
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <Clock size={13} color="var(--accent-amber)" />
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {tasks.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          paddingTop: '0.6rem',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {tasks.map((taskItem, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-main)',
              lineHeight: 1.4
            }}>
              <CheckCircle size={15} color="var(--accent-emerald)" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
              <span>{taskItem}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DayCard;
