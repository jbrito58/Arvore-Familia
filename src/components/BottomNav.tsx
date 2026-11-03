import React from 'react';
import {
  LayoutDashboard,
  GitFork,
  UserPlus,
  Users,
  Menu,
  Compass,
  Clock,
  Sparkles,
  MapPin,
  Download,
  X,
  FolderPlus
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAddPerson: () => void;
  onOpenImportExport: () => void;
  onOpenNewTreeModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAddPerson,
  onOpenImportExport,
  onOpenNewTreeModal,
}) => {
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);

  return (
    <>
      {/* Menu "Mais" gaveta no Mobile */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm lg:hidden flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-amber-500/30 rounded-t-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-serif text-amber-200 font-semibold text-sm">
                Mais Recursos Familiares
              </span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4">
              <button
                onClick={() => {
                  setCurrentTab('kinship');
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left text-xs text-slate-200 hover:border-amber-400/50"
              >
                <Compass className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-medium text-slate-100">Parentesco</div>
                  <div className="text-[10px] text-slate-400">Qual é o grau?</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('timeline');
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left text-xs text-slate-200 hover:border-amber-400/50"
              >
                <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium text-slate-100">Linha do Tempo</div>
                  <div className="text-[10px] text-slate-400">Eventos vitais</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('memories');
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left text-xs text-slate-200 hover:border-amber-400/50"
              >
                <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <div className="font-medium text-slate-100">Memórias</div>
                  <div className="text-[10px] text-slate-400">Fotos & Cartas</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('map');
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left text-xs text-slate-200 hover:border-amber-400/50"
              >
                <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-medium text-slate-100">Origens</div>
                  <div className="text-[10px] text-slate-400">Cidades & mapa</div>
                </div>
              </button>

              {onOpenNewTreeModal && (
                <button
                  onClick={() => {
                    onOpenNewTreeModal();
                    setShowMoreMenu(false);
                  }}
                  className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 hover:bg-amber-500/25 font-medium transition-colors"
                >
                  <FolderPlus className="w-4 h-4 text-amber-400" />
                  <span>+ Criar Nova Família / Nova Árvore</span>
                </button>
              )}

              <button
                onClick={() => {
                  onOpenImportExport();
                  setShowMoreMenu(false);
                }}
                className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 hover:border-amber-400/50 font-medium"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Exportar, Importar ou Imprimir Relatório</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra Inferior Fixa */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 lg:hidden px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] transition-colors ${
            currentTab === 'dashboard' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Painel</span>
        </button>

        <button
          onClick={() => setCurrentTab('tree')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] transition-colors ${
            currentTab === 'tree' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <GitFork className="w-5 h-5 rotate-180" />
          <span>Árvore</span>
        </button>

        {/* Botão Central de Destaque */}
        <button
          onClick={onOpenAddPerson}
          className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-950/60 border-2 border-slate-900 active:scale-95 transition-transform"
          title="Adicionar Familiar"
        >
          <UserPlus className="w-6 h-6" />
        </button>

        <button
          onClick={() => setCurrentTab('people')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] transition-colors ${
            currentTab === 'people' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Pessoas</span>
        </button>

        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] transition-colors ${
            ['kinship', 'timeline', 'memories', 'map'].includes(currentTab)
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>Mais</span>
        </button>
      </div>
    </>
  );
};
