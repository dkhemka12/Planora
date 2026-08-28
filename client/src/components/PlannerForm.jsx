import React, { useState } from 'react';
import { Sparkles, Bot, AlertCircle } from 'lucide-react';

const PlannerForm = ({ onGenerate, isLoading = false, subjects = [] }) => {
  const [formData, setFormData] = useState({
    subject: '',
    days: 7,
    hoursPerDay: 2,
    knowledgeLevel: 'Beginner',
    weakTopics: '',
    examDate: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      setError('Please provide or select a subject name');
      return;
    }
    if (formData.days < 1 || formData.days > 30) {
      setError('Days must be between 1 and 30');
      return;
    }
    if (formData.hoursPerDay < 0.5 || formData.hoursPerDay > 16) {
      setError('Hours per day must be between 0.5 and 16');
      return;
    }

    setError('');
    onGenerate({
      ...formData,
      days: Number(formData.days),
      hoursPerDay: Number(formData.hoursPerDay),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--primary-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 0 12px var(--primary-glow)'
        }}>
          <Bot size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Study Plan Generator</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Tell us your target goals and our AI will build a personalized daily roadmap.
          </p>
        </div>
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
          marginBottom: '1.25rem',
          fontSize: '0.875rem'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="planner-subject">Subject *</label>
          <input
            id="planner-subject"
            name="subject"
            type="text"
            list="subject-suggestions"
            className="form-input"
            placeholder="e.g. Operating Systems"
            value={formData.subject}
            onChange={handleChange}
            disabled={isLoading}
          />
          <datalist id="subject-suggestions">
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.name} />
            ))}
          </datalist>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="planner-level">Current Level</label>
          <select
            id="planner-level"
            name="knowledgeLevel"
            className="form-select"
            value={formData.knowledgeLevel}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="Beginner">Beginner (Starting fresh)</option>
            <option value="Intermediate">Intermediate (Have basics)</option>
            <option value="Advanced">Advanced (Revision & mastery)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="planner-days">Number of Days (1-30)</label>
          <input
            id="planner-days"
            name="days"
            type="number"
            min="1"
            max="30"
            className="form-input"
            value={formData.days}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="planner-hours">Hours per Day (0.5 - 16)</label>
          <input
            id="planner-hours"
            name="hoursPerDay"
            type="number"
            step="0.5"
            min="0.5"
            max="16"
            className="form-input"
            value={formData.hoursPerDay}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="planner-weak">Weak Topics / Focus Areas (Optional)</label>
        <input
          id="planner-weak"
          name="weakTopics"
          type="text"
          className="form-input"
          placeholder="e.g. Deadlocks, Virtual Memory, Paging"
          value={formData.weakTopics}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          <Sparkles size={16} />
          <span>{isLoading ? 'Generating AI Study Plan...' : 'Generate Study Plan'}</span>
        </button>
      </div>
    </form>
  );
};

export default PlannerForm;
