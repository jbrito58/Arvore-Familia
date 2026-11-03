import React, { useState, useMemo } from 'react';
import {
  Compass,
  ArrowRight,
  GitFork,
  Users,
  Search,
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';
import { Person, Relationship, KinshipResult } from '../types/genealogy';
import { calculateKinship } from '../services/genealogyEngine';

interface KinshipCalculatorProps {
  people: Person[];
  relationships: Relationship[];
  initialPerson1Id?: string | null;
  initialPerson2Id?: string | null;
  onOpenProfile: (person: Person) => void;
}

export const KinshipCalculator: React.FC<KinshipCalculatorProps> = ({
  people,
  relationships,
  initialPerson1Id,
  initialPerson2Id,
  onOpenProfile,
}) => {
  const [person1Id, setPerson1Id] = useState<string>(
    initialPerson1Id || (people[0]?.id || '')
  );
  const [person2Id, setPerson2Id] = useState<string>(
    initialPerson2Id || (people[1]?.id || (people[0]?.id || ''))
  );

  const kinshipResult: KinshipResult | null = useMemo(() => {
    if (!person1Id || !person2Id) return null;
    return calculateKinship(person1Id, person2Id, people, relationships);
  }, [person1Id, person2Id, people, relationships]);

  const person1 = people.find(p => p.id === person1Id);
  const person2 = people.find(p => p.id === person2Id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-400 mb-3 shadow-lg shadow-amber-950/20">
          <Compass className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-amber-100">
          Qual é o Parentesco?
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2">
          Selecione dois familiares para descobrir o vínculo de sangue ou afinidade, o caminho na árvore e o ancestral comum.
        </p>
      </div>

      {/* Seletores das Duas Pessoas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl backdrop-blur-md">
        
        {/* Pessoa 1 */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300">
            Primeiro Familiar (Ponto de Partida)
          </label>
          <select
            value={person1Id}
            onChange={e => setPerson1Id(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
          >
            {people.map(p => (
              <option key={p.id} value={p.id}>
                {p.fullName} {p.birthDate ? `(${p.birthDate.substring(0, 4)})` : ''}
              </option>
            ))}
          </select>

          {person1 && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <img
                src={person1.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop'}
                alt={person1.fullName}
                className="w-12 h-12 rounded-full object-cover border border-amber-400/40"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-100 truncate">{person1.fullName}</div>
                <div className="text-[11px] text-slate-400">
                  {person1.birthDate ? person1.birthDate.substring(0, 4) : 'Ano não informado'}
                  {person1.birthPlace ? ` · ${person1.birthPlace}` : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pessoa 2 */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300">
            Segundo Familiar (Ponto de Chegada)
          </label>
          <select
            value={person2Id}
            onChange={e => setPerson2Id(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
          >
            {people.map(p => (
              <option key={p.id} value={p.id}>
                {p.fullName} {p.birthDate ? `(${p.birthDate.substring(0, 4)})` : ''}
              </option>
            ))}
          </select>

          {person2 && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <img
                src={person2.profilePhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop'}
                alt={person2.fullName}
                className="w-12 h-12 rounded-full object-cover border border-amber-400/40"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-100 truncate">{person2.fullName}</div>
                <div className="text-[11px] text-slate-400">
                  {person2.birthDate ? person2.birthDate.substring(0, 4) : 'Ano não informado'}
                  {person2.birthPlace ? ` · ${person2.birthPlace}` : ''}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Resultado da Pesquisa Genealógica */}
      {kinshipResult ? (
        <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase font-semibold text-amber-400 tracking-widest">
              Resultado Genealógico
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-amber-200">
              {kinshipResult.person2.fullName} é <span className="text-amber-400 underline decoration-amber-500/40">{kinshipResult.relationshipName}</span> de {kinshipResult.person1.fullName}
            </h3>
            <p className="text-xs text-slate-400">
              Conexão encontrada com {kinshipResult.stepsCount} {kinshipResult.stepsCount === 1 ? 'vínculo direto' : 'vínculos familiares intermédios'}.
            </p>
          </div>

          {/* Caminho Visual Passo-a-Passo */}
          <div className="pt-6 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">
              Caminho Genealógico Passo a Passo
            </div>

            <div className="flex items-center justify-center flex-wrap gap-3">
              {kinshipResult.path.map((step, idx) => (
                <React.Fragment key={step.person.id + '-' + idx}>
                  <div
                    onClick={() => onOpenProfile(step.person)}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-amber-400 cursor-pointer transition-colors shadow-md group"
                  >
                    <img
                      src={step.person.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop'}
                      alt={step.person.fullName}
                      className="w-9 h-9 rounded-full object-cover border border-amber-400/40 group-hover:border-amber-400"
                    />
                    <div className="text-left">
                      <div className="text-xs font-semibold text-amber-100 group-hover:text-amber-300">
                        {step.person.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {step.person.birthDate ? step.person.birthDate.substring(0, 4) : ''}
                      </div>
                    </div>
                  </div>

                  {idx < kinshipResult.path.length - 1 && (
                    <div className="flex flex-col items-center justify-center px-1 text-amber-400">
                      <ArrowRight className="w-4 h-4" />
                      <span className="text-[10px] text-amber-300/80 font-medium">
                        {step.relationToNext}
                      </span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
          <Info className="w-8 h-8 text-amber-400/60 mx-auto" />
          <p className="font-medium text-slate-300">
            Nenhum vínculo direto encontrado entre estas duas pessoas na árvore.
          </p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Certifique-se de que os pais, cônjuges ou filhos intermediários foram cadastrados para conectar os ramos familiares.
          </p>
        </div>
      )}

    </div>
  );
};
