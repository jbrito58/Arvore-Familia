import React, { useMemo } from 'react';
import {
  GitFork,
  UserPlus,
  Users,
  Sparkles,
  Calendar,
  Clock,
  Compass,
  FileText,
  MapPin,
  Heart,
  ArrowRight,
  Cake,
  TrendingUp,
  ShieldCheck,
  FolderPlus
} from 'lucide-react';
import { Person, Relationship, FamilyEvent, FamilyMedia, FamilyTree } from '../types/genealogy';
import { PersonCard } from './PersonCard';

interface DashboardProps {
  currentTree: FamilyTree;
  people: Person[];
  relationships: Relationship[];
  events: FamilyEvent[];
  media: FamilyMedia[];
  onOpenTree: () => void;
  onOpenAddPerson: () => void;
  onOpenNewTreeModal?: () => void;
  onSelectPerson: (person: Person) => void;
  onOpenProfile: (person: Person) => void;
  setCurrentTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentTree,
  people,
  relationships,
  events,
  media,
  onOpenTree,
  onOpenAddPerson,
  onOpenNewTreeModal,
  onSelectPerson,
  onOpenProfile,
  setCurrentTab,
}) => {
  // Cálculo real da quantidade de gerações
  const generationCount = useMemo(() => {
    if (people.length === 0) return 0;
    if (relationships.length === 0) return 1;

    // Achar o maior caminho pai -> filho
    const childMap = new Map<string, string[]>();
    relationships
      .filter(r => r.relationshipType === 'parent')
      .forEach(r => {
        if (!childMap.has(r.person1Id)) childMap.set(r.person1Id, []);
        childMap.get(r.person1Id)!.push(r.person2Id);
      });

    let maxDepth = 1;
    const memo = new Map<string, number>();

    const getDepth = (id: string, visited = new Set<string>()): number => {
      if (visited.has(id)) return 1;
      if (memo.has(id)) return memo.get(id)!;
      visited.add(id);

      const children = childMap.get(id) || [];
      if (children.length === 0) return 1;

      let sub = 0;
      for (const c of children) {
        sub = Math.max(sub, getDepth(c, new Set(visited)));
      }
      const d = 1 + sub;
      memo.set(id, d);
      return d;
    };

    people.forEach(p => {
      maxDepth = Math.max(maxDepth, getDepth(p.id));
    });

    return maxDepth;
  }, [people, relationships]);

  // Contagem de fotos e documentos reais
  const photoCount = useMemo(() => {
    return media.filter(m => m.fileType === 'photo').length;
  }, [media]);

  const docCount = useMemo(() => {
    return media.filter(m => m.fileType !== 'photo').length;
  }, [media]);

  // Próximos Aniversários reais (considerando mês e dia em pessoas vivas)
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    return people
      .filter(p => p.isLiving && p.birthDate && p.birthDate.length >= 10)
      .map(p => {
        const parts = p.birthDate!.split('-');
        const birthMonth = parseInt(parts[1], 10);
        const birthDay = parseInt(parts[2], 10);
        const birthYear = parseInt(parts[0], 10);
        const turningAge = today.getFullYear() - birthYear;

        // Dias até o aniversário
        let diffDays = (birthMonth - currentMonth) * 30 + (birthDay - currentDay);
        if (diffDays < 0) diffDays += 365;

        return {
          person: p,
          birthMonth,
          birthDay,
          turningAge,
          diffDays,
          formattedDate: `${birthDay.toString().padStart(2, '0')}/${birthMonth.toString().padStart(2, '0')}`,
        };
      })
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 4);
  }, [people]);

  // Pessoas adicionadas recentemente
  const recentPeople = useMemo(() => {
    return [...people]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [people]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Banner Hero com Imagem de Capa e Slogan */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay"
          style={{
            backgroundImage: `url(${currentTree.coverImage || 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1200&auto=format&fit=crop'})`,
          }}
        />
        <div className="relative p-6 sm:p-10 z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs uppercase tracking-widest font-semibold text-amber-400">
              Memorial & Genealogia Familiar
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-amber-100 tracking-tight">
              {currentTree.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              “{currentTree.description || 'Cada pessoa é um galho. Cada história mantém nossas raízes vivas.'}”
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenTree}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-xl shadow-amber-950/40 cursor-pointer transition-transform hover:scale-102"
            >
              <GitFork className="w-4 h-4 rotate-180" />
              <span>Abrir Árvore Interativa</span>
            </button>

            <button
              onClick={onOpenAddPerson}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-amber-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Adicionar Familiar</span>
            </button>

            {onOpenNewTreeModal && (
              <button
                onClick={onOpenNewTreeModal}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold cursor-pointer transition-colors"
                title="Cadastrar uma nova linhagem ou árvore familiar"
              >
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>+ Nova Família</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Indicadores Reais (Sem dados fictícios na contagem) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pessoas Cadastradas</span>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-slate-100 mt-2">
            {people.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {people.filter(p => p.isLiving).length} vivas · {people.filter(p => !p.isLiving).length} em memória
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Gerações Identificadas</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-slate-100 mt-2">
            {generationCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Bisavós a bisnetos conectados
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Fotografias Históricas</span>
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-slate-100 mt-2">
            {photoCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Retratos preservados no memorial
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Documentos & Certidões</span>
            <FileText className="w-5 h-5 text-rose-400" />
          </div>
          <div className="font-serif text-3xl font-bold text-slate-100 mt-2">
            {docCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Receitas, cartas e certidões
          </div>
        </div>
      </div>

      {/* Grid Central: Próximos Aniversários & Pessoas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Próximos Aniversários Reais */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cake className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif text-base font-bold text-amber-100">
                Próximos Aniversários
              </h3>
            </div>
            <span className="text-[10px] uppercase font-semibold text-slate-500">
              Familiares Vivos
            </span>
          </div>

          {upcomingBirthdays.length > 0 ? (
            <div className="space-y-3">
              {upcomingBirthdays.map(({ person, formattedDate, turningAge, diffDays }) => (
                <div
                  key={person.id}
                  onClick={() => onOpenProfile(person)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-400/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={person.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop'}
                      alt={person.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-amber-400/40"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-100">{person.fullName}</div>
                      <div className="text-[11px] text-slate-400">
                        Fará {turningAge} anos em {formattedDate}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-300">
                      {diffDays === 0 ? 'Hoje! 🎉' : `em ${diffDays} dias`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 p-6 text-center">
              Nenhum aniversário cadastrado com data completa para os próximos meses.
            </div>
          )}
        </div>

        {/* Familiares Registrados Recentemente */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="font-serif text-base font-bold text-amber-100">
                Pessoas no Memorial Familiar
              </h3>
            </div>
            <button
              onClick={() => setCurrentTab('people')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              <span>Ver todas ({people.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentPeople.map(p => (
              <div
                key={p.id}
                onClick={() => onOpenProfile(p)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop'}
                    alt={p.fullName}
                    className="w-11 h-11 rounded-full object-cover border border-amber-400/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-100 truncate">{p.fullName}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {p.birthDate ? p.birthDate.substring(0, 4) : 'Ano desconhecido'}
                      {p.deathDate ? ` — ${p.deathDate.substring(0, 4)}` : (p.isLiving ? ' — Presente' : '')}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Atalhos Rápidos para Ferramentas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentTab('kinship')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 shadow-lg text-left transition-all hover:-translate-y-0.5 cursor-pointer group"
        >
          <Compass className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-serif text-sm font-bold text-amber-100">
            Qual é o Parentesco?
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Descubra o vínculo e o caminho entre quaisquer dois parentes.
          </p>
        </button>

        <button
          onClick={() => setCurrentTab('timeline')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 shadow-lg text-left transition-all hover:-translate-y-0.5 cursor-pointer group"
        >
          <Clock className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-serif text-sm font-bold text-amber-100">
            Linha do Tempo
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Veja casamentos, migrações e acontecimentos em ordem cronológica.
          </p>
        </button>

        <button
          onClick={() => setCurrentTab('memories')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 shadow-lg text-left transition-all hover:-translate-y-0.5 cursor-pointer group"
        >
          <Sparkles className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="font-serif text-sm font-bold text-amber-100">
            Galeria de Memórias
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Explore fotografias antigas, cartas e o caderno de receitas.
          </p>
        </button>
      </div>

    </div>
  );
};
