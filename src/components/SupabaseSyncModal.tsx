import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Cloud,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Copy,
  Check,
  ExternalLink,
  Code2,
  ShieldCheck,
  Server
} from 'lucide-react';
import {
  SUPABASE_URL,
  SUPABASE_SQL_SETUP,
  testSupabaseConnection,
  pushAllToSupabase,
  pullAllFromSupabase
} from '../supabase/client';
import { AppState } from '../services/storageService';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onApplyImportedState: (newState: AppState) => void;
  onShowToast: (message: string) => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  appState,
  onApplyImportedState,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'sql'>('sync');
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    connected: boolean;
    hasTables: boolean;
    message: string;
    tablesStatus?: { name: string; ok: boolean; count: number }[];
  } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    stats?: {
      trees: number;
      people: number;
      relations: number;
      events: number;
      media: number;
    };
  } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);

  // Testar conexão automaticamente ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    const res = await testSupabaseConnection();
    setConnectionStatus({
      tested: true,
      connected: res.connected,
      hasTables: res.hasTables,
      message: res.message,
      tablesStatus: res.tablesStatus,
    });
    setIsTesting(false);
  };

  const handlePushToSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const res = await pushAllToSupabase(appState);
    if (res.success) {
      setSyncResult({
        success: true,
        message: 'Dados sincronizados com sucesso no banco de dados do Supabase!',
        stats: {
          trees: res.treesCount,
          people: res.peopleCount,
          relations: res.relationsCount,
          events: res.eventsCount,
          media: res.mediaCount,
        },
      });
      onShowToast('✓ Dados enviados com sucesso para o Supabase!');
    } else {
      setSyncResult({
        success: false,
        message: res.error || 'Falha ao sincronizar dados no Supabase.',
      });
    }
    setIsSyncing(false);
  };

  const handlePullFromSupabase = async () => {
    if (!window.confirm('Deseja carregar os dados do Supabase? Os dados da tela serão atualizados com o banco na nuvem.')) {
      return;
    }
    setIsPulling(true);
    setSyncResult(null);
    const res = await pullAllFromSupabase();
    if (res.success && res.appState) {
      onApplyImportedState(res.appState);
      setSyncResult({
        success: true,
        message: 'Dados do Supabase carregados com sucesso no memorial familiar!',
      });
      onShowToast('✓ Dados atualizados a partir do Supabase!');
    } else {
      setSyncResult({
        success: false,
        message: res.error || 'Nenhum dado encontrado no Supabase.',
      });
    }
    setIsPulling(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    onShowToast('Script SQL copiado para a área de transferência!');
  };

  const projectId = 'oiifroiibcrfxjwbulkm';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Banco de Dados Supabase</span>
                <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PostgreSQL
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Sincronização na nuvem com seu projeto Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'sync'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Sincronização & Status</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'sql'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Script SQL (Tabelas)</span>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {activeTab === 'sync' && (
            <div className="space-y-5">
              
              {/* Card de Configuração e Status */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">Servidor Supabase Conectado</span>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testando...' : 'Re-testar Conexão'}</span>
                  </button>
                </div>

                <div className="text-xs space-y-1 font-mono bg-slate-900/90 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>URL do Projeto:</span>
                    <span className="text-emerald-300 select-all">{SUPABASE_URL}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Project ID:</span>
                    <span className="text-slate-200 font-bold">{projectId}</span>
                  </div>
                </div>

                {/* Status da Conexão */}
                {connectionStatus && (
                  <div className={`p-3 rounded-xl border flex flex-col gap-2.5 text-xs ${
                    connectionStatus.connected
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      {connectionStatus.connected ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1 flex-1">
                        <div className="font-semibold">{connectionStatus.message}</div>
                        {!connectionStatus.hasTables && connectionStatus.connected && (
                          <div className="text-[11px] text-amber-300">
                            Abra a aba <strong>"Script SQL (Tabelas)"</strong> acima, copie o código e execute no SQL Editor do Supabase para criar as tabelas com um clique.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chips com status de cada tabela */}
                    {connectionStatus.tablesStatus && connectionStatus.tablesStatus.length > 0 && (
                      <div className="pt-2 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {connectionStatus.tablesStatus.map(tbl => (
                          <div
                            key={tbl.name}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center justify-between border ${
                              tbl.ok
                                ? 'bg-emerald-900/40 border-emerald-500/30 text-emerald-300'
                                : 'bg-rose-900/40 border-rose-500/30 text-rose-300'
                            }`}
                          >
                            <span className="truncate">{tbl.name}</span>
                            <span className="font-bold shrink-0 ml-1">
                              {tbl.ok ? '✓' : '✗'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botões de Ação Principal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Enviar para Supabase */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <UploadCloud className="w-4 h-4" />
                      <span>Enviar Dados para a Nuvem</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Salva todas as {appState.people.length} pessoas, {appState.relationships.length} parentescos e árvores locais diretamente no banco do Supabase.
                    </p>
                  </div>

                  <button
                    onClick={handlePushToSupabase}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Enviar Tudo para o Supabase'}</span>
                  </button>
                </div>

                {/* Baixar do Supabase */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                      <DownloadCloud className="w-4 h-4" />
                      <span>Baixar Dados do Supabase</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Restaura as árvores e familiares salvos na nuvem do Supabase para visualização imediata no memorial.
                    </p>
                  </div>

                  <button
                    onClick={handlePullFromSupabase}
                    disabled={isPulling}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-200 border border-cyan-500/30 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <DownloadCloud className={`w-4 h-4 ${isPulling ? 'animate-bounce' : ''}`} />
                    <span>{isPulling ? 'Buscando...' : 'Carregar Dados do Supabase'}</span>
                  </button>
                </div>

              </div>

              {/* Resultado da Sincronização */}
              {syncResult && (
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  syncResult.success
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="flex items-center gap-2 font-semibold">
                    {syncResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>{syncResult.message}</span>
                  </div>

                  {syncResult.stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-[11px]">
                      <div>Árvores: <strong>{syncResult.stats.trees}</strong></div>
                      <div>Pessoas: <strong>{syncResult.stats.people}</strong></div>
                      <div>Relações: <strong>{syncResult.stats.relations}</strong></div>
                      <div>Mídias: <strong>{syncResult.stats.media}</strong></div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-slate-300">
                  Execute este script no <strong>SQL Editor</strong> do painel do Supabase para criar as tabelas e permissões:
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://supabase.com/dashboard/project/${projectId}/sql/new`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
                  >
                    <span>Abrir SQL Editor do Supabase</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Copiar Código SQL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-[11px]">
                <pre className="p-4 text-emerald-300/90 overflow-x-auto max-h-80 leading-relaxed">
                  {SUPABASE_SQL_SETUP}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-emerald-300">Proteção Row Level Security (RLS) Granular Aplicada:</div>
                  <p className="text-slate-300 leading-relaxed">
                    O script substitui políticas abertas vulneráveis por regras restritas por comando (SELECT, INSERT, UPDATE, DELETE). Impede exclusões em massa acidentais e isola os familiares e memórias dentro de suas respectivas árvores genealógicas.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Nossa Árvore · Integração Supabase PostgreSQL
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
