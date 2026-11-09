import { useDashboardData } from '@/hooks/useDashboardData';
import type { Beispieleintraege } from '@/types/app';

import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BeispieleintraegeDialog } from '@/components/dialogs/BeispieleintraegeDialog';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconCalendar, IconUser,
  IconList, IconStar, IconTag, IconToggleRight,
} from '@tabler/icons-react';

const APPGROUP_ID = '6af1d36db95cb680641da554';
const REPAIR_ENDPOINT = '/claude/build/repair';

const KATEGORIE_COLS = [
  { key: 'wichtig', label: 'Wichtig', color: 'bg-rose-50 border-rose-200', badgeClass: 'bg-rose-100 text-rose-700' },
  { key: 'allgemein', label: 'Allgemein', color: 'bg-blue-50 border-blue-200', badgeClass: 'bg-blue-100 text-blue-700' },
  { key: 'sonstiges', label: 'Sonstiges', color: 'bg-slate-50 border-slate-200', badgeClass: 'bg-slate-100 text-slate-600' },
  { key: '__none__', label: 'Ohne Kategorie', color: 'bg-muted/40 border-border', badgeClass: 'bg-muted text-muted-foreground' },
];

export default function DashboardOverview() {
  const { beispieleintraege, loading, error, fetchAll } = useDashboardData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Beispieleintraege | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Beispieleintraege | null>(null);
  const [filterAktiv, setFilterAktiv] = useState<'alle' | 'aktiv' | 'inaktiv'>('alle');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return beispieleintraege.filter(e => {
      if (filterAktiv === 'aktiv' && !e.fields.aktiv) return false;
      if (filterAktiv === 'inaktiv' && e.fields.aktiv) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (e.fields.titel ?? '').toLowerCase().includes(q) ||
          (e.fields.beschreibung ?? '').toLowerCase().includes(q) ||
          (e.fields.kontakt_vorname ?? '').toLowerCase().includes(q) ||
          (e.fields.kontakt_nachname ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [beispieleintraege, filterAktiv, search]);

  const byKategorie = useMemo(() => {
    const map: Record<string, Beispieleintraege[]> = {};
    for (const col of KATEGORIE_COLS) map[col.key] = [];
    for (const e of filtered) {
      const key = e.fields.kategorie?.key ?? '__none__';
      if (map[key]) map[key].push(e);
      else map['__none__'].push(e);
    }
    return map;
  }, [filtered]);

  const aktiv = useMemo(() => beispieleintraege.filter(e => e.fields.aktiv).length, [beispieleintraege]);
  const inaktiv = beispieleintraege.length - aktiv;
  const mitDatum = useMemo(() => beispieleintraege.filter(e => e.fields.datum).length, [beispieleintraege]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleCreate = async (fields: Beispieleintraege['fields']) => {
    await LivingAppsService.createBeispieleintraegeEntry(fields);
    fetchAll();
  };

  const handleEdit = async (fields: Beispieleintraege['fields']) => {
    if (!editRecord) return;
    await LivingAppsService.updateBeispieleintraegeEntry(editRecord.record_id, fields);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteBeispieleintraegeEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Übersicht</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{beispieleintraege.length} Einträge gesamt</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} className="shrink-0">
          <IconPlus size={16} className="mr-1.5 shrink-0" />
          Neuer Eintrag
        </Button>
      </div>

      {/* KPI-Karten */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Gesamt"
          value={String(beispieleintraege.length)}
          description="Alle Einträge"
          icon={<IconList size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Aktiv"
          value={String(aktiv)}
          description="Aktive Einträge"
          icon={<IconToggleRight size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Inaktiv"
          value={String(inaktiv)}
          description="Deaktivierte Einträge"
          icon={<IconStar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mit Datum"
          value={String(mitDatum)}
          description="Einträge mit Datum"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Filter-Leiste */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <input
            type="text"
            placeholder="Einträge suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1.5">
          {(['alle', 'aktiv', 'inaktiv'] as const).map(v => (
            <button
              key={v}
              onClick={() => setFilterAktiv(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterAktiv === v
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {v === 'alle' ? 'Alle' : v === 'aktiv' ? 'Aktiv' : 'Inaktiv'}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban-Spalten nach Kategorie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KATEGORIE_COLS.map(col => {
          const eintraege = byKategorie[col.key] ?? [];
          return (
            <div key={col.key} className={`rounded-2xl border ${col.color} p-4 space-y-3 min-h-[200px]`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconTag size={14} className="shrink-0 text-muted-foreground" />
                  <span className="font-semibold text-sm">{col.label}</span>
                </div>
                <Badge variant="secondary" className="text-xs">{eintraege.length}</Badge>
              </div>

              <div className="space-y-2">
                {eintraege.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Keine Einträge</p>
                )}
                {eintraege.map(e => (
                  <EintragKarte
                    key={e.record_id}
                    eintrag={e}
                    badgeClass={col.badgeClass}
                    onEdit={() => { setEditRecord(e); setDialogOpen(true); }}
                    onDelete={() => setDeleteTarget(e)}
                  />
                ))}
              </div>

              <button
                onClick={() => { setEditRecord(null); setDialogOpen(true); }}
                className="w-full flex items-center gap-1.5 justify-center py-2 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground text-xs hover:bg-background/60 transition-colors"
              >
                <IconPlus size={13} className="shrink-0" />
                Hinzufügen
              </button>
            </div>
          );
        })}
      </div>

      {/* Dialoge */}
      <BeispieleintraegeDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={editRecord ? handleEdit : handleCreate}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Beispieleintraege']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Beispieleintraege']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description={`Soll "${deleteTarget?.fields.titel ?? 'dieser Eintrag'}" wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function EintragKarte({
  eintrag,
  badgeClass,
  onEdit,
  onDelete,
}: {
  eintrag: Beispieleintraege;
  badgeClass: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { fields } = eintrag;
  const name = [fields.kontakt_vorname, fields.kontakt_nachname].filter(Boolean).join(' ');

  return (
    <div className="bg-white rounded-xl border border-border/60 p-3 space-y-2 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{fields.titel ?? '—'}</p>
          {fields.beschreibung && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{fields.beschreibung}</p>
          )}
        </div>
        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${fields.aktiv ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
          {fields.aktiv ? 'Aktiv' : 'Inaktiv'}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {fields.kategorie && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
            {fields.kategorie.label}
          </span>
        )}
        {fields.datum && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <IconCalendar size={11} className="shrink-0" />
            {formatDate(fields.datum)}
          </span>
        )}
      </div>

      {name && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <IconUser size={11} className="shrink-0" />
          <span className="truncate">{name}</span>
          {fields.kontakt_email && (
            <a
              href={`mailto:${fields.kontakt_email}`}
              className="ml-auto text-primary hover:underline truncate max-w-[120px]"
              onClick={e => e.stopPropagation()}
            >
              {fields.kontakt_email}
            </a>
          )}
        </div>
      )}

      <div className="flex gap-1 pt-1 border-t border-border/40">
        <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={onEdit}>
          <IconPencil size={12} className="mr-1 shrink-0" />
          Bearbeiten
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <IconTrash size={12} />
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
