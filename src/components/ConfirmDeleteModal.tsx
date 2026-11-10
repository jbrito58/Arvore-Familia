import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { Person } from '../types/genealogy';
import { formatLifespan } from '../utils/dateUtils';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  person: Person | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  person,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !person) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl p-6 sm:p-7 space-y-5 animate-fade-in">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone de Perigo e Título */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950/40">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
              Ação Destrutiva
            </span>
            <h3 className="font-serif text-xl font-bold text-slate-100">
              Excluir Cadastro Familiar
            </h3>
          </div>
        </div>

        {/* Identificação da Pessoa a ser excluída */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <img
            src={
              person.profilePhoto ||
              (person.gender === 'F'
                ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop'
                : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop')
            }
            alt={person.fullName}
            className="w-12 h-12 rounded-full object-cover border-2 border-rose-400/50 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-serif font-bold text-sm text-amber-100 truncate">
              {person.fullName}
            </h4>
            <div className="text-[11px] text-slate-400 font-mono">
              {formatLifespan(person.birthDate, person.deathDate, person.isLiving)}
            </div>
          </div>
        </div>

        {/* Explicação e Garantias de Segurança */}
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed bg-rose-950/20 p-3.5 rounded-2xl border border-rose-900/40">
          <p className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>
              Tem certeza de que deseja remover este cadastro? Todas as informações biográficas e anotações desta pessoa serão excluídas.
            </span>
          </p>
          <p className="text-[11px] text-slate-400 pl-6">
            ✓ Os demais familiares (pais, filhos e cônjuges) <strong>não serão excluídos</strong> e permanecerão preservados na árvore genealógica.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sim, Excluir Cadastro</span>
          </button>
        </div>

      </div>
    </div>
  );
};
