import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Bookmark,
  HelpCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Send,
  ArrowRight,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import PlannerForm from '../components/PlannerForm';
import DayCard from '../components/DayCard';
import { aiAPI, studyPlanAPI, subjectAPI } from '../services/api';

const QUICK_TOPICS = [
  'Dijkstra\'s Shortest Path Algorithm',
  'Dynamic Programming Memoization',
  'Deadlocks and Banker\'s Algorithm',
  'TCP 3-Way Handshake',
  'Database Normalization (1NF to BCNF)',
];

const AIPlanner = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' or 'explainer'
  const [subjects, setSubjects] = useState([]);

  // Study Planner State
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [planSource, setPlanSource] = useState('llm');
  const [currentPlanInput, setCurrentPlanInput] = useState(null);
  const [planSuccessMsg, setPlanSuccessMsg] = useState('');
  const [planError, setPlanError] = useState('');

  // Concept Explainer State
  const [conceptTopic, setConceptTopic] = useState('');
  const [conceptDifficulty, setConceptDifficulty] = useState('Beginner');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationData, setExplanationData] = useState(null);
  const [explainerError, setExplainerError] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    subjectAPI
      .getAll()
      .then((subs) => {
        const list = Array.isArray(subs) ? subs : (subs?.data || []);
        setSubjects(list);
      })
      .catch(() => setSubjects([]));
  }, []);

  // Handle Study Plan Generation
  const handleGeneratePlan = async (formData) => {
    try {
      setIsGeneratingPlan(true);
      setPlanError('');
      setPlanSuccessMsg('');
      setCurrentPlanInput(formData);

      const response = await aiAPI.generatePlan(formData);
      const planItems = Array.isArray(response.plan)
        ? response.plan
        : Array.isArray(response)
        ? response
        : (response.data?.plan || []);

      setGeneratedPlan(planItems);
      setPlanSource(response.source || 'llm');
    } catch (err) {
      setPlanError(err.message || 'Failed to generate study plan from AI');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Handle Saving Generated Plan
  const handleSavePlan = async () => {
    if (!generatedPlan || !currentPlanInput) return;
    try {
      setIsSavingPlan(true);
      setPlanError('');
      await studyPlanAPI.create({
        subject: currentPlanInput.subject,
        days: currentPlanInput.days,
        plan: generatedPlan,
      });
      setPlanSuccessMsg('Study plan successfully saved to your library!');
    } catch (err) {
      setPlanError(err.message || 'Failed to save study plan');
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Handle Concept Explanation
  const handleExplainConcept = async (e, customTopic = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const topicToExplain = (customTopic || conceptTopic).trim();

    if (!topicToExplain) {
      setExplainerError('Please enter a concept or topic to explain');
      return;
    }

    try {
      setIsExplaining(true);
      setExplainerError('');
      setExplanationData(null);
      setHasCopied(false);

      const response = await aiAPI.explainConcept({
        topic: topicToExplain,
        difficulty: conceptDifficulty.toLowerCase(),
      });

      setExplanationData({
        topic: response.topic || topicToExplain,
        difficulty: response.difficulty || conceptDifficulty,
        explanation: response.explanation || response.result || 'No explanation generated',
        keyTakeaways: Array.isArray(response.keyTakeaways) ? response.keyTakeaways : [],
        source: response.source || 'llm',
      });
    } catch (err) {
      setExplainerError(err.message || 'Failed to get concept explanation');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleCopyExplanation = () => {
    if (!explanationData) return;
    const textToCopy = `Concept: ${explanationData.topic} (${explanationData.difficulty})\n\nExplanation:\n${explanationData.explanation}\n\nKey Takeaways:\n${explanationData.keyTakeaways.map((t) => `• ${t}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-gradient-subtle)',
            color: 'var(--primary-light)',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <Sparkles size={13} /> Powered by Google Gemini AI
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>AI Study Copilot</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Generate custom study roadmaps or ask for simple, intuitive explanations of complex topics.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem',
        }}
      >
        <button
          onClick={() => setActiveTab('planner')}
          className={`btn ${activeTab === 'planner' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <Bot size={15} />
          <span>Study Plan Generator</span>
        </button>
        <button
          onClick={() => setActiveTab('explainer')}
          className={`btn ${activeTab === 'explainer' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <HelpCircle size={15} />
          <span>Concept Explainer</span>
        </button>
      </div>

      {/* TAB 1: STUDY PLAN GENERATOR */}
      {activeTab === 'planner' && (
        <div>
          <PlannerForm onGenerate={handleGeneratePlan} isLoading={isGeneratingPlan} subjects={subjects} />

          {planError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-rose-bg)',
                color: 'var(--accent-rose)',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{planError}</span>
            </div>
          )}

          {planSuccessMsg && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1.2rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-emerald-bg)',
                color: 'var(--accent-emerald)',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <span>{planSuccessMsg}</span>
              </div>
              <button
                onClick={() => navigate('/study-plans')}
                className="btn btn-secondary btn-sm"
                style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: 'var(--accent-emerald)', color: '#fff' }}
              >
                <span>View Saved Plans</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {isGeneratingPlan && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 2rem', color: 'var(--text-secondary)' }}>
              <Loader2 className="animate-spin" size={36} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Analyzing curriculum and formulating roadmap...
              </h3>
              <p style={{ fontSize: '0.85rem' }}>
                Our AI is structuring your time, distributing topics, and setting daily milestones.
              </p>
            </div>
          )}

          {generatedPlan && !isGeneratingPlan && (
            <div style={{ marginTop: '2rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: planSource === 'llm' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: planSource === 'llm' ? 'var(--primary-light)' : 'var(--accent-amber)',
                        fontWeight: 600,
                      }}
                    >
                      {planSource === 'llm' ? '✨ Gemini AI Generated' : '⚡ Smart Template'}
                    </span>
                    {currentPlanInput?.knowledgeLevel && (
                      <span className="badge badge-pending" style={{ fontSize: '0.75rem' }}>
                        {currentPlanInput.knowledgeLevel}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                    Study Plan: {currentPlanInput?.subject}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {generatedPlan.length} Day Schedule • {currentPlanInput?.hoursPerDay} hours/day
                    {currentPlanInput?.weakTopics ? ` • Focus: ${currentPlanInput.weakTopics}` : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleSavePlan}
                    className="btn btn-primary btn-sm"
                    disabled={isSavingPlan}
                  >
                    <Bookmark size={15} />
                    <span>{isSavingPlan ? 'Saving Plan...' : 'Save Plan to Library'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {generatedPlan.map((dayItem, idx) => (
                  <DayCard key={idx} dayPlan={dayItem} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONCEPT EXPLAINER */}
      {activeTab === 'explainer' && (
        <div>
          <form onSubmit={handleExplainConcept} className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-purple-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-purple)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                }}
              >
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Concept Explainer</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Stuck on a tricky topic? Get a clear, intuitive breakdown tailored to your level.
                </p>
              </div>
            </div>

            {explainerError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-rose-bg)',
                  color: 'var(--accent-rose)',
                  marginBottom: '1.25rem',
                  fontSize: '0.875rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{explainerError}</span>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1rem',
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="topic-input">Concept or Topic *</label>
                <input
                  id="topic-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dijkstra's Algorithm, Backpropagation, Paging"
                  value={conceptTopic}
                  onChange={(e) => setConceptTopic(e.target.value)}
                  disabled={isExplaining}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="diff-select">Target Explanation Depth</label>
                <select
                  id="diff-select"
                  className="form-select"
                  value={conceptDifficulty}
                  onChange={(e) => setConceptDifficulty(e.target.value)}
                  disabled={isExplaining}
                >
                  <option value="Beginner">Simple / ELI5 (Beginner-friendly analogies)</option>
                  <option value="Intermediate">Conceptual & Technical (Standard college level)</option>
                  <option value="Advanced">In-depth & Rigorous (Advanced mastery & edge cases)</option>
                </select>
              </div>
            </div>

            {/* Quick sample chips */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                Try popular topics:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {QUICK_TOPICS.map((topic, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setConceptTopic(topic);
                      handleExplainConcept(null, topic);
                    }}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={isExplaining}>
                <Send size={15} />
                <span>{isExplaining ? 'Explaining Concept...' : 'Explain Topic'}</span>
              </button>
            </div>
          </form>

          {isExplaining && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 2rem', color: 'var(--text-secondary)' }}>
              <Loader2 className="animate-spin" size={36} color="var(--accent-purple)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Analyzing concept and breaking it down...
              </h3>
              <p style={{ fontSize: '0.85rem' }}>Crafting structured explanation with intuitive analogies and key takeaways.</p>
            </div>
          )}

          {explanationData && !isExplaining && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <BookOpen size={20} color="var(--accent-cyan)" />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                      {explanationData.topic}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span className="badge badge-pending" style={{ fontSize: '0.75rem' }}>
                        {explanationData.difficulty}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {explanationData.source === 'llm' ? '✨ Gemini Explainer' : '⚡ Concept Tutor'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyExplanation}
                  className="btn btn-secondary btn-sm"
                  title="Copy full explanation"
                >
                  {hasCopied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  <span>{hasCopied ? 'Copied to Clipboard!' : 'Copy Explanation'}</span>
                </button>
              </div>

              {/* Narrative explanation */}
              <div
                style={{
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  background: 'var(--bg-input)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.25rem',
                }}
              >
                {explanationData.explanation}
              </div>

              {/* Key Takeaways */}
              {explanationData.keyTakeaways && explanationData.keyTakeaways.length > 0 && (
                <div>
                  <h4
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      marginBottom: '0.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    <Zap size={15} /> Key Takeaways
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {explanationData.keyTakeaways.map((takeaway, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.6rem',
                          padding: '0.6rem 0.85rem',
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.875rem',
                        }}
                      >
                        <CheckCircle2
                          size={16}
                          color="var(--accent-emerald)"
                          style={{ marginTop: '0.15rem', flexShrink: 0 }}
                        />
                        <span style={{ color: 'var(--text-main)' }}>{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIPlanner;
