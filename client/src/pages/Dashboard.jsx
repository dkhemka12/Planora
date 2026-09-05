import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckSquare,
  Clock,
  CheckCircle2,
  Sparkles,
  Plus,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import ProgressCard from '../components/ProgressCard';
import TaskList from '../components/TaskList';
import { subjectAPI, taskAPI, getUser } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getUser();

  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [subjectsRes, tasksRes] = await Promise.all([
        subjectAPI.getAll().catch(() => ({ data: [] })),
        taskAPI.getAll().catch(() => ({ data: [] })),
      ]);

      const subjectsList = Array.isArray(subjectsRes) ? subjectsRes : (subjectsRes?.data || []);
      const tasksList = Array.isArray(tasksRes) ? tasksRes : (tasksRes?.data || []);

      setSubjects(subjectsList);
      setTasks(tasksList);
    } catch (err) {
      setError('Unable to load dashboard data. Please make sure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t))
    );

    try {
      const res = await taskAPI.update(task._id, { status: nextStatus });
      const updated = res?.data || res;
      setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)));
    } catch (err) {
      // Rollback on error
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: task.status } : t))
      );
      setError('Failed to update task status');
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          marginBottom: '2rem',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.3)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}
          >
            <Sparkles size={13} /> AI Study Copilot
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '600px' }}>
            Track your study workload, conquer weak topics, and let AI build your optimal study plan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/ai-planner')} className="btn btn-primary">
            <Sparkles size={16} />
            <span>Generate Study Plan</span>
          </button>
          <button onClick={() => navigate('/tasks')} className="btn btn-secondary">
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-rose-bg)',
            color: 'var(--accent-rose)',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          title="Total Subjects"
          value={subjects.length}
          subtitle="Enrolled subjects"
          icon={BookOpen}
          color="primary"
        />
        <StatsCard
          title="Total Tasks"
          value={tasks.length}
          subtitle="Across all subjects"
          icon={CheckSquare}
          color="cyan"
        />
        <StatsCard
          title="Completed"
          value={completedCount}
          subtitle="Finished study tasks"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Pending"
          value={pendingCount}
          subtitle="Tasks to do"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Progress & Recent Tasks Split */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <ProgressCard completed={completedCount} total={tasks.length} />

          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => navigate('/subjects')}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <BookOpen size={16} color="var(--primary-light)" />
                  <span>Manage Subjects ({subjects.length})</span>
                </div>
                <ArrowRight size={15} />
              </button>

              <button
                onClick={() => navigate('/ai-planner')}
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Sparkles size={16} color="var(--accent-purple)" />
                  <span>Ask AI Concept Explainer</span>
                </div>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Tasks</h3>
            <button onClick={() => navigate('/tasks')} className="btn btn-outline btn-sm">
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.875rem' }}>Loading recent tasks...</p>
            </div>
          ) : (
            <TaskList
              tasks={recentTasks}
              subjects={subjects}
              onToggleStatus={handleToggleTaskStatus}
              emptyMessage="No tasks created yet. Click 'Add Task' to get started!"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
