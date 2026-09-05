import React, { useState } from 'react';
import { Clock, CheckCircle2, Circle } from 'lucide-react';

const DayCard = ({ dayPlan }) => {
  const { day, topic, duration, tasks = [] } = dayPlan;
  const [completedTasks, setCompletedTasks] = useState({});

  const toggleTask = (idx) => {
    setCompletedTasks((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const formatDuration = (mins) => {
    if (!mins) return '';
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `${hrs}h ${rem}m` : `${hrs} hours`;
    }
    return `${mins} mins`;
  };

  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const isAllCompleted = tasks.length > 0 && completedCount === tasks.length;

  return (
    <div
      className="glass-card interactive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        borderLeft: `4px solid ${isAllCompleted ? 'var(--accent-emerald)' : 'var(--accent-purple)'}`,
        transition: 'border-color 0.2s ease, transform 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            className={`badge ${isAllCompleted ? 'badge-completed' : 'badge-pending'}`}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}
          >
            Day {day}
          </span>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{topic}</h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {tasks.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {completedCount}/{tasks.length} done
            </span>
          )}
          {duration && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-surface)',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Clock size={13} color="var(--accent-amber)" />
              {formatDuration(duration)}
            </span>
          )}
        </div>
      </div>

      {tasks.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            paddingTop: '0.6rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {tasks.map((taskItem, idx) => {
            const isDone = !!completedTasks[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleTask(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  fontSize: '0.875rem',
                  color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  lineHeight: 1.4,
                  cursor: 'pointer',
                  userSelect: 'none',
                  padding: '0.2rem 0',
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={16} color="var(--accent-emerald)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                ) : (
                  <Circle size={16} color="var(--text-muted)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                )}
                <span>{taskItem}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DayCard;
