import React, { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import request from '../../services/api';

const icons = {
  plus: (p) => <Plus {...p} />,
  trash: (p) => <Trash2 {...p} />,
  edit: (p) => <Edit2 {...p} />,
  check: (p) => <CheckCircle2 {...p} />,
  alert: (p) => <AlertCircle {...p} />,
};

/**
 * PfeConfigView — Admin-only configuration management component
 *
 * Displays and allows CRUD operations on PFE system configurations.
 * Fields map directly to PfeConfig schema:
 * - nom_config: Configuration name (unique, VarChar(100))
 * - valeur: Configuration value (VarChar(50))
 * - description_ar: Arabic description (Text, optional)
 * - description_en: English description (Text, optional)
 * - anneeUniversitaire: Academic year (VarChar(20))
 * - createdBy: Creator user ID (Int, optional)
 * - createdAt/updatedAt: Timestamps
 */
export default function PfeConfigView({ configs = [], loading, error, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nom_config: '',
    valeur: '',
    description_ar: '',
    description_en: '',
    anneeUniversitaire: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Get current academic year for default
  const getCurrentAcademicYear = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startYear = month >= 9 ? year : year - 1;
    return `${startYear}/${startYear + 1}`;
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      nom_config: '',
      valeur: '',
      description_ar: '',
      description_en: '',
      anneeUniversitaire: getCurrentAcademicYear(),
    });
    setEditingId(null);
    setFormError('');
    setShowForm(false);
  }, [getCurrentAcademicYear]);

  // Initialize form for new entry
  const handleAddNew = useCallback(() => {
    setFormData({
      nom_config: '',
      valeur: '',
      description_ar: '',
      description_en: '',
      anneeUniversitaire: getCurrentAcademicYear(),
    });
    setEditingId(null);
    setFormError('');
    setShowForm(true);
  }, [getCurrentAcademicYear]);

  // Initialize form for editing
  const handleEdit = useCallback((config) => {
    setFormData({
      nom_config: config.nom_config || '',
      valeur: config.valeur || '',
      description_ar: config.description_ar || '',
      description_en: config.description_en || '',
      anneeUniversitaire: config.anneeUniversitaire || '',
    });
    setEditingId(config.id);
    setFormError('');
    setShowForm(true);
  }, []);

  // Handle form submission (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    // Validation
    if (!formData.nom_config?.trim()) {
      setFormError('Configuration name is required');
      return;
    }
    if (!formData.valeur?.trim()) {
      setFormError('Configuration value is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update existing configuration
        await request(`/api/v1/pfe/config/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            valeur: formData.valeur.trim(),
            description_ar: formData.description_ar?.trim() || null,
            description_en: formData.description_en?.trim() || null,
          }),
        });
        setSuccessMessage('Configuration updated successfully');
      } else {
        // Create new configuration
        await request('/api/v1/pfe/config', {
          method: 'POST',
          body: JSON.stringify({
            nom_config: formData.nom_config.trim(),
            valeur: formData.valeur.trim(),
            description_ar: formData.description_ar?.trim() || null,
            description_en: formData.description_en?.trim() || null,
            anneeUniversitaire: formData.anneeUniversitaire?.trim() || getCurrentAcademicYear(),
          }),
        });
        setSuccessMessage('Configuration created successfully');
      }

      resetForm();
      onRefresh();
    } catch (err) {
      setFormError(err?.message || 'Failed to save configuration');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (configId, configName) => {
    if (!window.confirm(`Are you sure you want to delete "${configName}"?`)) {
      return;
    }

    try {
      await request(`/api/v1/pfe/config/${configId}`, {
        method: 'DELETE',
      });
      setSuccessMessage('Configuration deleted successfully');
      onRefresh();
    } catch (err) {
      alert('Failed to delete configuration: ' + err.message);
    }
  };

  const allConfigs = Array.isArray(configs) ? configs : [];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <section className="rounded-3xl border border-edge bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
              System Configuration
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
              PFE Configuration
            </h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Manage PFE system settings and configuration parameters ({allConfigs.length} items)
            </p>
          </div>
          <button
            onClick={handleAddNew}
            disabled={showForm}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-surface font-medium text-sm transition-all hover:bg-brand-hover disabled:bg-surface-200 disabled:text-ink-muted"
          >
            <icons.plus className="w-4 h-4" />
            Add Configuration
          </button>
        </div>
      </section>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-2xl border border-success/50 bg-success/10 p-4 text-sm text-success flex items-start gap-3">
          <icons.check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{successMessage}</div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-danger/50 bg-danger/10 p-4 text-sm text-danger flex items-start gap-3">
          <icons.alert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <section className="rounded-3xl border border-edge bg-surface p-6 shadow-card">
          <h3 className="text-lg font-semibold text-ink mb-4">
            {editingId ? 'Edit Configuration' : 'New Configuration'}
          </h3>

          {formError && (
            <div className="rounded-lg border border-danger/50 bg-danger/10 p-3 mb-4 text-sm text-danger">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Configuration Name */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Configuration Name *
              </label>
              <input
                type="text"
                disabled={editingId} // Don't allow editing the unique name
                value={formData.nom_config}
                onChange={(e) => setFormData({ ...formData, nom_config: e.target.value })}
                placeholder="e.g., max_groups_per_project"
                className="w-full px-3 py-2 rounded-lg border border-edge bg-surface-200 text-ink placeholder-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-surface-100 disabled:text-ink-muted"
              />
              <p className="mt-1 text-xs text-ink-tertiary">Unique identifier for this configuration</p>
            </div>

            {/* Configuration Value */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Configuration Value *
              </label>
              <input
                type="text"
                value={formData.valeur}
                onChange={(e) => setFormData({ ...formData, valeur: e.target.value.substring(0, 50) })}
                placeholder="e.g., 3"
                maxLength={50}
                className="w-full px-3 py-2 rounded-lg border border-edge bg-surface-200 text-ink placeholder-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <p className="mt-1 text-xs text-ink-tertiary">Maximum 50 characters</p>
            </div>

            {/* Description (Arabic) */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Description (Arabic)
              </label>
              <textarea
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                placeholder="Optional Arabic description..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-edge bg-surface-200 text-ink placeholder-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-vertical"
              />
            </div>

            {/* Description (English) */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Description (English)
              </label>
              <textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder="Optional English description..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-edge bg-surface-200 text-ink placeholder-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-vertical"
              />
            </div>

            {/* Academic Year */}
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={formData.anneeUniversitaire}
                  onChange={(e) => setFormData({ ...formData, anneeUniversitaire: e.target.value })}
                  placeholder={getCurrentAcademicYear()}
                  className="w-full px-3 py-2 rounded-lg border border-edge bg-surface-200 text-ink placeholder-ink-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <p className="mt-1 text-xs text-ink-tertiary">Format: 2025/2026</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-edge-subtle">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border border-edge text-ink font-medium text-sm transition-all hover:bg-surface-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-brand text-surface font-medium text-sm transition-all hover:bg-brand-hover disabled:bg-surface-200 disabled:text-ink-muted"
              >
                {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Configurations List */}
      {loading ? (
        <div className="rounded-3xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-secondary">
          Loading configurations...
        </div>
      ) : allConfigs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-edge bg-surface p-8 text-center text-sm text-ink-secondary">
          <p className="mb-3">No configurations found</p>
          <button
            onClick={handleAddNew}
            className="text-brand font-medium hover:underline text-sm"
          >
            Create the first configuration
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {allConfigs.map((config) => (
            <div
              key={config.id}
              className="rounded-2xl border border-edge bg-surface p-4 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-ink truncate">
                    {config.nom_config}
                  </h3>
                  <p className="mt-1 text-sm text-ink-secondary">
                    <span className="font-mono bg-surface-200 px-2 py-1 rounded text-xs">
                      {config.valeur}
                    </span>
                  </p>
                  {(config.description_ar || config.description_en) && (
                    <p className="mt-2 text-sm text-ink-tertiary">
                      {config.description_ar || config.description_en}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-muted">
                    <span>Year: {config.anneeUniversitaire}</span>
                    {config.createdAt && (
                      <span>
                        Created: {new Date(config.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(config)}
                    disabled={showForm}
                    className="p-2 rounded-lg border border-edge text-ink-secondary hover:text-ink hover:bg-surface-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Edit configuration"
                  >
                    <icons.edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(config.id, config.nom_config)}
                    className="p-2 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-all"
                    title="Delete configuration"
                  >
                    <icons.trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
