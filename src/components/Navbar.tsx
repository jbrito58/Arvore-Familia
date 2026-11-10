import React from 'react';
import {
  GitFork,
  Search,
  UserPlus,
  Sun,
  Moon,
  Download,
  HelpCircle,
  Users,
  Compass,
  Clock,
  Sparkles,
  LayoutDashboard,
  LogOut,
  LogIn,
  FolderPlus,
  ChevronDown,
  Check,
  Database,
  Share2,
  MapPin,
  X
} from 'lucide-react';
import { FamilyTree, Person } from '../types/genealogy';
import { formatLifespan } from '../utils/dateUtils';

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
  const [copiedShare, setCopiedShare] = React.useState(false);

  const filteredPeople = React.useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return people.filter(p =>
      p.fullName.toLowerCase().includes(term) ||
      (p.nickname && p.nickname.toLowerCase().includes(term)) ||
      (p.birthPlace && p.birthPlace.toLowerCase().includes(term))
    ).slice(0, 6);
  }, [searchTerm, people]);

  const handleShareClick = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'tree', label: 'Árvore Genealógica', icon: GitFork, iconClass: 'rotate-180' },
    { id: 'people', label: `Familiares (${people.length})`, icon: Users },
    { id: 'kinship', label: 'Qual o Parentesco?', icon: Compass },
    { id: 'timeline', label: 'Linha do Tempo', icon: Clock },
    { id: 'memories', label: 'Memórias & Fotos', icon: Sparkles },
    { id: 'map', label: 'Mapa de Origens', icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md transition-colors duration-200 bg-slate-900/95 border-b border-amber-500/25 text-slate-100 shadow-xl">
      {/* Banner de Demonstração quando ativo */}
      {isDemoData && (
        <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
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
        </div>
      )}

      {/* Camada Superior: Identidade, Seletor de Família, Busca e Ações Primárias */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3.5 gap-4">
          
          {/* Lado Esquerdo: Marca do Memorial + Seletor de Família */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Logo Memorial */}
            <div
              className="flex items-center gap-3 cursor-pointer select-none group"
              onClick={() => setCurrentTab('dashboard')}
              title="Voltar ao Painel Geral"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-950/50 border border-amber-400/40 group-hover:scale-105 transition-transform">
                <GitFork className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 rotate-180" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-amber-100 group-hover:text-amber-300 transition-colors">
                    Nossa Árvore
                  </span>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 font-semibold hidden sm:inline-block">
                    Memorial
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-amber-300/70 hidden md:block">
                  Preservando histórias & genealogia familiar
                </p>
              </div>
            </div>

            {/* Divisor Vertical */}
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />

            {/* Seletor de Linhagem / Árvores Familiares */}
            <div className="relative">
              <button
                onClick={() => setShowTreeDropdown(!showTreeDropdown)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-750 border border-amber-500/35 hover:border-amber-400 text-amber-200 text-xs font-medium transition-all shadow-md cursor-pointer"
                title="Alternar entre famílias cadastradas ou adicionar nova árvore"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <GitFork className="w-3.5 h-3.5 rotate-180 text-amber-400" />
                </div>
                <div className="text-left hidden sm:block">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    Família Ativa
                  </span>
                  <span className="block font-serif font-bold text-amber-100 max-w-[130px] lg:max-w-[170px] truncate leading-tight">
                    {currentTree.surname || currentTree.name}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-amber-400/80 shrink-0 ml-0.5" />
              </button>

              {showTreeDropdown && (
                <div
                  className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl p-2.5 z-50 text-left text-xs text-slate-200 animate-fade-in"
                  onMouseLeave={() => setShowTreeDropdown(false)}
                >
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
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

          </div>

          {/* Centro: Campo de Busca com Visual Proporcional */}
          <div className="relative flex-1 max-w-sm hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Buscar familiar por nome, apelido ou cidade..."
                className="w-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-8 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown de Resultados da Busca */}
            {showSearchDropdown && searchTerm.trim() && (
              <div
                className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 max-h-72 overflow-y-auto"
                onMouseLeave={() => setShowSearchDropdown(false)}
              >
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
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
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-amber-500/20 text-left transition-colors cursor-pointer group"
                    >
                      <img
                        src={p.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop'}
                        alt={p.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-amber-400/30 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-100 group-hover:text-amber-200 truncate">
                          {p.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {formatLifespan(p.birthDate, p.deathDate, p.isLiving)}
                          {p.birthPlace ? ` · ${p.birthPlace}` : ''}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 p-4 text-center">
                    Nenhum familiar encontrado com esse nome na árvore ativa.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lado Direito: Botão Principal + Grupo de Utilitários + Usuário */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* CTA Primário: Adicionar Familiar */}
            <button
              onClick={onOpenAddPerson}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-950/40 border border-amber-400/40 transition-all cursor-pointer hover:scale-102"
              title="Cadastrar novo familiar nesta árvore"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Adicionar Familiar</span>
            </button>

            {/* Grupo de Utilitários Compacto e Elegante */}
            <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/80 gap-1">
              
              {/* Supabase Cloud */}
              {onOpenSupabaseModal && (
                <button
                  onClick={onOpenSupabaseModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-emerald-950/60 text-emerald-400 hover:text-emerald-200 transition-colors cursor-pointer text-xs font-semibold"
                  title="Banco de Dados Supabase (PostgreSQL na Nuvem Conectado)"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="hidden xl:inline">Supabase</span>
                </button>
              )}

              {/* Compartilhar */}
              <button
                onClick={handleShareClick}
                className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer relative"
                title="Copiar Link para Compartilhar com Familiares"
              >
                <Share2 className="w-4 h-4" />
                {copiedShare && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-emerald-900 border border-emerald-500 text-[10px] text-emerald-200 whitespace-nowrap shadow-lg animate-fade-in">
                    Link copiado!
                  </span>
                )}
              </button>

              {/* Importar / Exportar / Imprimir */}
              <button
                onClick={onOpenImportExport}
                className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-amber-200 transition-colors cursor-pointer"
                title="Importar, Exportar ou Imprimir Árvore"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Alternar Tema Claro / Escuro */}
              <button
                onClick={toggleDarkMode}
                className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-amber-200 transition-colors cursor-pointer"
                title={isDarkMode ? 'Modo Noturno (Clique para alternar)' : 'Modo Claro (Clique para alternar)'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-300" />}
              </button>

              {/* Ajuda */}
              <button
                onClick={onOpenHelpModal}
                className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-amber-200 transition-colors cursor-pointer hidden md:block"
                title="Orientações e Ajuda"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Perfil do Usuário / Login */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-700/80">
                <div
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700"
                  title={`Conectado como ${currentUser.displayName || currentUser.email}`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-[11px] font-bold text-slate-950">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-amber-200 font-medium hidden lg:inline-block max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/50 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Camada Inferior: Barra de Navegação Dedicada (Na Mesma Proporção dos Dados) */}
      <div className="border-t border-amber-500/15 bg-slate-950/60 backdrop-blur-md hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer select-none ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm shadow-amber-950/50'
                      : 'text-slate-300 hover:text-amber-100 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.iconClass || ''} ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-300" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
