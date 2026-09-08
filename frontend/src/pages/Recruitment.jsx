import { useCallback, useEffect, useState } from 'react';
import { Plus, Briefcase, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import JobPostingModal from '../components/recruitment/JobPostingModal';
import CandidateModal from '../components/recruitment/CandidateModal';
import { initials, getErrorMessage } from '../utils/formatters';

const STAGES = [
  { value: 'applied', label: 'Applied', color: 'var(--ink-soft)' },
  { value: 'interview', label: 'Interview', color: 'var(--accent)' },
  { value: 'offered', label: 'Offered', color: 'var(--warning)' },
  { value: 'hired', label: 'Hired', color: 'var(--success)' },
  { value: 'rejected', label: 'Rejected', color: 'var(--danger)' },
];

export default function Recruitment() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'hr';
  const canDelete = user?.role === 'admin'; // only Admin can delete job postings/candidates

  const [departments, setDepartments] = useState([]);
  const [postings, setPostings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [error, setError] = useState('');

  const [jobModal, setJobModal] = useState({ open: false, posting: null });
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [deleteJobTarget, setDeleteJobTarget] = useState(null);
  const [deleteCandTarget, setDeleteCandTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchPostings = useCallback(() => {
    setLoading(true);
    setError('');
    api.get('/api/recruitment/jobs_get.php')
      .then((res) => {
        const list = res.data.data.job_postings;
        setPostings(list);
        if (list.length > 0 && !list.some((p) => p.id === selectedId)) {
          setSelectedId(list[0].id);
        }
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not load job postings.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchPostings(); }, [fetchPostings]);

  useEffect(() => {
    api.get('/api/departments/get.php').then((res) => setDepartments(res.data.data.departments));
  }, []);

  const fetchCandidates = useCallback(() => {
    if (!selectedId) { setCandidates([]); return; }
    setCandidatesLoading(true);
    api.get('/api/recruitment/candidates_get.php', { params: { job_posting_id: selectedId } })
      .then((res) => setCandidates(res.data.data.candidates))
      .finally(() => setCandidatesLoading(false));
  }, [selectedId]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  async function handleStageChange(candidate, stage) {
    try {
      await api.post('/api/recruitment/candidates_update_stage.php', { id: candidate.id, stage });
      toast.success('Stage updated.');
      fetchCandidates();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDeleteJob() {
    setBusy(true);
    try {
      await api.delete('/api/recruitment/jobs_delete.php', { data: { id: deleteJobTarget.id } });
      toast.success('Job posting deleted.');
      setDeleteJobTarget(null);
      if (selectedId === deleteJobTarget.id) setSelectedId(null);
      fetchPostings();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCandidate() {
    setBusy(true);
    try {
      await api.delete('/api/recruitment/candidates_delete.php', { data: { id: deleteCandTarget.id } });
      toast.success('Candidate removed.');
      setDeleteCandTarget(null);
      fetchCandidates();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const selectedPosting = postings.find((p) => p.id === selectedId);

  return (
    <div className="animate-fade-rise">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>{postings.length} job posting(s).</p>
        {canManage && (
          <button
            onClick={() => setJobModal({ open: true, posting: null })}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={16} /> New Job Posting
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {!loading && postings.length === 0 ? (
        <div className="rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <EmptyState icon={Briefcase} title="No job postings yet" description="Create a job posting to start tracking candidates." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Job postings list */}
          <div className="space-y-3 lg:col-span-2">
            {postings.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  borderColor: selectedId === p.id ? 'var(--accent)' : 'var(--border)',
                  background: 'var(--surface)',
                  boxShadow: selectedId === p.id ? '0 0 0 1px var(--accent)' : 'none',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>{p.title}</p>
                    <p className="truncate text-xs" style={{ color: 'var(--ink-soft)' }}>{p.department_name || 'Unassigned'}</p>
                  </div>
                  <span
                    className="flex-none rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: p.status === 'open' ? 'var(--success-soft)' : 'var(--surface-hover)',
                      color: p.status === 'open' ? 'var(--success)' : 'var(--ink-faint)',
                    }}
                  >
                    {p.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-soft)' }}>
                    <Users size={13} /> {p.candidate_count} candidate(s)
                  </span>
                  {(canManage || canDelete) && (
                    <div className="flex gap-1">
                      {canManage && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setJobModal({ open: true, posting: p }); }}
                          className="rounded-lg p-1 transition hover:bg-black/5"
                          style={{ color: 'var(--ink-soft)' }}
                        >
                          <Pencil size={14} />
                        </span>
                      )}
                      {canDelete && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setDeleteJobTarget(p); }}
                          className="rounded-lg p-1 transition hover:bg-black/5"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Candidates panel */}
          <div className="rounded-2xl border p-5 lg:col-span-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            {selectedPosting ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-semibold" style={{ color: 'var(--ink)' }}>{selectedPosting.title}</h3>
                    <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>{selectedPosting.description}</p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => setCandidateModalOpen(true)}
                      className="flex flex-none items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-black/5"
                      style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                    >
                      <UserPlus size={14} /> Add Candidate
                    </button>
                  )}
                </div>

                {candidatesLoading ? (
                  <p className="py-8 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>Loading candidates…</p>
                ) : candidates.length === 0 ? (
                  <p className="py-8 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>No candidates yet for this posting.</p>
                ) : (
                  <div className="space-y-2.5">
                    {candidates.map((c) => (
                      <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                        <div
                          className="flex h-9 w-9 flex-none items-center justify-center rounded-full font-display text-xs font-semibold text-white"
                          style={{ background: 'var(--accent)' }}
                        >
                          {initials(c.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>{c.full_name}</p>
                          <p className="truncate text-xs" style={{ color: 'var(--ink-soft)' }}>{c.email}</p>
                        </div>
                        {canManage ? (
                          <select
                            value={c.stage}
                            onChange={(e) => handleStageChange(c, e.target.value)}
                            className="rounded-lg border px-2 py-1 text-xs outline-none"
                            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                          >
                            {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        ) : (
                          <span className="rounded-full px-2 py-1 text-xs font-medium" style={{ color: STAGES.find((s) => s.value === c.stage)?.color }}>
                            {STAGES.find((s) => s.value === c.stage)?.label}
                          </span>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteCandTarget(c)} className="rounded-lg p-1.5 transition hover:bg-black/5" style={{ color: 'var(--danger)' }}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>Select a job posting to view candidates.</p>
            )}
          </div>
        </div>
      )}

      <JobPostingModal
        open={jobModal.open}
        posting={jobModal.posting}
        departments={departments}
        onClose={() => setJobModal({ open: false, posting: null })}
        onSaved={fetchPostings}
      />

      {selectedPosting && (
        <CandidateModal
          open={candidateModalOpen}
          jobPostingId={selectedPosting.id}
          jobTitle={selectedPosting.title}
          onClose={() => setCandidateModalOpen(false)}
          onSaved={fetchCandidates}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteJobTarget)}
        onClose={() => setDeleteJobTarget(null)}
        onConfirm={handleDeleteJob}
        loading={busy}
        title="Delete job posting?"
        description={`This will also remove all candidates for "${deleteJobTarget?.title}". This action cannot be undone.`}
      />

      <ConfirmDialog
        open={Boolean(deleteCandTarget)}
        onClose={() => setDeleteCandTarget(null)}
        onConfirm={handleDeleteCandidate}
        loading={busy}
        title="Remove candidate?"
        description={`This will remove ${deleteCandTarget?.full_name || 'this candidate'} from the pipeline.`}
      />
    </div>
  );
}