import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  ArrowUpDown,
  Eye,
  Edit,
  GitFork,
  Compass,
  AlertTriangle,
  Heart,
  FileText,
  Trash2
} from 'lucide-react';
import { Person } from '../types/genealogy';

interface PeopleListViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onOpenProfile: (person: Person) => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson?: (person: Person) => void;
  onViewInTree: (person: Person) => void;
  onCalculateKinship: (person: Person) => void;
  onOpenAddPerson: () => void;
}

export const PeopleListView: React.FC<PeopleListViewProps> = ({
  people,
  onSelectPerson,
  onOpenProfile,
  onEditPerson,
  onDeletePerson,
  onViewInTree,
  onCalculateKinship,
  onOpenAddPerson,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLiving, setFilterLiving] = useState<'all' | 'living' | 'deceased'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'birth' | 'recent'>('name');

  const filteredPeople = useMemo(() => {
    return people.filter(p => {
      if (filterLiving === 'living' && !p.isLiving) return false;
      if (filterLiving === 'deceased' && p.isLiving) return false;
      if (filterStatus !== 'all' && p.recordStatus !== filterStatus) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = p.fullName.toLowerCase().includes(term);
        const matchNick = (p.nickname || '').toLowerCase().includes(term);
        const matchPlace = (p.birthPlace || '').toLowerCase().includes(term);
        if (!matchName && !matchNick && !matchPlace) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
      if (sortBy === 'birth') return (a.birthDate || '').localeCompare(b.birthDate || '');
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [people, searchTerm, filterLiving, filterStatus, sortBy]);

  const defaultPhoto = (gender: string) =>
    gender === 'F'
      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-amber-100">
            Caderno de Familiares
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {people.length} pessoa(s) registradas nesta árvore familiar.
          </p>
        </div>

        <button
          onClick={onOpenAddPerson}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Familiar</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Condição Vital */}
          <select
            value={filterLiving}
            onChange={e => setFilterLiving(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todas as Condições</option>
            <option value="living">Pessoas Vivas</option>
            <option value="deceased">Em Memória (Falecidas)</option>
          </select>

          {/* Estado do Registro */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="completo">Registros Completos</option>
            <option value="incompleto">Incompletos</option>
            <option value="em_pesquisa">Em Pesquisa</option>
          </select>

          {/* Ordenação */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="name">Ordenar por Nome (A-Z)</option>
            <option value="birth">Ano de Nascimento</option>
            <option value="recent">Adicionados Recentemente</option>
          </select>
        </div>

        {/* Busca */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, apelido ou cidade..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Grid de Cartões de Familiares */}
      {filteredPeople.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map(p => (
            <div
              key={p.id}
              onClick={() => onOpenProfile(p)}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <img
                    src={p.profilePhoto || defaultPhoto(p.gender)}
                    alt={p.fullName}
                    className="w-13 h-13 rounded-full object-cover border-2 border-amber-400/50 group-hover:border-amber-400 transition-colors"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                      p.isLiving ? 'bg-emerald-400' : 'bg-amber-600'
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-serif font-bold text-sm text-slate-100 group-hover:text-amber-200 transition-colors truncate">
                    {p.fullName}
                  </h4>
                  {p.nickname && (
                    <div className="text-[11px] text-amber-300/80 italic truncate">
                      "{p.nickname}"
                    </div>
                  )}

                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {p.birthDate ? p.birthDate.substring(0, 4) : '?'}
                    {p.isLiving ? ' — Presente' : ` — ${p.deathDate ? p.deathDate.substring(0, 4) : '?'}`}
                  </div>

                  {p.birthPlace && (
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {p.birthPlace}
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação Rápida */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewInTree(p);
                  }}
                  className="flex items-center gap-1 text-slate-400 hover:text-amber-300"
                  title="Ver na Árvore"
                >
                  <GitFork className="w-3.5 h-3.5 rotate-180" />
                  <span className="hidden sm:inline">Na Árvore</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCalculateKinship(p);
                  }}
                  className="flex items-center gap-1 text-slate-400 hover:text-amber-300"
                  title="Calcular parentesco"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Parentesco</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPerson(p);
                  }}
                  className="flex items-center gap-1 text-slate-400 hover:text-amber-300 transition-colors"
                  title="Editar dados deste familiar"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                {onDeletePerson && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePerson(p);
                    }}
                    className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Excluir cadastro deste familiar"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Excluir</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
          Nenhum familiar encontrado com esses filtros.
        </div>
      )}

    </div>
  );
};
