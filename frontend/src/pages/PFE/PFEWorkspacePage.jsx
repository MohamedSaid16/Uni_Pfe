/*
  Intent: Unified PFE management workspace with role-based access control.
          - Admins: Validation queue with approve/reject controls + config management
          - Teachers: Subject creation form + their proposals dashboard
          - Students: Subject gallery with single-selection constraint
  Access: Teacher / Admin / Student with role-based UI adaptation.
  Palette: canvas base, surface cards. Semantic colors for status.
  Depth: shadow-card + border-edge on cards.
  Typography: Inter. Section headings = text-base font-semibold. Body = text-sm.
  Spacing: 4px base. Cards p-6. gap-6 between sections.
*/

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Users,
  CalendarDays,
  CheckCircle2,
  X,
  Clock3,
  Pencil,
  Plus,
  Settings,
} from 'lucide-react';
import request from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import PfeConfigView from './PfeConfigView';

/* ── Inline SVG Icons (stroke 1.5) ─────────────────────────── */

const icons = {
  book: (p) => <BookOpen {...p} />,
  users: (p) => <Users {...p} />,
  calendar: (p) => <CalendarDays {...p} />,
  check: (p) => <CheckCircle2 {...p} />,
  x: (p) => <X {...p} />,
  clock: (p) => <Clock3 {...p} />,
  edit: (p) => <Pencil {...p} />,
  plus: (p) => <Plus {...p} />,
  settings: (p) => <Settings {...p} />,
};

/* ── Status Configs ─────────────────────────────────────────── */

const SUBJECT_STATUS_CONFIG = {
  propose: { label: 'Pending', bg: 'bg-warning/50', text: 'text-warning', dot: 'bg-warning', border: 'border-warning/50' },
  valide: { label: 'Validated', bg: 'bg-success/50', text: 'text-success', dot: 'bg-success', border: 'border-success/50' },
  reserve: { label: 'Reserved', bg: 'bg-brand/50', text: 'text-brand', dot: 'bg-brand', border: 'border-brand/50' },
  affecte: { label: 'Assigned', bg: 'bg-surface-200', text: 'text-ink-secondary', dot: 'bg-brand-dark', border: 'border-edge-subtle' },
  termine: { label: 'Completed', bg: 'bg-surface-200', text: 'text-ink-tertiary', dot: 'bg-ink-muted', border: 'border-edge-subtle' },
};

const getUserDisplayName = (user) => {
  if (!user) return 'Unknown';
  const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim();
  return fullName || user.name || user.email || 'Unknown';
};

/* ── Tab Definitions ────────────────────────────────────────── */

const ADMIN_TABS = [
  { id: 'subjects', label: 'Validation Queue', Icon: icons.book },
  { id: 'groups', label: 'Groups', Icon: icons.users },
  { id: 'defense', label: 'Defense Plan', Icon: icons.calendar },
  { id: 'config', label: 'Configuration', Icon: icons.settings },
];

const TEACHER_TABS = [
  { id: 'subjects', label: 'My Subjects', Icon: icons.book },
  { id: 'groups', label: 'Groups', Icon: icons.users },
  { id: 'defense', label: 'Defense Plan', Icon: icons.calendar },
];

const STUDENT_TABS = [
  { id: 'subjects', label: 'Available Subjects', Icon: icons.book },
  { id: 'groups', label: 'My Group', Icon: icons.users },
  { id: 'defense', label: 'Defense Info', Icon: icons.calendar },
];

/* ───────────────────────────────────────────────────────────── 
   ADMIN SUBJECT VALIDATION QUEUE
   ───────────────────────────────────────────────────────────── */

function AdminValidationQueue({ subjects, loading, error, onValidate, onReject }) {
  const allSubjects = Array.isArray(subjects) ? subjects : [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-edge bg-surface p-6 shadow-card">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            Admin Tools
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
            Subjects Oversight
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Review all subjects ({allSubjects.length}) and validate pending proposals
          </p>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-secondary">
          Loading validation queue...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-danger/50 bg-danger/50 p-5 text-sm text-danger">
          {error}
        </div>
      ) : allSubjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-secondary">
          No subjects available
        </div>
      ) : (
        <div className="space-y-4">
          {allSubjects.map((subject) => {
            const config = SUBJECT_STATUS_CONFIG[subject.status] || {
              bg: 'bg-surface',
              text: 'text-ink-secondary',
              dot: 'bg-ink-muted',
              border: 'border-edge-subtle',
            };
            return (
            <div
              key={subject.id}
              className={`rounded-2xl border ${config.border} ${config.bg} p-5 shadow-card`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-ink">
                    {subject.titre_ar || subject.titre_en || `Subject #${subject.id}`}
                  </h3>
                  <p className="mt-1 text-sm text-ink-secondary">
                    {subject.description_ar || subject.description_en || '—'}
                  </p>
                  <div className="mt-3 text-sm text-ink-tertiary">
                    <span className="font-medium text-ink">Teacher:</span> {getUserDisplayName(subject.enseignant?.user)}
                  </div>
                  <div className="mt-1 text-sm text-ink-tertiary">
                    <span className="font-medium text-ink">Status:</span> {subject.status || 'unknown'}
                  </div>
                </div>
                {subject.status === 'propose' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onValidate(subject.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-surface bg-success rounded-lg hover:opacity-90 transition-colors"
                    >
                      <icons.check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(subject.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-surface bg-danger rounded-lg hover:opacity-90 transition-colors"
                    >
                      <icons.x className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── 
   TEACHER SUBJECT CREATION & DASHBOARD
   ───────────────────────────────────────────────────────────── */

function TeacherSubjectsView({ subjects, loading, error, onRefresh, teacherProfileId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titre_ar: '',
    titre_en: '',
    description_ar: '',
    description_en: '',
    typeProjet: 'application',
    maxGrps: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!teacherProfileId) {
      alert('Teacher profile is missing. Please re-login and try again.');
      return;
    }

    setSubmitting(true);
    try {
      await request('/api/v1/pfe/sujets', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          enseignantId: Number(teacherProfileId),
        }),
      });
      setFormData({ titre_ar: '', titre_en: '', description_ar: '', description_en: '', typeProjet: 'application', maxGrps: 1 });
      setShowForm(false);
      console.log('[TeacherSubjectsView] Form submitted, refreshing...');
      onRefresh();
    } catch (err) {
      alert('Failed to create subject: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  console.log('[TeacherSubjectsView] render - subjects count:', subjects.length, 'teacherProfileId:', teacherProfileId);
  const teacherSubjects = subjects;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-edge bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
              Research Topics
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
              My Subjects
            </h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Propose and manage your PFE research topics
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-surface bg-brand rounded-lg hover:bg-brand-hover transition-all duration-150"
          >
            <icons.plus className="w-4 h-4" />
            New Subject
          </button>
        </div>
      </section>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-edge bg-surface p-6 shadow-card space-y-4">
          <h3 className="text-lg font-semibold text-ink">Propose New Subject</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Title (Arabic)</label>
              <input
                type="text"
                value={formData.titre_ar}
                onChange={(e) => handleFormChange('titre_ar', e.target.value)}
                required
                className="w-full rounded-lg border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="العنوان"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Title (English)</label>
              <input
                type="text"
                value={formData.titre_en}
                onChange={(e) => handleFormChange('titre_en', e.target.value)}
                className="w-full rounded-lg border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="Title"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Description (Arabic)</label>
              <textarea
                value={formData.description_ar}
                onChange={(e) => handleFormChange('description_ar', e.target.value)}
                required
                rows="3"
                className="w-full rounded-lg border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="وصف المشروع"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Description (English)</label>
              <textarea
                value={formData.description_en}
                onChange={(e) => handleFormChange('description_en', e.target.value)}
                rows="3"
                className="w-full rounded-lg border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="Project description"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Project Type</label>
              <select
                value={formData.typeProjet}
                onChange={(e) => handleFormChange('typeProjet', e.target.value)}
                className="w-full rounded-lg border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="application">Application</option>
                <option value="research">Research</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Max Groups</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.maxGrps}
                onChange={(e) => handleFormChange('maxGrps', parseInt(e.target.value))}
                className="w-full rounded-lg border border-edge-subtle bg-control-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-ink bg-surface-200 border border-edge-subtle rounded-lg hover:bg-surface-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-surface bg-brand rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Subject'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="rounded-3xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-secondary">
          Loading subjects...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-danger/50 bg-danger/50 p-5 text-sm text-danger">
          {error}
        </div>
      ) : teacherSubjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-secondary">
          No subjects yet. Create one to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-edge bg-surface shadow-card">
          <table className="min-w-full divide-y divide-edge-subtle text-left text-sm">
            <thead className="bg-canvas/90 text-ink-tertiary">
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Groups</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-subtle bg-surface">
              {teacherSubjects.map((subject) => {
                const config = SUBJECT_STATUS_CONFIG[subject.status] || {};
                return (
                  <tr key={subject.id}>
                    <td className="px-5 py-4 text-ink">
                      <div className="font-medium">{subject.titre_ar || subject.titre_en || `Subject #${subject.id}`}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-secondary text-center">
                      {subject.groupsPfe?.length || 0} / {subject.maxGrps}
                    </td>
                    <td className="px-5 py-4">
                      {subject.status === 'propose' && (
                        <button className="inline-flex items-center gap-1 px-2 py-1 text-xs text-brand hover:bg-brand/50 rounded transition-colors">
                          <icons.edit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── 
   STUDENT SUBJECT GALLERY
   ───────────────────────────────────────────────────────────── */

function StudentSubjectGallery({ subjects, loading, error, onSelect, selectedSubjectId }) {
  const validatedSubjects = subjects.filter(s => s.status === 'valide');

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-edge bg-surface p-6 shadow-card">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            Available Topics
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
            Subject Gallery
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Browse and select a research topic for your PFE
          </p>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-secondary">
          Loading subjects...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-danger/50 bg-danger/50 p-5 text-sm text-danger">
          {error}
        </div>
      ) : validatedSubjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-secondary">
          No validated subjects available yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validatedSubjects.map((subject) => {
            const isFull = subject.groupsPfe?.length >= subject.maxGrps;
            const isSelected = selectedSubjectId === subject.id;

            return (
              <div
                key={subject.id}
                className={`rounded-2xl border-2 p-5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brand bg-brand/5 shadow-lg'
                    : 'border-edge bg-surface shadow-card hover:shadow-lg'
                }`}
              >
                <div>
                  <h3 className="text-base font-semibold text-ink">
                    {subject.titre_ar || subject.titre_en || `Subject #${subject.id}`}
                  </h3>
                  <p className="mt-2 text-sm text-ink-secondary">
                    {subject.description_ar || subject.description_en || '—'}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-ink-tertiary">
                      <span className="font-medium text-ink">{subject.groupsPfe?.length || 0}</span>
                      {' '}/ {subject.maxGrps} groups
                    </div>
                    <span className="text-xs font-medium text-ink-secondary">
                      by {getUserDisplayName(subject.enseignant?.user)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onSelect(subject.id, !isSelected)}
                  disabled={isFull && !isSelected}
                  className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-brand text-surface hover:bg-brand-hover'
                      : isFull
                        ? 'bg-surface-200 text-ink-muted cursor-not-allowed'
                        : 'bg-surface-200 text-ink hover:bg-surface-300'
                  }`}
                >
                  {isSelected ? '✓ Selected' : isFull ? 'Full' : 'Select'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GroupsOverview({ groups, loading, error, isAdmin, isTeacher, isStudent }) {
  const title = isAdmin ? 'All Groups' : isTeacher ? 'Groups Choosing My Subjects' : 'My Group';
  const subtitle = isAdmin
    ? 'All PFE groups in the system'
    : isTeacher
      ? 'Groups that selected one of your subjects'
      : 'Your assigned PFE group';

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-edge bg-surface p-6 shadow-card">
        <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
        <p className="mt-1 text-sm text-ink-secondary">{subtitle}</p>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-secondary">
          Loading groups...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-danger/50 bg-danger/50 p-5 text-sm text-danger">
          {error}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-secondary">
          No groups found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => {
            const subject = group.sujetFinal;
            return (
              <div key={group.id} className="rounded-2xl border border-edge bg-surface p-5 shadow-card">
                <h3 className="text-base font-semibold text-ink">{group.nom_ar || group.nom_en || `Group #${group.id}`}</h3>
                <p className="mt-2 text-sm text-ink-secondary">
                  Subject: {subject?.titre_ar || subject?.titre_en || '—'}
                </p>
                <p className="mt-1 text-sm text-ink-tertiary">
                  Teacher: {getUserDisplayName(subject?.enseignant?.user)}
                </p>
                <p className="mt-1 text-xs text-ink-tertiary">
                  Members: {group.groupMembers?.length || 0}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── 
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────── */

export default function PFEWorkspacePage() {
  const { user } = useAuth();
  const userRoles = user?.roles || [];  // Array of role strings
  const isAdmin = userRoles.includes('admin');
  const isTeacher = userRoles.includes('enseignant');
  const isStudent = userRoles.includes('etudiant');
  const teacherProfileId = user?.enseignant?.id;

  const availableTabs = isAdmin ? ADMIN_TABS : isTeacher ? TEACHER_TABS : STUDENT_TABS;

  /* ── State ──────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('subjects');
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  /* ── Data Fetching ──────────────────────────────────────────– */

  const loadSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const endpoint = isStudent
        ? '/api/v1/pfe/sujets?status=valide'
        : isTeacher && teacherProfileId
          ? `/api/v1/pfe/sujets?enseignantId=${teacherProfileId}`
          : '/api/v1/pfe/sujets';
      console.log('[PFE] loadSubjects endpoint:', endpoint, 'teacherProfileId:', teacherProfileId);
      const response = await request(endpoint);
      const data = Array.isArray(response?.data) ? response.data : [];
      console.log('[PFE] loaded subjects count:', data.length, 'subjects:', data);
      setSubjects(data);
    } catch (err) {
      console.error('[PFE] loadSubjects error:', err);
      setError(err?.message || 'Failed to load subjects');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [isStudent, isTeacher, teacherProfileId]);
  const teacherSubjects = subjects;

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await request('/api/v1/pfe/groupes');
      const data = Array.isArray(response?.data) ? response.data : [];
      setGroups(data);
    } catch (err) {
      setError(err?.message || 'Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadJury = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await request('/api/v1/pfe/jury');
      // Handle jury data when needed
    } catch (err) {
      setError(err?.message || 'Failed to load jury');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await request('/api/v1/pfe/config');
      const data = Array.isArray(response?.data) ? response.data : [];
      setConfigs(data);
    } catch (err) {
      setError(err?.message || 'Failed to load configurations');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'subjects') {
      loadSubjects();
    } else if (activeTab === 'groups') {
      loadGroups();
    } else if (activeTab === 'defense') {
      loadJury();
    } else if (activeTab === 'config') {
      loadConfigs();
    }
  }, [activeTab, loadSubjects, loadGroups, loadJury, loadConfigs]);

  /* ── Admin Actions ──────────────────────────────────────────– */

  const handleValidate = async (sujetId) => {
    try {
      await request(`/api/v1/pfe/sujets/${sujetId}/valider`, {
        method: 'PUT',
        body: JSON.stringify({ adminId: user?.id }),
      });
      loadSubjects();
    } catch (err) {
      alert('Failed to validate subject: ' + err.message);
    }
  };

  const handleReject = async (sujetId) => {
    try {
      await request(`/api/v1/pfe/sujets/${sujetId}/refuser`, {
        method: 'PUT',
        body: JSON.stringify({ adminId: user?.id }),
      });
      loadSubjects();
    } catch (err) {
      alert('Failed to reject subject: ' + err.message);
    }
  };

  /* ── Student Actions ────────────────────────────────────────– */

  const handleSelectSubject = async (sujetId, isSelected) => {
    if (isSelected) {
      setSelectedSubjectId(sujetId);
      // TODO: Call backend API to record student selection
    } else {
      setSelectedSubjectId(null);
      // TODO: Call backend API to remove selection
    }
  };

  /* ── Render: Subjects Tab ───────────────────────────────────– */

  const renderSubjectsTab = () => {
    if (isAdmin) {
      return (
        <AdminValidationQueue
          subjects={subjects}
          loading={loading}
          error={error}
          onValidate={handleValidate}
          onReject={handleReject}
        />
      );
    } else if (isTeacher) {
      return (
        <TeacherSubjectsView
          subjects={subjects}
          loading={loading}
          error={error}
          onRefresh={loadSubjects}
          teacherProfileId={teacherProfileId}
        />
      );
    } else {
      return (
        <StudentSubjectGallery
          subjects={subjects}
          loading={loading}
          error={error}
          onSelect={handleSelectSubject}
          selectedSubjectId={selectedSubjectId}
        />
      );
    }
  };

  /* ── Render: Groups Tab ─────────────────────────────────────– */

  const renderGroupsTab = () => (
    <GroupsOverview
      groups={groups}
      loading={loading}
      error={error}
      isAdmin={isAdmin}
      isTeacher={isTeacher}
      isStudent={isStudent}
    />
  );

  /* ── Render: Defense Tab ────────────────────────────────────– */

  const renderDefenseTab = () => (
    <div className="rounded-3xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-secondary">
      Defense planning coming soon...
    </div>
  );

  /* ── Render: Config Tab (Admin Only) ─────────────────────────– */

  const renderConfigTab = () => (
    <PfeConfigView
      configs={configs}
      loading={loading}
      error={error}
      onRefresh={loadConfigs}
    />
  );

  /* ── Main Render ────────────────────────────────────────────– */

  return (
    <div className="space-y-6 max-w-7xl min-w-0">
      {/* Tab Navigation */}
      <div className="rounded-3xl border border-edge bg-surface shadow-card overflow-hidden">
        <div className="flex gap-0 border-b border-edge-subtle bg-surface-200/70">
          {availableTabs.map((tab) => {
            const Icon = tab.Icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all duration-200 border-b-2 ${
                  isActive
                    ? 'border-b-brand text-brand bg-brand-light'
                    : 'border-b-transparent text-ink-secondary hover:text-ink hover:bg-surface-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'subjects' && renderSubjectsTab()}
          {activeTab === 'groups' && renderGroupsTab()}
          {activeTab === 'defense' && renderDefenseTab()}
          {activeTab === 'config' && renderConfigTab()}
        </div>
      </div>
    </div>
  );
}
