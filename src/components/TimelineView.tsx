import React, { useState, useMemo } from 'react';
import {
  Clock,
  Filter,
  Calendar,
  MapPin,
  Heart,
  Briefcase,
  GraduationCap,
  Home,
  User,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';
import { FamilyEvent, Person, EventType } from '../types/genealogy';
import { parseDateComponents } from '../utils/dateUtils';

interface TimelineViewProps {
  events: FamilyEvent[];
  people: Person[];
  onOpenProfile: (person: Person) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  people,
  onOpenProfile,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Sintetizar eventos de nascimento e falecimento das pessoas caso não existam explicitamente
  const allChronologicalEvents = useMemo(() => {
    const list: Array<FamilyEvent & { relatedPeople: Person[] }> = [];

    // Adicionar eventos manuais
    events.forEach(ev => {
      const related = people.filter(p => ev.personIds?.includes(p.id));
      list.push({ ...ev, relatedPeople: related });
    });

    // Adicionar nascimentos automáticos das pessoas para enriquecer a linha do tempo familiar
    people.forEach(p => {
      if (p.birthDate && !events.some(e => e.eventType === 'birth' && e.personIds?.includes(p.id))) {
        list.push({
          id: `birth-${p.id}`,
          treeId: p.treeId,
          personIds: [p.id],
          eventType: 'birth',
          title: `Nascimento de ${p.fullName}`,
          date: p.birthDate,
          location: p.birthPlace,
          description: p.birthDateApproximate ? 'Data aproximada de nascimento.' : 'Nascimento registrado na família.',
          createdAt: p.createdAt,
          relatedPeople: [p],
        });
      }

      if (!p.isLiving && p.deathDate && !events.some(e => e.eventType === 'death' && e.personIds?.includes(p.id))) {
        list.push({
          id: `death-${p.id}`,
          treeId: p.treeId,
          personIds: [p.id],
          eventType: 'death',
          title: `Falecimento de ${p.fullName}`,
          date: p.deathDate,
          location: p.deathPlace,
          description: p.burialPlace ? `Sepultamento em: ${p.burialPlace}` : 'Em memória eterna.',
          createdAt: p.createdAt,
          relatedPeople: [p],
        });
      }
    });

    // Ordenar cronologicamente de forma robusta
    return list.sort((a, b) => {
      const pa = parseDateComponents(a.date);
      const pb = parseDateComponents(b.date);
      const ya = pa.year ?? 0;
      const yb = pb.year ?? 0;
      if (ya !== yb) return ya - yb;
      const ma = pa.month ?? 0;
      const mb = pb.month ?? 0;
      if (ma !== mb) return ma - mb;
      const da = pa.day ?? 0;
      const db = pb.day ?? 0;
      return da - db;
    });
  }, [events, people]);

  // Filtragem
  const filteredEvents = useMemo(() => {
    return allChronologicalEvents.filter(ev => {
      if (selectedType !== 'all' && ev.eventType !== selectedType) return false;
      if (selectedPersonId !== 'all' && !ev.personIds?.includes(selectedPersonId)) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(term);
        const matchLoc = (ev.location || '').toLowerCase().includes(term);
        const matchDesc = (ev.description || '').toLowerCase().includes(term);
        const matchPeople = ev.relatedPeople.some(p => p.fullName.toLowerCase().includes(term));
        if (!matchTitle && !matchLoc && !matchDesc && !matchPeople) return false;
      }
      return true;
    });
  }, [allChronologicalEvents, selectedType, selectedPersonId, searchTerm]);

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'birth':
        return <User className="w-4 h-4 text-emerald-400" />;
      case 'wedding':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'relocation':
        return <Home className="w-4 h-4 text-cyan-400" />;
      case 'education':
        return <GraduationCap className="w-4 h-4 text-amber-400" />;
      case 'career':
        return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'death':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cabeçalho */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-950/20">
          <Clock className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-amber-100">
          Linha do Tempo Familiar
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2">
          Reviva a história da família em ordem cronológica: nascimentos, bodas, migrações e momentos inesquecíveis.
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por Tipo */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todos os Acontecimentos</option>
            <option value="birth">Nascimentos</option>
            <option value="wedding">Casamentos & Bodas</option>
            <option value="relocation">Mudanças de Cidade</option>
            <option value="education">Formaturas & Estudos</option>
            <option value="career">Trabalho & Vocação</option>
            <option value="death">Falecimentos</option>
          </select>

          {/* Filtro por Pessoa */}
          <select
            value={selectedPersonId}
            onChange={e => setSelectedPersonId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todos os Familiares</option>
            {people.map(p => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Busca por texto */}
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filtrar por local ou fato..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Lista da Linha do Tempo */}
      <div className="relative border-l-2 border-amber-500/30 ml-4 sm:ml-8 pl-6 sm:pl-8 space-y-8 py-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map(ev => (
            <div key={ev.id} className="relative group">
              {/* Marcador na Linha */}
              <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 w-8 h-8 rounded-full bg-slate-900 border-2 border-amber-400/80 flex items-center justify-center shadow-lg shadow-amber-950/40 group-hover:scale-110 transition-transform">
                {getEventIcon(ev.eventType)}
              </div>

              {/* Cartão do Acontecimento */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-colors shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-amber-300">
                    {ev.date || 'Data histórica'}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    {ev.eventType}
                  </span>
                </div>

                <h4 className="font-serif text-lg font-bold text-slate-100 group-hover:text-amber-200 transition-colors">
                  {ev.title}
                </h4>

                {ev.location && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{ev.location}</span>
                  </div>
                )}

                {ev.description && (
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {ev.description}
                  </p>
                )}

                {/* Pessoas Vinculadas */}
                {ev.relatedPeople.length > 0 && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 flex-wrap">
                    <span className="text-[11px] text-slate-500">Envolvidos:</span>
                    {ev.relatedPeople.map(p => (
                      <button
                        key={p.id}
                        onClick={() => onOpenProfile(p)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-200 transition-colors"
                      >
                        <img
                          src={p.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop'}
                          alt={p.fullName}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>{p.fullName}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}

              </div>
            </div>
          ))
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
            Nenhum evento encontrado para os filtros selecionados.
          </div>
        )}
      </div>

    </div>
  );
};
