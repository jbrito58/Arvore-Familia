import React from 'react';
import {
  MoreVertical,
  User,
  Heart,
  FileText,
  AlertTriangle,
  UserCheck,
  Eye,
  Edit,
  UserPlus,
  Compass,
  Crosshair,
  Trash2
} from 'lucide-react';
import { Person } from '../types/genealogy';
import { parseDateComponents } from '../utils/dateUtils';

interface PersonCardProps {
  person: Person;
  isSelected?: boolean;
  onSelect: (person: Person) => void;
  onOpenProfile: (person: Person) => void;
  onEdit: (person: Person) => void;
  onDelete?: (person: Person) => void;
  onAddRelative?: (person: Person, relationType: 'parent' | 'child' | 'spouse') => void;
  onCalculateKinship?: (person: Person) => void;
  onCenterOnPerson?: (person: Person) => void;
  hasMemories?: boolean;
  hasDocuments?: boolean;
  compact?: boolean;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  isSelected = false,
  onSelect,
  onOpenProfile,
  onEdit,
  onDelete,
  onAddRelative,
  onCalculateKinship,
  onCenterOnPerson,
  hasMemories = false,
  hasDocuments = false,
  compact = false,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const birthYear = parseDateComponents(person.birthDate).yearStr || '?';
  const deathYear = person.deathDate ? parseDateComponents(person.deathDate).yearStr : null;
  const isIncomplete = person.recordStatus === 'incompleto' || person.recordStatus === 'em_pesquisa';

  const defaultPhoto = person.gender === 'F'
    ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop';

  return (
    <div
      onClick={() => onSelect(person)}
      className={`relative select-none transition-all duration-200 cursor-pointer rounded-2xl group ${
        compact ? 'w-56 p-2.5' : 'w-64 p-3.5'
      } ${
        isSelected
          ? 'bg-slate-900/95 ring-2 ring-amber-400 shadow-2xl shadow-amber-500/20'
          : 'bg-slate-900/80 hover:bg-slate-800/95 border border-amber-500/25 hover:border-amber-400/60 shadow-lg shadow-black/40'
      } backdrop-blur-md`}
    >
      {/* Indicador de Seleção / Auréola dourada */}
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
          <span className="w-2 h-2 rounded-full bg-slate-950" />
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Foto com moldura temática */}
        <div className="relative shrink-0">
          <img
            src={person.profilePhoto || defaultPhoto}
            alt={person.fullName}
            className={`rounded-full object-cover border-2 transition-transform duration-200 group-hover:scale-105 ${
              compact ? 'w-11 h-11' : 'w-14 h-14'
            } ${
              isSelected ? 'border-amber-400' : 'border-amber-500/40'
            }`}
          />
          {/* Indicador de vida/falecimento */}
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
              person.isLiving ? 'bg-emerald-400' : 'bg-amber-600'
            }`}
            title={person.isLiving ? 'Pessoa viva' : 'Pessoa falecida (Em memória)'}
          />
        </div>

        {/* Informações Textuais */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-serif font-semibold text-xs text-amber-100 truncate group-hover:text-amber-300 transition-colors">
              {person.fullName}
            </h4>
          </div>

          {person.nickname && (
            <p className="text-[10px] text-amber-300/80 italic truncate">
              "{person.nickname}"
            </p>
          )}

          {/* Anos de vida */}
          <div className="text-[11px] font-mono text-slate-300 mt-0.5 flex items-center gap-1.5">
            <span>
              {birthYear}
              {person.isLiving ? ' — Presente' : ` — ${deathYear || '?'}`}
            </span>
          </div>

          {/* Metadados e Marcadores sem pills abusivas */}
          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
            {isIncomplete && (
              <span className="flex items-center gap-0.5 text-amber-400" title="Registro em pesquisa ou dados incompletos">
                <AlertTriangle className="w-3 h-3" />
                <span>Incompleto</span>
              </span>
            )}
            {hasMemories && (
              <span className="flex items-center gap-0.5 text-slate-300" title="Possui fotografias ou memórias">
                <Heart className="w-2.5 h-2.5 text-rose-400" />
              </span>
            )}
            {hasDocuments && (
              <span className="flex items-center gap-0.5 text-slate-300" title="Possui documentos históricos">
                <FileText className="w-2.5 h-2.5 text-blue-400" />
              </span>
            )}
          </div>
        </div>

        {/* Botão de Menu de Ações Rápidas */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-amber-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Ações para esta pessoa"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Menu Dropdown de Ações */}
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 text-left text-xs text-slate-200"
              onClick={(e) => e.stopPropagation()}
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenProfile(person);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-amber-200 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver Perfil Completo</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(person);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
              >
                <Edit className="w-3.5 h-3.5 text-slate-400" />
                <span>Editar Dados</span>
              </button>

              {onCenterOnPerson && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onCenterOnPerson(person);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5 text-slate-400" />
                  <span>Centralizar na Árvore</span>
                </button>
              )}

              {onCalculateKinship && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onCalculateKinship(person);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Calcular Parentesco</span>
                </button>
              )}

              {onAddRelative && (
                <div className="border-t border-slate-800 mt-1 pt-1">
                  <div className="text-[9px] uppercase font-semibold text-slate-500 px-2 py-0.5">
                    Adicionar Vínculo
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onAddRelative(person, 'parent');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 text-[11px]"
                  >
                    <UserPlus className="w-3 h-3 text-emerald-400" />
                    <span>Adicionar Pai / Mãe</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onAddRelative(person, 'spouse');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 text-[11px]"
                  >
                    <Heart className="w-3 h-3 text-rose-400" />
                    <span>Adicionar Cônjuge</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onAddRelative(person, 'child');
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 text-[11px]"
                  >
                    <User className="w-3 h-3 text-blue-400" />
                    <span>Adicionar Filho(a)</span>
                  </button>
                </div>
              )}

              {onDelete && (
                <div className="border-t border-slate-800 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(person);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-950/70 text-rose-400 hover:text-rose-300 transition-colors text-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Cadastro</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
