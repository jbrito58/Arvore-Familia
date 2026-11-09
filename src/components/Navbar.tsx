import React from 'react';
import {
  GitFork,
  Search,
  UserPlus,
  Sun,
  Moon,
  Download,
  Shield,
  HelpCircle,
  Users,
  Compass,
  Clock,
  Sparkles,
  LayoutDashboard,
  LogOut,
  LogIn,
  AlertCircle,
  FolderPlus,
  ChevronDown,
  Check,
  Database,
  Share2
} from 'lucide-react';
import { FamilyTree, Person } from '../types/genealogy';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  trees: FamilyTree[];
  currentTree: FamilyTree;
  onSelectTree: (treeId: string) => void;
  onOpenNewTreeModal: () => void;
  onDeleteTree?: (treeId: string) => void;
  people: Person[];
  isDemoData: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onOpenAddPerson: () => void;
  onOpenImportExport: () => void;
  onOpenSupabaseModal?: () => void;
  onOpenAuthModal: () => void;
  onOpenHelpModal: () => void;
  onClearDemoData: () => void;
  onRestoreDemoData: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSelectPerson: (personId: string) => void;
  currentUser: { email?: string | null; displayName?: string | null } | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  trees,
  currentTree,
  onSelectTree,
  onOpenNewTreeModal,
  onDeleteTree,
  people,
  isDemoData,
  isDarkMode,
  toggleDarkMode,
  onOpenAddPerson,
  onOpenImportExport,
  onOpenSupabaseModal,
  onOpenAuthModal,
  onOpenHelpModal,
  onClearDemoData,
  onRestoreDemoData,
  searchTerm,
  setSearchTerm,
  onSelectPerson,
  currentUser,
  onLogout,
}) => {
  const [showSearchDropdown, setShowSearchDropdown] = React.useState(false);
  const [showTreeDropdown, setShowTreeDropdown] = React.useState(false);

  const filteredPeople = React.useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return people.filter(p =>
      p.fullName.toLowerCase().includes(term) ||
      (p.nickname && p.nickname.toLowerCase().includes(term)) ||
      (p.birthPlace && p.birthPlace.toLowerCase().includes(term))
    ).slice(0, 6);
  }, [searchTerm, people]);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-200 bg-slate-900/90 border-amber-500/20 text-slate-100">
      {/* Banner de Demonstração quando ativo */}
      {isDemoData && (
        <div className="bg-amber-950/70 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Modo Demonstração:</strong> Explorando a história fictícia da <em>{currentTree.name}</em>.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenNewTreeModal}
              className="text-amber-300 hover:text-amber-100 font-semibold underline transition-colors cursor-pointer"
            >
              + Criar a minha árvore
            </button>
            <span className="text-amber-600">·</span>
            <button
              onClick={onClearDemoData}
              className="text-amber-400/80 hover:text-amber-200 transition-colors cursor-pointer"
            >
              Limpar dados
            </button>
            <span className="text-amber-600">·</span>
            <button
              onClick={onRestoreDemoData}
              className="text-amber-400/80 hover:text-amber-200 transition-colors cursor-pointer"
            >
              Restaurar exemplo
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Marca e Slogan */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40 border border-amber-400/30">
              <GitFork className="w-6 h-6 text-slate-950 rotate-180" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold tracking-tight text-amber-100">
                  Nossa Árvore
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-600/30 font-sans hidden sm:inline-block">
                  Memorial
                </span>
              </div>
              <p className="text-[11px] text-amber-300/70 hidden md:block italic">
                “Cada pessoa é um galho. Cada história mantém nossas raízes vivas.”
              </p>
            </div>
          </div>

          {/* Seletor de Família / Árvores */}
          <div className="relative">
            <button
              onClick={() => setShowTreeDropdown(!showTreeDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-amber-500/30 text-amber-200 text-xs font-medium transition-all shadow-md cursor-pointer hover:border-amber-400"
              title="Alternar entre famílias ou incluir nova árvore"
            >
              <GitFork className="w-3.5 h-3.5 rotate-180 text-amber-400 shrink-0" />
              <div className="text-left hidden sm:block">
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  Família Ativa
                </span>
                <span className="block font-serif font-bold text-amber-100 max-w-[120px] md:max-w-[160px] truncate leading-tight">
                  {currentTree.surname || currentTree.name}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            </button>

            {showTreeDropdown && (
              <div
                className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl p-2.5 z-50 text-left text-xs text-slate-200 animate-fade-in"
                onMouseLeave={() => setShowTreeDropdown(false)}
              >
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <span>Famílias / Árvores ({trees.length})</span>
                </div>

                <div className="my-2 space-y-1 max-h-56 overflow-y-auto pr-1">
                  {trees.map(t => {
                    const isSelected = t.id === currentTree.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          onSelectTree(t.id);
                          setShowTreeDropdown(false);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-serif font-bold text-amber-300 text-xs shrink-0">
                            {t.surname ? t.surname.substring(0, 1) : 'F'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs truncate">
                              {t.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {t.surname || 'Família'}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowTreeDropdown(false);
                      onOpenNewTreeModal();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>+ Incluir Nova Família</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Abas de Navegação Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-amber-100 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Painel
            </button>

            <button
              onClick={() => setCurrentTab('tree')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'tree'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-amber-100 hover:bg-slate-800/60'
              }`}
            >
              <GitFork className="w-4 h-4 rotate-180" />
              Árvore
            </button>

            <button
              onClick={() => setCurrentTab('people')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'people'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-amber-100 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              Familiares ({people.length})
            </button>

            <button
              onClick={() => setCurrentTab('kinship')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'kinship'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-amber-100 hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              Qual o Parentesco?
            </button>

            <button
              onClick={() => setCurrentTab('timeline')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'timeline'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-amber-100 hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              Linha do Tempo
            </button>

            <button
              onClick={() => setCurrentTab('memories')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'memories'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-amber-100 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Memórias
            </button>

            <button
              onClick={() => setCurrentTab('map')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'map'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-amber-100 hover:bg-slate-800/60'
              }`}
            >
              <span>Origens</span>
            </button>
          </nav>

          {/* Campo de Busca Rápida */}
          <div className="relative flex-1 max-w-xs hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Pesquisar familiar por nome ou cidade..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/40 transition-all"
              />
            </div>

            {/* Dropdown de Busca */}
            {showSearchDropdown && searchTerm.trim() && (
              <div
                className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 max-h-72 overflow-y-auto"
                onMouseLeave={() => setShowSearchDropdown(false)}
              >
                <div className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-1">
                  Resultados da pesquisa ({filteredPeople.length})
                </div>
                {filteredPeople.length > 0 ? (
                  filteredPeople.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPerson(p.id);
                        setShowSearchDropdown(false);
                        setSearchTerm('');
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-amber-500/20 text-left transition-colors cursor-pointer group"
                    >
                      <img
                        src={p.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop'}
                        alt={p.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-amber-400/30"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-100 group-hover:text-amber-200 truncate">
                          {p.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {p.birthDate ? p.birthDate.substring(0, 4) : 'Ano desconhecido'}
                          {p.deathDate ? ` — ${p.deathDate.substring(0, 4)}` : (p.isLiving ? ' — Presente' : '')}
                          {p.birthPlace ? ` · ${p.birthPlace}` : ''}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 p-3 text-center">
                    Nenhum familiar encontrado com esse nome.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões de Ação Direita */}
          <div className="flex items-center gap-2">
            
            {/* Adicionar Familiar CTA */}
            <button
              onClick={onOpenAddPerson}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs shadow-md shadow-amber-950/30 border border-amber-400/40 transition-all cursor-pointer"
              title="Cadastrar novo familiar na árvore"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar Familiar</span>
            </button>

            {/* Importar / Exportar */}
            <button
              onClick={onOpenImportExport}
              className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 hover:border-amber-400/40 text-slate-300 hover:text-amber-200 transition-colors cursor-pointer"
              title="Importar, Exportar ou Imprimir Árvore"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Compartilhar Link */}
            <button
              onClick={() => {
                const url = 'https://ais-pre-natsptp33ob57cmo6yn26r-274188502497.us-east1.run.app';
                navigator.clipboard.writeText(url);
                alert(`Link de compartilhamento copiado para a área de transferência:\n\n${url}`);
              }}
              className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 hover:border-emerald-400/50 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
              title="Copiar Link para Compartilhar com Familiares"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Supabase Cloud Database */}
            {onOpenSupabaseModal && (
              <button
                onClick={onOpenSupabaseModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/60 transition-colors cursor-pointer shadow-sm shadow-emerald-950/40"
                title="Banco de Dados Supabase (PostgreSQL na Nuvem)"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300 hidden md:inline">Supabase</span>
              </button>
            )}

            {/* Alternar Tema Claro / Escuro */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 hover:border-amber-400/40 text-slate-300 hover:text-amber-200 transition-colors cursor-pointer"
              title={isDarkMode ? 'Mudar para Modo Claro Pergaminho' : 'Mudar para Modo Noturno Profundo'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-300" />}
            </button>

            {/* Ajuda */}
            <button
              onClick={onOpenHelpModal}
              className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 hover:border-amber-400/40 text-slate-300 hover:text-amber-200 transition-colors cursor-pointer hidden sm:block"
              title="Ajuda e Orientações"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Autenticação / Perfil */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-700">
                <span className="text-xs text-amber-200 font-medium hidden md:inline-block max-w-[120px] truncate">
                  {currentUser.displayName || currentUser.email || 'Usuário'}
                </span>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg bg-slate-800/70 border border-slate-700 hover:border-rose-400/40 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-400/50 text-slate-200 hover:text-amber-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
