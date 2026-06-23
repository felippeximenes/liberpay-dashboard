'use client';

import { useState } from 'react';
import { WeeklySnapshot } from '@/types/snapshot';
import { FileSpreadsheet, Loader2, ExternalLink, AlertCircle } from 'lucide-react';

export default function ExportButton({ data }: { data: WeeklySnapshot }) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  async function handleExport() {
    setState('loading');
    try {
      const res = await fetch('/api/export-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      window.open(url, '_blank', 'noopener');
      setState('idle');
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={state === 'loading'}
      title="Exportar dados para Google Sheets"
      style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        padding: '8px 16px', borderRadius: '10px', cursor: state === 'loading' ? 'wait' : 'pointer',
        border: state === 'error'
          ? '1px solid rgba(248,113,113,0.40)'
          : '1px solid rgba(52,211,153,0.30)',
        background: state === 'error'
          ? 'rgba(248,113,113,0.10)'
          : 'rgba(52,211,153,0.10)',
        color: state === 'error' ? '#F87171' : '#34D399',
        fontSize: '12px', fontWeight: 600,
        transition: 'all 0.15s',
        opacity: state === 'loading' ? 0.7 : 1,
      }}
    >
      {state === 'loading' ? (
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
      ) : state === 'error' ? (
        <AlertCircle size={14} />
      ) : (
        <FileSpreadsheet size={14} />
      )}
      {state === 'loading' ? 'Criando planilha…' : state === 'error' ? 'Erro — tente novamente' : 'Exportar Sheets'}
      {state === 'idle' && <ExternalLink size={11} style={{ opacity: 0.6 }} />}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
