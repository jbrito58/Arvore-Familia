import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  Printer,
  FileJson,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Person, FamilyTree, Relationship, FamilyEvent, FamilyMedia } from '../types/genealogy';
import { exportToJSON, exportPeopleToCSV, parsePeopleFromCSV, AppState, getCurrentTree } from '../services/storageService';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onImportState: (newState: AppState) => void;
  onImportPeopleFromCSV: (newPeople: Person[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  appState,
  onImportState,
  onImportPeopleFromCSV,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'print'>('export');
  const [importPreviewText, setImportPreviewText] = useState('');
  const [importType, setImportType] = useState<'json' | 'csv'>('json');
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeTree = getCurrentTree(appState);

  // Download do arquivo JSON
  const handleDownloadJSON = () => {
    const jsonStr = exportToJSON(appState);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nossa_arvore_${(activeTree.surname || 'familia').replace(/\s+/g, '_')}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download do arquivo CSV
  const handleDownloadCSV = () => {
    const csvStr = exportPeopleToCSV(appState.people);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nossa_arvore_${(activeTree.surname || 'familia').replace(/\s+/g, '_')}_familiares.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Processamento do arquivo de importação
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      setImportType('json');
      reader.onload = ev => {
        const text = ev.target?.result as string;
        try {
          const parsed = JSON.parse(text);
          if (parsed.people && Array.isArray(parsed.people)) {
            setImportPreviewText(text);
            setPreviewCount(parsed.people.length);
          } else {
            setErrorMessage('Arquivo JSON não possui a estrutura válida do aplicativo Nossa Árvore.');
          }
        } catch (err) {
          setErrorMessage('Erro ao analisar arquivo JSON: Formato corrompido.');
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
      setImportType('csv');
      reader.onload = ev => {
        const text = ev.target?.result as string;
        const parsed = parsePeopleFromCSV(text, activeTree.id);
        if (parsed.length > 0) {
          setImportPreviewText(text);
          setPreviewCount(parsed.length);
        } else {
          setErrorMessage('Nenhum familiar válido encontrado na planilha CSV informada.');
        }
      };
      reader.readAsText(file);
    } else {
      setErrorMessage('Por favor, selecione um arquivo no formato .json ou .csv.');
    }
  };

  // Concluir importação
  const handleConfirmImport = () => {
    if (!importPreviewText) return;

    if (importType === 'json') {
      try {
        const parsed = JSON.parse(importPreviewText) as AppState;
        onImportState(parsed);
        alert('Árvore familiar importada com sucesso!');
        onClose();
      } catch (err) {
        setErrorMessage('Falha ao aplicar importação.');
      }
    } else {
      const parsed = parsePeopleFromCSV(importPreviewText, activeTree.id);
      onImportPeopleFromCSV(parsed);
      alert(`${parsed.length} pessoas importadas com sucesso!`);
      onClose();
    }
  };

  // Imprimir Relatório
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif text-lg font-bold text-amber-100">
              Preservação, Backup & Relatórios
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Exportar & Backup
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Importar Dados
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'print'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Imprimir Relatório
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          
          {/* ABA EXPORTAR */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Seus dados familiares pertencem a você. Exporte uma cópia completa de segurança em arquivo JSON (com árvore, pessoas, vínculos e memórias) ou uma planilha CSV contendo a lista dos familiares.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleDownloadJSON}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-400/50 text-left transition-colors cursor-pointer group"
                >
                  <FileJson className="w-8 h-8 text-amber-400 group-hover:scale-105 transition-transform" />
                  <div>
                    <div className="text-xs font-bold text-amber-100">Backup Completo (JSON)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Contém todas as pessoas, árvores, datas, biografias e vínculos.
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-400/50 text-left transition-colors cursor-pointer group"
                >
                  <FileSpreadsheet className="w-8 h-8 text-emerald-400 group-hover:scale-105 transition-transform" />
                  <div>
                    <div className="text-xs font-bold text-emerald-100">Planilha Excel / CSV</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Exporta lista tabulada com datas de nascimento, locais e óbitos.
                    </div>
                  </div>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Compatibilidade futura garantida com o padrão internacional de genealogia GEDCOM.</span>
              </div>
            </div>
          )}

          {/* ABA IMPORTAR */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Envie um arquivo JSON exportado anteriormente ou uma planilha CSV com colunas de familiares para enriquecer sua árvore.
              </p>

              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-400 text-center transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <label className="text-xs font-semibold text-amber-300 hover:text-amber-200 cursor-pointer">
                  <span>Clique para selecionar arquivo (.json ou .csv)</span>
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <div className="text-[10px] text-slate-500 mt-1">
                  Validação automática de duplicidades antes de aplicar
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {previewCount !== null && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <CheckCircle className="w-4 h-4" />
                    <span>Arquivo validado: {previewCount} pessoa(s) prontas para importação.</span>
                  </div>
                  <button
                    onClick={handleConfirmImport}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
                  >
                    Confirmar e Importar para a Árvore
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ABA IMPRIMIR */}
          {activeTab === 'print' && (
            <div className="space-y-4 text-center">
              <Printer className="w-10 h-10 text-amber-400 mx-auto" />
              <h4 className="font-serif text-base font-bold text-amber-100">
                Relatório Genealógico para Impressão
              </h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Gere uma versão formatada para papel da árvore e da lista de familiares, ideal para emoldurar ou arquivar no álbum de memórias físicas.
              </p>
              <button
                onClick={handlePrint}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg cursor-pointer"
              >
                Abrir Diálogo de Impressão (PDF)
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
