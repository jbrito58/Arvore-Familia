import React, { useState } from 'react';
import {
  X,
  GitFork,
  Image as ImageIcon,
  Shield,
  Sparkles,
  CheckCircle,
  FolderPlus
} from 'lucide-react';
import { FamilyTree } from '../types/genealogy';

interface NewTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTree: (treeData: {
    name: string;
    surname: string;
    description: string;
    coverImage: string;
    privacy: 'private' | 'family' | 'public';
  }) => void;
}

const PRESET_COVERS = [
  {
    label: 'Carvalho Ancestral',
    url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1200&auto=format&fit=crop',
  },
  {
    label: 'Montanhas & Veredas',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
  },
  {
    label: 'Bosque Sereno',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop',
  },
  {
    label: 'Casarão & Raízes',
    url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1200&auto=format&fit=crop',
  },
];

export const NewTreeModal: React.FC<NewTreeModalProps> = ({
  isOpen,
  onClose,
  onCreateTree,
}) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0].url);
  const [privacy, setPrivacy] = useState<'private' | 'family' | 'public'>('private');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o nome da nova árvore familiar.');
      return;
    }

    onCreateTree({
      name: name.trim(),
      surname: surname.trim() || name.trim(),
      description: description.trim(),
      coverImage: coverImage.trim(),
      privacy,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-amber-100">
                Criar Nova Família (Nova Árvore)
              </h3>
              <p className="text-xs text-slate-400">
                Inicie um novo ramo genealógico independente para outra família ou linhagem.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Nome da Árvore e Sobrenome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                Nome da Nova Árvore *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (!surname) {
                    const match = e.target.value.replace(/^árvore da família\s*/i, '').replace(/^família\s*/i, '');
                    setSurname(match);
                  }
                }}
                placeholder="Ex: Árvore da Família Brito"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sobrenome Principal da Família
              </label>
              <input
                type="text"
                value={surname}
                onChange={e => setSurname(e.target.value)}
                placeholder="Ex: Brito ou Silva & Oliveira"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium placeholder-slate-500"
              />
            </div>
          </div>

          {/* Descrição / Origens */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Origem, Lema ou História da Família
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Raízes nascidas no interior da Bahia que floresceram por gerações com tradição musical e carpinteira..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400 placeholder-slate-500 leading-relaxed"
            />
          </div>

          {/* Escolha da Imagem de Capa */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Imagem de Capa do Memorial
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_COVERS.map(cover => (
                <div
                  key={cover.label}
                  onClick={() => setCoverImage(cover.url)}
                  className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    coverImage === cover.url
                      ? 'border-amber-400 ring-2 ring-amber-400/30 scale-102'
                      : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={cover.url}
                    alt={cover.label}
                    className="w-full h-16 object-cover"
                  />
                  <div className="p-1 text-center bg-slate-950/90 text-[10px] text-amber-200 font-medium truncate">
                    {cover.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-1">
              <input
                type="url"
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                placeholder="Ou informe uma URL customizada de imagem..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Configuração de Privacidade */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-amber-300">
              Configuração de Privacidade
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className={`flex flex-col p-2.5 rounded-xl border cursor-pointer transition-colors ${
                privacy === 'private' ? 'bg-amber-500/15 border-amber-400 text-amber-200' : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <input
                    type="radio"
                    name="privacy"
                    checked={privacy === 'private'}
                    onChange={() => setPrivacy('private')}
                    className="hidden"
                  />
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Privada</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Apenas visível por você</span>
              </label>

              <label className={`flex flex-col p-2.5 rounded-xl border cursor-pointer transition-colors ${
                privacy === 'family' ? 'bg-amber-500/15 border-amber-400 text-amber-200' : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <input
                    type="radio"
                    name="privacy"
                    checked={privacy === 'family'}
                    onChange={() => setPrivacy('family')}
                    className="hidden"
                  />
                  <GitFork className="w-3.5 h-3.5 rotate-180 text-emerald-400" />
                  <span>Familiar</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Compartilhada com convidados</span>
              </label>

              <label className={`flex flex-col p-2.5 rounded-xl border cursor-pointer transition-colors ${
                privacy === 'public' ? 'bg-amber-500/15 border-amber-400 text-amber-200' : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <input
                    type="radio"
                    name="privacy"
                    checked={privacy === 'public'}
                    onChange={() => setPrivacy('public')}
                    className="hidden"
                  />
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pública</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Disponível na busca familiar</span>
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Criar Família & Abrir Árvore</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
