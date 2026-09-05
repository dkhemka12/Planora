import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Trash2,
  Calendar,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Search,
  Plus,
  Sparkles,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import DayCard from '../components/DayCard';
import { studyPlanAPI } from '../services/api';

const StudyPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPlanId, setCopiedPlanId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await studyPlanAPI.getAll();
      const plansList = Array.isArray(res) ? res : (res?.data || []);
      setPlans(plansList);
      if (plansList.length > 0 && !expandedPlanId) {
        setExpandedPlanId(plansList[0]._id);
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
    try {
      await studyPlanAPI.delete(id);
      setPlans(prev => prev.filter(p => p._id !== id));
      setConfirmDeleteId(null);
      setSuccessMsg('Study plan deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete study plan');
    }
  };

  const toggleExpand = (id) => {
    setExpandedPlanId(prev => (prev === id ? null : id));
  };

  const handleCopyMarkdown = (plan) => {
    let md = `# Study Plan: ${plan.subject}\n`;
    md += `**Total Duration:** ${plan.days || plan.plan?.length || 0} Days\n`;
    if (plan.createdAt) {
      md += `**Created:** ${new Date(plan.createdAt).toLocaleDateString()}\n`;
    }
    md += `\n---\n\n`;

    if (Array.isArray(plan.plan)) {
      plan.plan.forEach((dayItem) => {
        md += `### Day ${dayItem.day}: ${dayItem.topic || 'Focus Topic'} (${dayItem.duration || 60} mins)\n`;
        if (Array.isArray(dayItem.tasks)) {
          dayItem.tasks.forEach((task) => {
            md += `- [ ] ${task}\n`;
          });
        }
        md += `\n`;
      });
    }

    navigator.clipboard.writeText(md);
    setCopiedPlanId(plan._id);
    setTimeout(() => setCopiedPlanId(null), 2500);
  };

  // Filter plans based on search query
  const filteredPlans = plans.filter((plan) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchSubject = plan.subject?.toLowerCase().includes(query);
    const matchTopic = Array.isArray(plan.plan) && plan.plan.some(d => d.topic?.toLowerCase().includes(query));
    return matchSubject || matchTopic;
  });

  // Calculate high-level summary metrics
  const totalDays = plans.reduce((acc, p) => acc + (p.days || p.plan?.length || 0), 0);
  const totalMinutes = plans.reduce((acc, p) => {
    if (!Array.isArray(p.plan)) return acc;
    return acc + p.plan.reduce((dSum, d) => dSum + (Number(d.duration) || 0), 0);
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="page-container">
      {/* Header with Title and Create CTA */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Saved Study Plans</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Access, export, and track your personalized AI-generated roadmaps.
          </p>
        </div>

        <button
          onClick={() => navigate('/ai-planner')}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Sparkles size={16} />
          <span>New AI Plan</span>
        </button>
      </div>

      {/* Quick Stats Banner */}
      {plans.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}>
          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              <Bookmark size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {plans.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Saved Roadmaps
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-cyan-bg)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <Calendar size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {totalDays}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Total Study Days
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-purple-bg)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)'
            }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {totalHours} hrs
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Total Focus Time
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
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
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-emerald-bg)',
          color: 'var(--accent-emerald)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      {plans.length > 0 && (
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <Search size={18} />
          </div>
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '2.75rem', width: '100%' }}
            placeholder="Search saved plans by subject or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={36} style={{ margin: '0 auto 1rem', color: 'var(--primary-light)' }} />
          <p style={{ fontSize: '0.95rem' }}>Loading your study roadmaps...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--primary-gradient-subtle)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--primary-light)'
          }}>
            <Bookmark size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>No saved plans yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            Generate a personalized daily study breakdown with our AI Planner and save it directly to your library.
          </p>
          <button
            onClick={() => navigate('/ai-planner')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Sparkles size={16} />
            <span>Create Your First AI Plan</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Search size={32} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>No matching plans found</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            No plans matched your search for "{searchQuery}".
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="btn btn-secondary btn-sm"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredPlans.map((plan) => {
            const isExpanded = expandedPlanId === plan._id;
            const isConfirmingDelete = confirmDeleteId === plan._id;
            const formattedDate = plan.createdAt
              ? new Date(plan.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              : null;

            // Compute plan total duration
            const planDurationMinutes = Array.isArray(plan.plan)
              ? plan.plan.reduce((sum, day) => sum + (Number(day.duration) || 0), 0)
              : 0;
            const planDurationHours = (planDurationMinutes / 60).toFixed(1);

            return (
              <div
                key={plan._id}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  transition: 'border-color var(--transition-normal)',
                  borderColor: isExpanded ? 'rgba(99, 102, 241, 0.35)' : 'var(--border-subtle)'
                }}
              >
                {/* Plan Card Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--primary-gradient-subtle)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-light)',
                      flexShrink: 0
                    }}>
                      <BookOpen size={22} />
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {plan.subject}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.85rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.35rem'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: 'var(--primary-light)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 600
                        }}>
                          {plan.days || plan.plan?.length || 0} Days
                        </span>

                        {planDurationMinutes > 0 && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: 'var(--text-muted)'
                          }}>
                            <Clock size={13} />
                            {planDurationHours} hrs total
                          </span>
                        )}

                        {formattedDate && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                            <Calendar size={13} />
                            {formattedDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Copy / Export Button */}
                    <button
                      onClick={() => handleCopyMarkdown(plan)}
                      className="btn btn-secondary btn-sm"
                      title="Copy full schedule as Markdown"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {copiedPlanId === plan._id ? (
                        <>
                          <Check size={14} color="var(--accent-emerald)" />
                          <span style={{ color: 'var(--accent-emerald)' }}>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Export</span>
                        </>
                      )}
                    </button>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleExpand(plan._id)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>{isExpanded ? 'Hide Schedule' : 'View Schedule'}</span>
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    {/* Delete / Inline Confirm */}
                    {isConfirmingDelete ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(244, 63, 94, 0.1)',
                        padding: '0.2rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(244, 63, 94, 0.3)'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: 600 }}>
                          Delete?
                        </span>
                        <button
                          onClick={() => handleDelete(plan._id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(plan._id)}
                        className="btn btn-danger btn-icon btn-sm"
                        title="Delete Saved Plan"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Day-by-Day Schedule View */}
                {isExpanded && Array.isArray(plan.plan) && (
                  <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <span style={{ fontWeight: 600 }}>Daily Breakdown & Tasks:</span>
                      <span>{plan.plan.length} days scheduled</span>
                    </div>

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
