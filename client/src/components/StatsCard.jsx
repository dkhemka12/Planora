import React from 'react';

const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'primary' }) => {
  const colorMap = {
    primary: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' },
    emerald: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
    amber: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
    cyan: { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' },
    rose: { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.3)' },
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <div className="glass-card interactive" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      {Icon && (
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: 'var(--radius-md)',
          background: scheme.bg,
          border: `1px solid ${scheme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: scheme.text,
          flexShrink: 0
        }}>
          <Icon size={26} />
        </div>
      )}
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>{value}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{subtitle}</div>}
      </div>
    </div>
  );
};

export default StatsCard;
