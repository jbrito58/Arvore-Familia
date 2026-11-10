import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Compass,
  Users,
  Calendar,
  ExternalLink,
  Info,
  Navigation,
  Globe
} from 'lucide-react';
import { Person, FamilyEvent } from '../types/genealogy';
import { parseDateComponents } from '../utils/dateUtils';

interface FamilyMapProps {
  people: Person[];
  events: FamilyEvent[];
  onOpenProfile: (person: Person) => void;
}

interface LocationCluster {
  name: string;
  count: number;
  peopleBorn: Person[];
  peopleDied: Person[];
  events: FamilyEvent[];
  lat?: number;
  lng?: number;
}

export const FamilyMap: React.FC<FamilyMapProps> = ({
  people,
  events,
  onOpenProfile,
}) => {
  const [selectedClusterName, setSelectedClusterName] = useState<string | null>(null);

  // Agrupamento por Cidades/Localidades
  const clusters: LocationCluster[] = useMemo(() => {
    const map = new Map<string, LocationCluster>();

    const getOrCreate = (rawName: string) => {
      const clean = rawName.trim();
      if (!map.has(clean)) {
        map.set(clean, {
          name: clean,
          count: 0,
          peopleBorn: [],
          peopleDied: [],
          events: [],
        });
      }
      return map.get(clean)!;
    };

    // Nascimentos
    people.forEach(p => {
      if (p.birthPlace) {
        const c = getOrCreate(p.birthPlace);
        c.peopleBorn.push(p);
        c.count++;
      }
      if (p.deathPlace) {
        const c = getOrCreate(p.deathPlace);
        c.peopleDied.push(p);
        c.count++;
      }
    });

    // Eventos
    events.forEach(ev => {
      if (ev.location) {
        const c = getOrCreate(ev.location);
        c.events.push(ev);
        c.count++;
        if (ev.latitude && ev.longitude) {
          c.lat = ev.latitude;
          c.lng = ev.longitude;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [people, events]);

  const activeCluster = useMemo(() => {
    if (!selectedClusterName) return clusters[0] || null;
    return clusters.find(c => c.name === selectedClusterName) || clusters[0] || null;
  }, [clusters, selectedClusterName]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cabeçalho */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 mb-3 shadow-lg shadow-cyan-950/20">
          <Globe className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-amber-100">
          Mapa de Origens & Veredas
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2">
          Conheça as cidades, estados e países por onde sua família construiu histórias, migrou e fincou raízes.
        </p>
      </div>

      {/* Grid Principal: Lista de Polos de Origem à Esquerda + Visualizador Cartográfico Interativo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lista de Cidades e Polos */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider px-2">
            Polos Familiares Registrados ({clusters.length})
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {clusters.map(cluster => {
              const isSelected = activeCluster?.name === cluster.name;
              return (
                <div
                  key={cluster.name}
                  onClick={() => setSelectedClusterName(cluster.name)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400/70 shadow-lg text-amber-200'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="font-medium text-xs truncate">{cluster.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0">
                      {cluster.count} {cluster.count === 1 ? 'fato' : 'fatos'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1 pl-6">
                    {cluster.peopleBorn.length > 0 && `${cluster.peopleBorn.length} nascimentos · `}
                    {cluster.peopleDied.length > 0 && `${cluster.peopleDied.length} falecimentos · `}
                    {cluster.events.length > 0 && `${cluster.events.length} acontecimentos`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visualizador de Detalhes da Localidade Selecionada */}
        <div className="lg:col-span-2 space-y-6">
          {activeCluster ? (
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl backdrop-blur-md space-y-6">
              
              {/* Topo do Local */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-amber-100">
                      {activeCluster.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {activeCluster.count} registros e memórias vinculadas a esta localidade
                    </p>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeCluster.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <span>Abrir no Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Pessoas Nascidas Nesta Localidade */}
              {activeCluster.peopleBorn.length > 0 && (
                <div>
                  <h4 className="font-serif text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">
                    Nascidos Aqui ({activeCluster.peopleBorn.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeCluster.peopleBorn.map(p => (
                      <div
                        key={p.id}
                        onClick={() => onOpenProfile(p)}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-400 cursor-pointer transition-colors"
                      >
                        <img
                          src={p.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop'}
                          alt={p.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-emerald-400/40"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-100 truncate">{p.fullName}</div>
                          <div className="text-[10px] text-slate-400">
                            Nascimento: {parseDateComponents(p.birthDate).yearStr || 'Ano desconhecido'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Falecimentos Registrados Aqui */}
              {activeCluster.peopleDied.length > 0 && (
                <div>
                  <h4 className="font-serif text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                    Falecidos ou Sepultados Aqui ({activeCluster.peopleDied.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeCluster.peopleDied.map(p => (
                      <div
                        key={p.id}
                        onClick={() => onOpenProfile(p)}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-400 cursor-pointer transition-colors"
                      >
                        <img
                          src={p.profilePhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop'}
                          alt={p.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-amber-600/40"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-100 truncate">{p.fullName}</div>
                          <div className="text-[10px] text-slate-400">
                            Falecimento: {parseDateComponents(p.deathDate).yearStr || 'Ano desconhecido'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acontecimentos Históricos no Local */}
              {activeCluster.events.length > 0 && (
                <div>
                  <h4 className="font-serif text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
                    Acontecimentos Registrados ({activeCluster.events.length})
                  </h4>
                  <div className="space-y-2">
                    {activeCluster.events.map(ev => (
                      <div key={ev.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
                        <div className="font-bold text-slate-100">{ev.title}</div>
                        <div className="text-[11px] text-amber-300/80 font-mono mt-0.5">{ev.date || ''}</div>
                        {ev.description && (
                          <p className="text-[11px] text-slate-300 mt-1">{ev.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              Nenhuma localidade registrada ainda.
            </div>
          )}

          {/* Guia de Integração Real com Google Maps */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Instruções para Ativação da API de Google Maps</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O aplicativo já calcula coordenadas geográficas e agrupa polos familiares dinamicamente. Para renderizar o mapa interativo vetorial completo via satélite, configure a variável <code className="text-amber-300">VITE_GOOGLE_MAPS_API_KEY</code> no seu arquivo de ambiente <code className="text-amber-300">.env</code> e ative o serviço no Google Cloud Console.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
