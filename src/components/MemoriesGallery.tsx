import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Camera,
  FileText,
  Mail,
  UtensilsCrossed,
  Filter,
  Maximize2,
  X,
  Calendar,
  MapPin,
  ExternalLink,
  Search,
  BookOpen
} from 'lucide-react';
import { FamilyMedia, Person, MediaType } from '../types/genealogy';

interface MemoriesGalleryProps {
  media: FamilyMedia[];
  people: Person[];
  onOpenProfile: (person: Person) => void;
  onOpenAddMedia?: () => void;
}

export const MemoriesGallery: React.FC<MemoriesGalleryProps> = ({
  media,
  people,
  onOpenProfile,
  onOpenAddMedia,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lightboxMedia, setLightboxMedia] = useState<FamilyMedia | null>(null);

  const filteredMedia = useMemo(() => {
    return media.filter(item => {
      if (selectedType !== 'all' && item.fileType !== selectedType) return false;
      if (selectedPersonId !== 'all' && !item.personIds?.includes(selectedPersonId)) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(term);
        const matchDesc = (item.description || '').toLowerCase().includes(term);
        const matchSource = (item.source || '').toLowerCase().includes(term);
        if (!matchTitle && !matchDesc && !matchSource) return false;
      }
      return true;
    });
  }, [media, selectedType, selectedPersonId, searchTerm]);

  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'photo':
        return <Camera className="w-3.5 h-3.5 text-amber-400" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'letter':
        return <Mail className="w-3.5 h-3.5 text-emerald-400" />;
      case 'recipe':
        return <UtensilsCrossed className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getTypeLabel = (type: MediaType) => {
    switch (type) {
      case 'photo': return 'Fotografia Histórica';
      case 'document': return 'Documento / Certidão';
      case 'letter': return 'Carta / Manuscrito';
      case 'recipe': return 'Receita de Família';
      default: return 'Memória';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cabeçalho */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-400 mb-3 shadow-lg shadow-amber-950/20">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-amber-100">
          Galeria de Memórias & Acervo
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2">
          Preserve fotografias de época, manuscritos, certidões notariais e receitas tradicionais passadas de geração para geração.
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tipo de Memória */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todas as Memórias ({media.length})</option>
            <option value="photo">Fotografias</option>
            <option value="document">Certidões e Documentos</option>
            <option value="letter">Cartas e Cartões</option>
            <option value="recipe">Receitas de Família</option>
          </select>

          {/* Pessoa */}
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
            placeholder="Pesquisar memórias..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Grid de Memórias */}
      {filteredMedia.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedia.map(item => {
            const related = people.filter(p => item.personIds?.includes(p.id));
            return (
              <div
                key={item.id}
                onClick={() => setLightboxMedia(item)}
                className="group rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 shadow-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col"
              >
                {/* Imagem */}
                <div className="relative h-56 overflow-hidden bg-slate-950">
                  <img
                    src={item.fileURL}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-semibold text-slate-200 border border-slate-700">
                    {getTypeIcon(item.fileType)}
                    <span>{getTypeLabel(item.fileType)}</span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />

                  <button className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/80 backdrop-blur-md text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Conteúdo */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-slate-100 group-hover:text-amber-200 transition-colors line-clamp-1">
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="font-mono text-amber-300/80">{item.date || 'Data não informada'}</span>
                    <span className="truncate max-w-[130px]">{item.source || ''}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
          Nenhuma memória encontrada com os filtros atuais.
        </div>
      )}

      {/* Lightbox / Visualização em Tela Cheia */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4 sm:p-8">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 rounded-3xl border border-amber-500/30 overflow-hidden shadow-2xl flex flex-col md:flex-row">
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/80 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Imagem Ampliada */}
            <div className="flex-1 bg-black flex items-center justify-center max-h-[50vh] md:max-h-full overflow-hidden">
              <img
                src={lightboxMedia.fileURL}
                alt={lightboxMedia.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Ficha da Memória */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  {getTypeIcon(lightboxMedia.fileType)}
                  <span>{getTypeLabel(lightboxMedia.fileType)}</span>
                </div>

                <h3 className="font-serif text-lg font-bold text-amber-100">
                  {lightboxMedia.title}
                </h3>

                {lightboxMedia.description && (
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {lightboxMedia.description}
                  </p>
                )}

                <div className="space-y-2 text-xs text-slate-400 pt-3 border-t border-slate-800 font-mono">
                  {lightboxMedia.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lightboxMedia.date}</span>
                    </div>
                  )}
                  {lightboxMedia.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lightboxMedia.location}</span>
                    </div>
                  )}
                  {lightboxMedia.source && (
                    <div className="text-[11px] text-slate-500 font-sans">
                      Fonte: {lightboxMedia.source}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <a
                  href={lightboxMedia.fileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir em Alta Resolução</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
