import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, Calendar, BookOpen, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import DayCard from '../components/DayCard';
import { studyPlanAPI } from '../services/api';

const StudyPlans = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await studyPlanAPI.getAll();
      setPlans(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setExpandedPlanId(data[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load saved study plans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved study plan?')) return;
    try {
      await studyPlanAPI.delete(id);
      setPlans(prev => prev.filter(p => p._id !== id));
      setSuccessMsg('Study plan deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete study plan');
    }
  };

  const toggleExpand = (id) => {
    setExpandedPlanId(prev => (prev === id ? null : id));
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Saved Study Plans</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Access and manage your AI-generated study roadmaps.
        </p>
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
          fontSize: '0.875rem'
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
          fontSize: '0.875rem'
        }}>
          {successMsg}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
          <p>Loading your saved plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <Bookmark size={40} color="var(--primary-light)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No saved plans yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Head over to the AI Planner, generate a custom schedule, and click "Save Plan to Library".
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {plans.map((plan) => {
            const isExpanded = expandedPlanId === plan._id;
            const formattedDate = plan.createdAt
              ? new Date(plan.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              : null;

            return (
              <div key={plan._id} className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--primary-gradient-subtle)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-light)'
                    }}>
                      <BookOpen size={22} />
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{plan.subject}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        <span>{plan.days || plan.plan?.length || 0} Day Roadmap</span>
                        {formattedDate && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                            <Calendar size={12} />
                            {formattedDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => toggleExpand(plan._id)}
                      className="btn btn-secondary btn-sm"
                    >
                      <span>{isExpanded ? 'Hide Schedule' : 'View Schedule'}</span>
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    <button
                      onClick={() => handleDelete(plan._id)}
                      className="btn btn-danger btn-icon btn-sm"
                      title="Delete Saved Plan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && Array.isArray(plan.plan) && (
                  <div style={{
                    marginTop: '1.25rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}>
                    {plan.plan.map((dayItem, idx) => (
                      <DayCard key={idx} dayPlan={dayItem} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudyPlans;
