import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Settings2 } from 'lucide-react';
import { resolveMediaUrl, siteSettingsAPI } from '../services/api';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

const inputClassName = 'w-full rounded-md border border-control-border bg-control-bg px-3 py-2.5 text-sm text-ink outline-none transition-all duration-150 placeholder:text-ink-muted focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50';
const primaryButtonClassName = 'inline-flex items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-surface transition-all duration-150 hover:bg-brand-hover active:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButtonClassName = 'inline-flex items-center justify-center rounded-md border border-edge bg-surface px-4 py-2.5 text-sm font-medium text-ink-secondary transition-all duration-150 hover:bg-surface-200 active:bg-surface-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const formSections = [
  {
    title: 'University Identity',
    fields: [
      { key: 'universityNameEn', label: 'University Name (EN)' },
      { key: 'universityNameFr', label: 'University Name (FR)' },
      { key: 'universityNameAr', label: 'University Name (AR)' },
      { key: 'universitySubtitleEn', label: 'Subtitle (EN)' },
      { key: 'universitySubtitleFr', label: 'Subtitle (FR)' },
      { key: 'universitySubtitleAr', label: 'Subtitle (AR)' },
      { key: 'cityEn', label: 'City (EN)' },
      { key: 'cityFr', label: 'City (FR)' },
      { key: 'cityAr', label: 'City (AR)' },
      { key: 'logoUrl', label: 'Logo URL (optional override)' },
      { key: 'heroBackgroundUrl', label: 'Hero Background URL (optional override)' },
      { key: 'bannerBackgroundUrl', label: 'Banner Background URL (optional override)' },
    ],
  },
  {
    title: 'Hero and Banner Statistics',
    fields: [
      { key: 'heroStudentsStat', label: 'Hero Students Stat' },
      { key: 'heroTeachersStat', label: 'Hero Teachers Stat' },
      { key: 'heroCoursesStat', label: 'Hero Courses Stat' },
      { key: 'heroSatisfactionStat', label: 'Hero Satisfaction Stat' },
      { key: 'bannerStudentsStat', label: 'Banner Students Stat' },
      { key: 'bannerTeachersStat', label: 'Banner Teachers Stat' },
      { key: 'bannerFacultiesStat', label: 'Banner Faculties Stat' },
      { key: 'bannerNationalRankStat', label: 'Banner National Rank Stat' },
      { key: 'statisticsStudentsStat', label: 'Statistics Students Stat' },
      { key: 'statisticsTeachersStat', label: 'Statistics Teachers Stat' },
      { key: 'statisticsProjectsStat', label: 'Statistics Projects Stat' },
      { key: 'statisticsSatisfactionStat', label: 'Statistics Satisfaction Stat' },
    ],
  },
  {
    title: 'Public Footer and Contact',
    fields: [
      { key: 'aboutLine1En', label: 'About Line 1 (EN)' },
      { key: 'aboutLine1Fr', label: 'About Line 1 (FR)' },
      { key: 'aboutLine1Ar', label: 'About Line 1 (AR)' },
      { key: 'aboutLine2En', label: 'About Line 2 (EN)' },
      { key: 'aboutLine2Fr', label: 'About Line 2 (FR)' },
      { key: 'aboutLine2Ar', label: 'About Line 2 (AR)' },
      { key: 'statisticsQuoteEn', label: 'Statistics Quote (EN)' },
      { key: 'statisticsQuoteFr', label: 'Statistics Quote (FR)' },
      { key: 'statisticsQuoteAr', label: 'Statistics Quote (AR)' },
      { key: 'contactPhone', label: 'Contact Phone' },
      { key: 'contactEmail', label: 'Contact Email' },
      { key: 'contactAddressEn', label: 'Contact Address (EN)' },
      { key: 'contactAddressFr', label: 'Contact Address (FR)' },
      { key: 'contactAddressAr', label: 'Contact Address (AR)' },
    ],
  },
];

const mediaItems = [
  { kind: 'logo', title: 'University Logo', field: 'logoUrl' },
  { kind: 'hero', title: 'Hero Background', field: 'heroBackgroundUrl' },
  { kind: 'banner', title: 'Banner Background', field: 'bannerBackgroundUrl' },
];

export default function AdminSiteSettingsPage() {
  const { setSettings } = useSiteSettings();
  const [form, setForm] = useState({});
  const [mediaFiles, setMediaFiles] = useState({ logo: null, hero: null, banner: null });
  const [uploadingKind, setUploadingKind] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await siteSettingsAPI.getPublic();
        const data = response?.data || {};
        if (!isCancelled) {
          setForm(data);
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.message || 'Failed to load site settings.');
          setForm((previous) => previous || {});
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [setSettings]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleMediaFileChange = (kind, file) => {
    setMediaFiles((prev) => ({ ...prev, [kind]: file || null }));
  };

  const handleMediaUpload = async (kind) => {
    const selectedFile = mediaFiles[kind];
    if (!selectedFile) {
      return;
    }

    setError('');
    setSuccessMessage('');
    setUploadingKind(kind);

    try {
      const response = await siteSettingsAPI.uploadMedia(kind, selectedFile);
      const updated = response?.data || {};
      setForm((prev) => ({ ...prev, ...updated }));
      setSettings((prev) => ({ ...prev, ...updated }));
      setMediaFiles((prev) => ({ ...prev, [kind]: null }));
      setSuccessMessage(`${kind} media updated successfully.`);
    } catch (uploadError) {
      setError(uploadError.message || 'Failed to upload media.');
    } finally {
      setUploadingKind('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {};
      formSections.forEach((section) => {
        section.fields.forEach((field) => {
          payload[field.key] = form[field.key] ?? '';
        });
      });

      const response = await siteSettingsAPI.update(payload);
      const updated = response?.data || {};
      setForm(updated);
      setSettings((prev) => ({ ...prev, ...updated }));
      setSuccessMessage('Site settings updated successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Failed to update site settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl min-w-0">
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-brand/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-tertiary">Administration</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Site Configuration</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
              Manage the homepage, public branding, statistics, and contact details shown to every visitor.
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-edge bg-surface px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to Admin Hub
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-edge-strong bg-danger/5 px-3 py-2.5 text-sm text-danger">{error}</div>
      ) : null}

      {successMessage ? (
        <div className="rounded-md border border-edge-strong bg-success/5 px-3 py-2.5 text-sm text-success">{successMessage}</div>
      ) : null}

      <section className="rounded-2xl border border-edge bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <ImageIcon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink">Brand Media Uploads</h2>
            <p className="text-sm text-ink-secondary">Upload image assets for logo, hero, and banner backgrounds.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {mediaItems.map((item) => {
            const imageUrl = form[item.field] ? resolveMediaUrl(form[item.field]) : '';
            const isUploadingThisItem = uploadingKind === item.kind;

            return (
              <div key={item.kind} className="rounded-xl border border-edge bg-canvas/50 p-4 transition-colors hover:border-brand/30">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <div className="mt-3 h-32 overflow-hidden rounded-md border border-edge-subtle bg-surface-200 flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-ink-tertiary">No media set</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => handleMediaFileChange(item.kind, event.target.files?.[0] || null)}
                  className="mt-3 block w-full rounded-md border border-control-border bg-control-bg px-3 py-2 text-xs text-ink-secondary file:mr-3 file:rounded-md file:border file:border-edge file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink-secondary hover:file:bg-surface-200 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  disabled={loading || saving || Boolean(uploadingKind)}
                />
                <button
                  type="button"
                  onClick={() => handleMediaUpload(item.kind)}
                  disabled={!mediaFiles[item.kind] || loading || saving || Boolean(uploadingKind)}
                  className={`mt-3 w-full ${primaryButtonClassName}`}
                >
                  {isUploadingThisItem ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        {formSections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-edge bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-edge-subtle pb-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Settings2 className="h-4.5 w-4.5" strokeWidth={2} />
              </span>
              <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {section.fields.map((field) => (
                <label key={field.key} className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">{field.label}</span>
                  <input
                    type="text"
                    value={form[field.key] ?? ''}
                    onChange={(event) => handleChange(field.key, event.target.value)}
                    className={inputClassName}
                    disabled={loading || saving}
                  />
                </label>
              ))}
            </div>
          </section>
        ))}

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={loading || saving}
            className={primaryButtonClassName}
          >
            {saving ? 'Saving...' : 'Save Site Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

