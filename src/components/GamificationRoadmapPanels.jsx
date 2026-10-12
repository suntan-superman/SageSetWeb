import { useState } from 'react';
import {
  getGamificationRetentionReportForAdmin, getSocialModerationForAdmin, moderateSocialContentForAdmin,
  getOfficialCompetitionScheduleForAdmin, updateOfficialCompetitionScheduleForAdmin,
} from '../services/adminUsers.js';

const inputClass = 'rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-sm text-white';
const buttonClass = 'rounded-lg border border-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50';
const panelClass = 'mt-6 rounded-2xl border border-gray-700 bg-gray-800/70 p-5';
const errorMessage = (error) => error?.message || 'Unable to load this panel. Retry when the service is available.';

function RetentionPanel() {
  const [report, setReport] = useState(null);
  const [anchorEvent, setAnchor] = useState('reward_summary_viewed');
  const [environment, setEnvironment] = useState('production');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const loadExport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true); setError(''); setReport(null);
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error('Export must be at most 4 MB and 10,000 events.');
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.events) || parsed.events.length > 10000 || !parsed.observedThrough) throw new Error('Export must contain events[] and an observedThrough ISO timestamp.');
      // Discard contact data and arbitrary properties before calling the server.
      const events = parsed.events.map((row) => ({eventId: row.eventId || null, eventName: row.eventName || '',
        userId: row.userId || '', occurredAt: row.occurredAt || '', productId: row.productId || '',
        environment: row.environment || '', platform: row.platform || '', properties: {
          experimentVersion: row.properties?.experimentVersion || null,
          experimentVariant: row.properties?.experimentVariant || row.properties?.variant || null,
        }}));
      setReport(await getGamificationRetentionReportForAdmin({events, observedThrough: parsed.observedThrough, environment, anchorEvent}));
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  };
  return <section className={panelClass}>
    <h2 className="text-lg font-semibold text-white">Gamification retention</h2>
    <p className="mt-2 text-sm text-gray-300">Load a Workside Analytics JSON export. Each member's first anchor in the export starts their cohort. Reports cover the exported sample; raw events are not saved.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <select aria-label="Retention anchor" className={inputClass} value={anchorEvent} onChange={(event) => {setAnchor(event.target.value); setReport(null);}} disabled={busy}>
        <option value="reward_summary_viewed">Reward summary</option><option value="gamification_exposed">First exposure</option><option value="weekly_quest_completed">Quest completion</option>
      </select>
      <select aria-label="Analytics environment" className={inputClass} value={environment} onChange={(event) => {setEnvironment(event.target.value); setReport(null);}} disabled={busy}>
        <option value="production">Production</option><option value="staging">Staging</option>
      </select>
      <label className={buttonClass}>{busy ? 'Calculating…' : 'Load analytics export'}<input aria-label="Workside Analytics export" type="file" accept="application/json,.json" className="ml-3 max-w-64" disabled={busy} onChange={loadExport} /></label>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    {report && <>
      <p className="mt-3 text-xs text-gray-400">{report.acceptedEvents} accepted events · observed through {new Date(report.observedThrough).toLocaleString()}{report.sampleCapped ? ' · 10,000-event sample cap reached' : ''}</p>
      <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm text-gray-200">
        <thead><tr><th className="p-2">Cohort</th><th className="p-2">Members</th>{['D1', 'D2', 'D3', 'next7', 'W2', 'W4'].map((key) => <th className="p-2" key={key}>{key === 'next7' ? 'Next 7 days' : key}</th>)}</tr></thead>
        <tbody>{report.rows.map((row) => <tr className="border-t border-gray-700" key={row.cohort}><td className="p-2">{row.cohort}</td><td className="p-2">{row.members}</td>{['D1', 'D2', 'D3', 'next7', 'W2', 'W4'].map((key) => {
          const metric = row.windows[key];
          return <td className="p-2" key={key}><div>{metric.rate == null ? 'Awaiting window' : `${metric.rate}%`}</div><div className="text-xs text-gray-400">{metric.returned}/{metric.eligible} eligible · {metric.pending} pending</div></td>;
        })}</tr>)}</tbody>
      </table></div>
      <p className="mt-3 text-xs text-gray-400">Elapsed-time windows: D1 24–48h, D2 48–72h, D3 72–96h, W2 days 7–14, W4 days 21–28. Members enter a denominator after the full window closes. Backend rewards do not count as returns. Correlation does not establish causation.</p>
    </>}
  </section>;
}

function CompetitionSchedulePanel() {
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const load = async () => {setBusy(true); setError(''); try {setSettings(await getOfficialCompetitionScheduleForAdmin());} catch (failure) {setError(errorMessage(failure));} finally {setBusy(false);}};
  const save = async () => {
    setBusy(true); setError(''); setSaved(false);
    try {await updateOfficialCompetitionScheduleForAdmin(settings); setSaved(true);} catch (failure) {setError(errorMessage(failure));} finally {setBusy(false);}
  };
  return <section className={panelClass}>
    <div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold text-white">Recurring official competitions</h2><button className={buttonClass} onClick={load} disabled={busy}>Load / refresh</button></div>
    <p className="mt-2 text-sm text-gray-300">Publish one verified squat competition per UTC week. Notifications require each member's opt-in. The foundation kill switch also stops publication and fanout.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    {settings && <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-3"><input aria-label="Recurring competition title" className={inputClass} maxLength={60} value={settings.title} onChange={(event) => {setSettings({...settings, title: event.target.value}); setSaved(false);}} /><input aria-label="Recurring verified squat target" className={inputClass} type="number" min="5" max="100" value={settings.targetReps} onChange={(event) => {setSettings({...settings, targetReps: Number(event.target.value)}); setSaved(false);}} /></div>
      {[
        ['lifecycleValidated', 'Physical two-account official competition lifecycle passed'],
        ['enabled', 'Enable recurring publication'], ['notificationsEnabled', 'Enable bounded publication notifications'],
      ].map(([field, label]) => <label key={field} className="flex items-center gap-3 text-sm text-gray-200"><input type="checkbox" disabled={busy || (field === 'enabled' && !settings.lifecycleValidated)} checked={settings[field] === true} onChange={(event) => {setSettings({...settings, [field]: event.target.checked, ...(field === 'lifecycleValidated' && !event.target.checked ? {enabled: false} : {})}); setSaved(false);}} />{label}</label>)}
      <button className={buttonClass} onClick={save} disabled={busy || (settings.enabled && !settings.lifecycleValidated)}>{busy ? 'Saving…' : 'Save schedule'}</button>{saved && <p role="status" className="text-sm text-emerald-300">Schedule saved.</p>}
    </div>}
  </section>;
}

function SocialModerationPanel() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [memberId, setMemberId] = useState('');
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');
  const load = async () => {setBusy(true); setError(''); try {setData(await getSocialModerationForAdmin());} catch (failure) {setError(errorMessage(failure));} finally {setBusy(false);}};
  const act = async (action, targetId, extras = {}) => {
    setBusy(true); setError('');
    try {await moderateSocialContentForAdmin({action, targetId, note, ...extras}); setData(await getSocialModerationForAdmin());}
    catch (failure) {setError(errorMessage(failure));} finally {setBusy(false);}
  };
  const disabled = busy || note.trim().length < 5;
  return <section className={panelClass}>
    <div className="flex justify-between gap-3"><h2 className="text-lg font-semibold text-white">Social safety and audit</h2><button className={buttonClass} disabled={busy} onClick={load}>Load / refresh</button></div>
    <p className="mt-2 text-sm text-gray-300">Review the latest 50 reports, groups, and challenges. Every action requires an audit note.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    {data && <>
      <div className="mt-4 flex flex-wrap gap-3"><input aria-label="Moderation audit note" className={`${inputClass} flex-1`} placeholder="Audit note (at least 5 characters)" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} /><input aria-label="Search social content" className={inputClass} placeholder="Search loaded content" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      {['reports', 'groups', 'challenges'].map((type) => <div key={type} className="mt-5"><h3 className="font-semibold capitalize text-gray-200">{type}</h3>
        {(data[type] || []).filter((row) => `${row.id} ${row.name} ${row.reason} ${row.targetId}`.toLowerCase().includes(search.toLowerCase())).map((row) => <div key={row.id} className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-700 p-3">
          <div className="text-sm text-gray-200">{row.name || row.reason || row.id}<span className="ml-2 text-xs text-gray-400">{row.status} · {type === 'reports' ? `${row.targetType}: ${row.targetId}` : `${row.memberCount} members / participants`}</span>{row.note && <p className="mt-1 text-xs text-gray-400">{row.note}</p>}</div>
          {type === 'groups' && ['active', 'paused'].includes(row.status) && <button className={buttonClass} disabled={disabled} onClick={() => act(row.status === 'paused' ? 'resume_group' : 'pause_group', row.id)}>{row.status === 'paused' ? 'Resume' : 'Pause'} group</button>}
          {type === 'challenges' && row.status === 'active' && <button className={buttonClass} disabled={disabled} onClick={() => act('close_challenge', row.id)}>Close challenge</button>}
          {type === 'reports' && row.status === 'open' && <button className={buttonClass} disabled={disabled} onClick={() => act('resolve_report', row.id)}>Resolve report</button>}
        </div>)}{data[type]?.length === 0 && <p className="mt-2 text-sm text-gray-400">No {type} in the current sample.</p>}
      </div>)}
      <div className="mt-5 flex flex-wrap gap-3"><input aria-label="Member ID for forced rename" className={inputClass} placeholder="Member ID" value={memberId} onChange={(event) => setMemberId(event.target.value)} /><input aria-label="Replacement SageSet name" className={inputClass} placeholder="Replacement SageSet name" maxLength={20} value={newName} onChange={(event) => setNewName(event.target.value)} /><button className={buttonClass} disabled={disabled || !memberId || !/^[a-z0-9_]{3,20}$/.test(newName)} onClick={() => act('force_rename', memberId, {sageSetName: newName})}>Apply audited rename</button></div>
      <h3 className="mt-5 font-semibold text-gray-200">Recent audit</h3>{(data.audit || []).map((row) => <p className="mt-2 text-xs text-gray-400" key={row.id}>{row.action} · {row.targetId} · {row.status} · {row.note} · {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}</p>)}
    </>}
  </section>;
}

export default function GamificationRoadmapPanels() {
  return <><RetentionPanel /><CompetitionSchedulePanel /><SocialModerationPanel /></>;
}
