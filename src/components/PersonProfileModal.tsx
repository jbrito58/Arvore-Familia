import React, { useState } from 'react';
import {
  X,
  Edit,
  UserPlus,
  Compass,
  GitFork,
  Calendar,
  MapPin,
  Heart,
  FileText,
  Clock,
  Trash2,
  Share2,
  Users,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Camera
} from 'lucide-react';
import { Person, Relationship, FamilyEvent, FamilyMedia } from '../types/genealogy';
import { getParents, getChildren, getSpouses, getSiblings } from '../services/genealogyEngine';

interface PersonProfileModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (person: Person) => void;
  onDelete: (personId: string) => void;
  onViewInTree: (person: Person) => void;
  onCalculateKinship: (person: Person) => void;
  onSelectRelative: (person: Person) => void;
  onAddRelative: (person: Person, type: 'parent' | 'child' | 'spouse') => void;
  people: Person[];
  relationships: Relationship[];
  events: FamilyEvent[];
  media: FamilyMedia[];
}

export const PersonProfileModal: React.FC<PersonProfileModalProps> = ({
  person,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onViewInTree,
  onCalculateKinship,
  onSelectRelative,
  onAddRelative,
  people,
  relationships,
  events,
  media,
}) => {
  const [activeTab, setActiveTab] = useState<'bio' | 'family' | 'timeline' | 'gallery'>('bio');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !person) return null;

  const parents = getParents(person.id, relationships, people);
  const children = getChildren(person.id, relationships, people);
  const spouses = getSpouses(person.id, relationships, people);
  const siblings = getSiblings(person.id, relationships, people);

  // Filtrar eventos da pessoa
  const personEvents = events
    .filter(ev => ev.personIds?.includes(person.id))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  // Filtrar fotos e documentos
  const personMedia = media.filter(m => m.personIds?.includes(person.id));

  const defaultPhoto = person.gender === 'F'
    ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Banner Superior com Foto e Resumo */}
        <div className="relative bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 p-6 pb-4 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Retrato com Atalho de Edição */}
            <div
              onClick={() => onEdit(person)}
              className="relative shrink-0 group cursor-pointer"
              title="Clique para editar cadastro ou alterar foto"
            >
              <img
                src={person.profilePhoto || defaultPhoto}
                alt={person.fullName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-amber-400 shadow-xl shadow-amber-950/50 group-hover:brightness-90 transition-all"
              />
              <div className="absolute inset-0 rounded-full bg-slate-950/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-amber-200 text-[10px] font-semibold transition-opacity">
                <Camera className="w-5 h-5 mb-0.5 text-amber-300" />
                <span>Alterar foto</span>
              </div>
              <span
                className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                  person.isLiving ? 'bg-emerald-500' : 'bg-amber-600'
                }`}
                title={person.isLiving ? 'Pessoa Viva' : 'Falecido'}
              >
                <span className="w-2 h-2 rounded-full bg-white" />
              </span>
            </div>

            {/* Identidade */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="font-serif text-2xl font-bold text-amber-100">
                  {person.fullName}
                </h2>
                {person.nickname && (
                  <span className="text-sm font-sans text-amber-300 italic">
                    “{person.nickname}”
                  </span>
                )}
              </div>

              {/* Linha vital de datas e lugares */}
              <div className="text-xs text-slate-300 mt-2 space-y-1 font-mono">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Nascimento: {person.birthDate || 'Data desconhecida'}
                    {person.birthDateApproximate && ' (Aprox.)'}
                    {person.birthPlace && ` em ${person.birthPlace}`}
                  </span>
                </div>

                {!person.isLiving && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-200/90">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      Falecimento: {person.deathDate || 'Data desconhecida'}
                      {person.deathPlace && ` em ${person.deathPlace}`}
                    </span>
                  </div>
                )}
                {person.burialPlace && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-400 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Sepultamento: {person.burialPlace}</span>
                  </div>
                )}
              </div>

              {/* Botões de Ações do Perfil */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                <button
                  onClick={() => onViewInTree(person)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-500/40 transition-colors"
                >
                  <GitFork className="w-3.5 h-3.5 rotate-180" />
                  <span>Ver na Árvore</span>
                </button>

                <button
                  onClick={() => onEdit(person)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                <button
                  onClick={() => onCalculateKinship(person)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Qual o Parentesco?</span>
                </button>

                <button
                  onClick={() => setConfirmDelete(!confirmDelete)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 hover:text-rose-100 text-xs font-semibold border border-rose-800/60 transition-colors cursor-pointer"
                  title="Excluir cadastro deste familiar"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Excluir Cadastro</span>
                </button>
              </div>

              {/* Confirmação de Exclusão */}
              {confirmDelete && (
                <div className="mt-4 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 space-y-3 shadow-xl">
                  <div className="flex items-start gap-2.5">
                    <Trash2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-100">
                        Confirmar exclusão de {person.fullName}?
                      </div>
                      <p className="text-[11px] text-rose-300/90 mt-1 leading-relaxed">
                        Esta ação removerá permanentemente o cadastro desta pessoa. Os demais familiares continuarão na árvore sem serem afetados.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-900/60">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDelete(false);
                        onDelete(person.id);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      Sim, Excluir Cadastro
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Abas de Navegação Interna do Perfil */}
          <div className="flex gap-2 mt-6 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('bio')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'bio'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Biografia & Histórias
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'family'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Família Imediata ({parents.length + spouses.length + children.length + siblings.length})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Linha do Tempo ({personEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'gallery'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Memórias & Documentos ({personMedia.length})
            </button>
          </div>
        </div>

        {/* Conteúdo da Aba */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ABA BIOGRAFIA */}
          {activeTab === 'bio' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-serif text-sm font-semibold text-amber-200 mb-2">
                  Memória e Trajetória de Vida
                </h4>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {person.biography || 'Nenhuma biografia registrada ainda para este familiar. Clique em "Editar" para eternizar histórias, vocações e causos.'}
                </div>
              </div>

              {person.notes && (
                <div>
                  <h4 className="font-serif text-sm font-semibold text-amber-200 mb-2">
                    Notas Genealógicas e Tradições
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    {person.notes}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-950/30 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Registro criado em: {new Date(person.createdAt).toLocaleDateString('pt-BR')}</span>
                <span>Última atualização: {new Date(person.updatedAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          )}

          {/* ABA FAMÍLIA IMEDIATA */}
          {activeTab === 'family' && (
            <div className="space-y-5">
              
              {/* Pais */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-serif text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Pais ({parents.length})
                  </h4>
                  <button
                    onClick={() => onAddRelative(person, 'parent')}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    + Vincular Pai/Mãe
                  </button>
                </div>
                {parents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {parents.map(p => (
                      <div
                        key={p.id}
                        onClick={() => onSelectRelative(p)}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={p.profilePhoto || defaultPhoto}
                            alt={p.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-amber-400/40"
                          />
                          <div>
                            <div className="text-xs font-semibold text-slate-100">{p.fullName}</div>
                            <div className="text-[10px] text-slate-400">
                              {p.birthDate ? p.birthDate.substring(0, 4) : '?'} — {p.deathDate ? p.deathDate.substring(0, 4) : (p.isLiving ? 'Presente' : '?')}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                    Pais ainda não cadastrados.
                  </div>
                )}
              </div>

              {/* Cônjuges */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-serif text-xs font-bold text-rose-300 uppercase tracking-wider">
                    Cônjuge e Uniões ({spouses.length})
                  </h4>
                  <button
                    onClick={() => onAddRelative(person, 'spouse')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
                  >
                    + Adicionar Cônjuge
                  </button>
                </div>
                {spouses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {spouses.map(({ person: sp, isCurrent }) => (
                      <div
                        key={sp.id}
                        onClick={() => onSelectRelative(sp)}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={sp.profilePhoto || defaultPhoto}
                            alt={sp.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-rose-400/40"
                          />
                          <div>
                            <div className="text-xs font-semibold text-slate-100">{sp.fullName}</div>
                            <div className="text-[10px] text-slate-400">
                              {isCurrent ? 'União atual' : 'União anterior'}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                    Nenhum cônjuge cadastrado.
                  </div>
                )}
              </div>

              {/* Filhos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-serif text-xs font-bold text-blue-300 uppercase tracking-wider">
                    Filhos ({children.length})
                  </h4>
                  <button
                    onClick={() => onAddRelative(person, 'child')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                  >
                    + Adicionar Filho(a)
                  </button>
                </div>
                {children.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {children.map(c => (
                      <div
                        key={c.id}
                        onClick={() => onSelectRelative(c)}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={c.profilePhoto || defaultPhoto}
                            alt={c.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-blue-400/40"
                          />
                          <div>
                            <div className="text-xs font-semibold text-slate-100">{c.fullName}</div>
                            <div className="text-[10px] text-slate-400">
                              Nascido em {c.birthDate ? c.birthDate.substring(0, 4) : 'Ano desconhecido'}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                    Nenhum filho cadastrado.
                  </div>
                )}
              </div>

              {/* Irmãos */}
              <div>
                <h4 className="font-serif text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                  Irmãos ({siblings.length})
                </h4>
                {siblings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {siblings.map(s => (
                      <div
                        key={s.id}
                        onClick={() => onSelectRelative(s)}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={s.profilePhoto || defaultPhoto}
                            alt={s.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-amber-400/40"
                          />
                          <div>
                            <div className="text-xs font-semibold text-slate-100">{s.fullName}</div>
                            <div className="text-[10px] text-slate-400">Irmão(ã)</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                    Nenhum irmão identificado até o momento.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ABA LINHA DO TEMPO */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {personEvents.length > 0 ? (
                <div className="relative border-l-2 border-amber-500/40 ml-4 space-y-6 pl-6 py-2">
                  {personEvents.map(ev => (
                    <div key={ev.id} className="relative">
                      {/* Marcador Dourado */}
                      <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-900" />
                      <div>
                        <span className="text-[11px] font-mono text-amber-300 font-semibold">
                          {ev.date || 'Data aproximada'}
                        </span>
                        <h5 className="font-serif text-sm font-bold text-slate-100 mt-0.5">
                          {ev.title}
                        </h5>
                        {ev.location && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{ev.location}</span>
                          </div>
                        )}
                        {ev.description && (
                          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
                  Nenhum acontecimento registrado ainda na linha do tempo desta pessoa.
                </div>
              )}
            </div>
          )}

          {/* ABA GALERIA & MEMÓRIAS */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {personMedia.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {personMedia.map(m => (
                    <div
                      key={m.id}
                      className="rounded-2xl bg-slate-950/70 border border-slate-800 overflow-hidden shadow-lg group hover:border-amber-400/50 transition-colors"
                    >
                      <img
                        src={m.fileURL}
                        alt={m.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="p-3">
                        <div className="text-xs font-bold text-amber-100 truncate">{m.title}</div>
                        {m.description && (
                          <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                            {m.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                          <span>{m.fileType}</span>
                          <span>{m.date || ''}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
                  Nenhuma fotografia ou certidão vinculada diretamente a este perfil.
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
