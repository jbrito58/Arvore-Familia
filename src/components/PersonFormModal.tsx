import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Heart,
  Calendar,
  Sparkles,
  AlertTriangle,
  Upload,
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  Info
} from 'lucide-react';
import {
  Person,
  Relationship,
  Gender,
  RecordStatus,
  FamilyEvent,
  FamilyMedia,
  ParentType
} from '../types/genealogy';
import { parseDateComponents } from '../utils/dateUtils';
import {
  detectDuplicates,
  validatePersonChronology,
  wouldCreateCycle
} from '../services/genealogyEngine';

/**
 * Otimiza e comprime uma foto no próprio navegador para carregamento instantâneo
 */
const compressAndReadImage = (file: File, maxDim = 600, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WEBP).'));
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao processar arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
};

interface PersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    person: Person,
    relations: {
      fatherId?: string;
      motherId?: string;
      spouseId?: string;
      childId?: string;
    },
    events: FamilyEvent[],
    media: FamilyMedia[]
  ) => void;
  onDelete?: (personId: string) => void;
  personToEdit?: Person | null;
  existingPeople: Person[];
  existingRelationships: Relationship[];
  initialRelativeHint?: {
    relative: Person;
    type: 'parent' | 'child' | 'spouse';
  } | null;
  treeId: string;
}

export const PersonFormModal: React.FC<PersonFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  personToEdit,
  existingPeople,
  existingRelationships,
  initialRelativeHint,
  treeId,
}) => {
  const [step, setStep] = useState<number>(1);

  // Etapa 1: Dados Vitais
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender>('U');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthDateApproximate, setBirthDateApproximate] = useState(false);
  const [birthPlace, setBirthPlace] = useState('');
  const [isLiving, setIsLiving] = useState(true);
  const [deathDate, setDeathDate] = useState('');
  const [deathDateApproximate, setDeathDateApproximate] = useState(false);
  const [deathPlace, setDeathPlace] = useState('');
  const [burialPlace, setBurialPlace] = useState('');
  const [biography, setBiography] = useState('');
  const [notes, setNotes] = useState('');
  const [recordStatus, setRecordStatus] = useState<RecordStatus>('completo');

  // Etapa 2: Relacionamentos Selecionados
  const [fatherId, setFatherId] = useState<string>('');
  const [motherId, setMotherId] = useState<string>('');
  const [spouseId, setSpouseId] = useState<string>('');
  const [childId, setChildId] = useState<string>('');

  // Etapa 3: Eventos da Vida
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<string>('relocation');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  // Etapa 4: Memórias e Documentos
  const [mediaList, setMediaList] = useState<FamilyMedia[]>([]);
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaType, setNewMediaType] = useState<'photo' | 'document' | 'recipe' | 'letter'>('photo');
  const [newMediaURL, setNewMediaURL] = useState('');
  const [newMediaDate, setNewMediaDate] = useState('');
  const [newMediaSource, setNewMediaSource] = useState('');

  // Duplicidade e Alertas
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Estados para Upload de Fotografias e Memórias
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'url'>('upload');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const mediaFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Inicializar formulário
  useEffect(() => {
    if (personToEdit) {
      setFirstName(personToEdit.firstName || '');
      setMiddleName(personToEdit.middleName || '');
      setLastName(personToEdit.lastName || '');
      setFullName(personToEdit.fullName || '');
      setNickname(personToEdit.nickname || '');
      setGender(personToEdit.gender || 'U');
      setProfilePhoto(personToEdit.profilePhoto || '');
      setBirthDate(personToEdit.birthDate || '');
      setBirthDateApproximate(personToEdit.birthDateApproximate || false);
      setBirthPlace(personToEdit.birthPlace || '');
      setIsLiving(personToEdit.isLiving);
      setDeathDate(personToEdit.deathDate || '');
      setDeathDateApproximate(personToEdit.deathDateApproximate || false);
      setDeathPlace(personToEdit.deathPlace || '');
      setBurialPlace(personToEdit.burialPlace || '');
      setBiography(personToEdit.biography || '');
      setNotes(personToEdit.notes || '');
      setRecordStatus(personToEdit.recordStatus || 'completo');

      // Buscar pais atuais
      const parentRels = existingRelationships.filter(
        r => r.relationshipType === 'parent' && r.person2Id === personToEdit.id
      );
      parentRels.forEach(r => {
        const p = existingPeople.find(x => x.id === r.person1Id);
        if (p?.gender === 'M') setFatherId(p.id);
        else if (p?.gender === 'F') setMotherId(p.id);
        else if (!fatherId) setFatherId(p?.id || '');
      });

      // Cônjuge atual
      const spouseRel = existingRelationships.find(
        r => r.relationshipType === 'spouse' && (r.person1Id === personToEdit.id || r.person2Id === personToEdit.id)
      );
      if (spouseRel) {
        setSpouseId(spouseRel.person1Id === personToEdit.id ? spouseRel.person2Id : spouseRel.person1Id);
      }
    } else {
      // Criação nova com atalhos de parentesco
      resetForm();
      if (initialRelativeHint) {
        if (initialRelativeHint.type === 'parent') {
          // Estamos adicionando um pai/mãe para initialRelativeHint.relative
          setChildId(initialRelativeHint.relative.id);
        } else if (initialRelativeHint.type === 'child') {
          // Estamos adicionando um filho de initialRelativeHint.relative
          if (initialRelativeHint.relative.gender === 'M') {
            setFatherId(initialRelativeHint.relative.id);
          } else {
            setMotherId(initialRelativeHint.relative.id);
          }
        } else if (initialRelativeHint.type === 'spouse') {
          setSpouseId(initialRelativeHint.relative.id);
        }
      }
    }
    setStep(1);
  }, [personToEdit, initialRelativeHint, isOpen]);

  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setFullName('');
    setNickname('');
    setGender('U');
    setProfilePhoto('');
    setBirthDate('');
    setBirthDateApproximate(false);
    setBirthPlace('');
    setIsLiving(true);
    setDeathDate('');
    setDeathDateApproximate(false);
    setDeathPlace('');
    setBurialPlace('');
    setBiography('');
    setNotes('');
    setRecordStatus('completo');
    setFatherId('');
    setMotherId('');
    setSpouseId('');
    setChildId('');
    setEvents([]);
    setMediaList([]);
  };

  // Auto-composição de Nome Completo
  const handleNameChange = (first: string, mid: string, last: string) => {
    const parts = [first, mid, last].filter(Boolean);
    if (!personToEdit) {
      setFullName(parts.join(' '));
    }
  };

  // Verificação de duplicidades
  const duplicateMatches = React.useMemo(() => {
    if (!fullName.trim() || fullName.length < 3) return [];
    return detectDuplicates(
      { fullName, firstName, lastName, birthDate, birthPlace },
      existingPeople,
      personToEdit?.id
    );
  }, [fullName, firstName, lastName, birthDate, birthPlace, existingPeople, personToEdit]);

  // Alertas Cronológicos
  const chronologyAlerts = React.useMemo(() => {
    const parents: Person[] = [];
    if (fatherId) {
      const f = existingPeople.find(p => p.id === fatherId);
      if (f) parents.push(f);
    }
    if (motherId) {
      const m = existingPeople.find(p => p.id === motherId);
      if (m) parents.push(m);
    }
    return validatePersonChronology({ birthDate, deathDate, fullName }, parents);
  }, [birthDate, deathDate, fatherId, motherId, fullName, existingPeople]);

  // Submissão Final
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert('Por favor, informe ao menos o nome do familiar.');
      return;
    }

    // Prevenir ciclo se foi selecionado pai
    if (fatherId && personToEdit && wouldCreateCycle(fatherId, personToEdit.id, existingRelationships)) {
      alert('Não é possível vincular este pai: causaria uma relação circular de parentesco impossível.');
      return;
    }

    const now = new Date().toISOString();
    const personData: Person = {
      id: personToEdit ? personToEdit.id : 'person-' + Date.now(),
      treeId,
      firstName: firstName.trim() || fullName.split(' ')[0],
      middleName: middleName.trim(),
      lastName: lastName.trim() || fullName.split(' ').slice(1).join(' '),
      fullName: fullName.trim(),
      nickname: nickname.trim(),
      gender,
      profilePhoto: profilePhoto.trim(),
      birthDate,
      birthDateApproximate,
      birthPlace: birthPlace.trim(),
      isLiving,
      deathDate: isLiving ? '' : deathDate,
      deathDateApproximate: isLiving ? false : deathDateApproximate,
      deathPlace: isLiving ? '' : deathPlace.trim(),
      burialPlace: isLiving ? '' : burialPlace.trim(),
      biography: biography.trim(),
      notes: notes.trim(),
      recordStatus,
      createdAt: personToEdit ? personToEdit.createdAt : now,
      updatedAt: now,
    };

    onSave(
      personData,
      { fatherId, motherId, spouseId, childId },
      events,
      mediaList
    );
    onClose();
  };

  const handleAddEvent = () => {
    if (!newEventTitle.trim()) return;
    const newEv: FamilyEvent = {
      id: 'ev-' + Date.now(),
      treeId,
      personIds: personToEdit ? [personToEdit.id] : [],
      eventType: newEventType as any,
      title: newEventTitle,
      date: newEventDate,
      location: newEventLocation,
      description: newEventDesc,
      createdAt: new Date().toISOString(),
    };
    setEvents([...events, newEv]);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventLocation('');
    setNewEventDesc('');
  };

  const handleAddMedia = () => {
    if (!newMediaTitle.trim() || !newMediaURL.trim()) return;
    const newMed: FamilyMedia = {
      id: 'med-' + Date.now(),
      treeId,
      personIds: personToEdit ? [personToEdit.id] : [],
      fileType: newMediaType,
      fileURL: newMediaURL,
      title: newMediaTitle,
      date: newMediaDate,
      source: newMediaSource,
      createdAt: new Date().toISOString(),
    };
    setMediaList([...mediaList, newMed]);
    setNewMediaTitle('');
    setNewMediaURL('');
    setNewMediaDate('');
    setNewMediaSource('');
  };

  // Upload e compressão de foto de perfil
  const handleProfileFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setIsUploadingPhoto(true);
    try {
      const dataUrl = await compressAndReadImage(file, 600, 0.85);
      setProfilePhoto(dataUrl);
    } catch (err: any) {
      setPhotoError(err.message || 'Erro ao processar imagem.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  // Upload e compressão de documento / foto de memória
  const handleMediaFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const dataUrl = await compressAndReadImage(file, 1000, 0.85);
      setNewMediaURL(dataUrl);
      if (!newMediaTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNewMediaTitle(cleanName);
      }
    } catch (err) {
      console.error('Erro ao ler arquivo de mídia:', err);
    } finally {
      setIsUploadingMedia(false);
      if (e.target) e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div>
            <h3 className="font-serif text-lg font-bold text-amber-100">
              {personToEdit ? 'Editar Dados do Familiar' : 'Cadastrar Novo Familiar'}
            </h3>
            <p className="text-xs text-slate-400">
              Passo {step} de 4 — {
                step === 1 ? 'Informações Básicas e Vitais' :
                step === 2 ? 'Relações de Parentesco' :
                step === 3 ? 'Acontecimentos e Eventos' :
                'Memórias, Fotografias e Documentos'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {personToEdit && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Tem certeza de que deseja excluir o cadastro de ${personToEdit.fullName}? Os demais familiares continuarão na árvore.`)) {
                    onDelete(personToEdit.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 transition-colors cursor-pointer"
                title="Excluir este cadastro familiar"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Excluir Cadastro</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Progresso das 4 Etapas */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          {[
            { num: 1, label: '1. Básico' },
            { num: 2, label: '2. Parentes' },
            { num: 3, label: '3. Eventos' },
            { num: 4, label: '4. Memórias' },
          ].map(s => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`flex-1 py-2.5 text-xs font-medium text-center border-b-2 transition-colors ${
                step === s.num
                  ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ===================== ETAPA 1 ===================== */}
          {step === 1 && (
            <div className="space-y-4">
              
              {/* Foto Principal e Nome Completo */}
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                {/* Avatar Interativo com Troca de Foto ao Clicar */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group cursor-pointer"
                    title="Clique para escolher foto do computador ou celular"
                  >
                    <img
                      src={profilePhoto || (gender === 'F'
                        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop'
                        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop')}
                      alt="Foto de perfil"
                      className="w-24 h-24 rounded-full object-cover border-2 border-amber-400/80 shadow-lg group-hover:brightness-90 transition-all"
                    />
                    <div className="absolute inset-0 rounded-full bg-slate-950/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-amber-200 text-[10px] font-semibold transition-opacity">
                      <Camera className="w-5 h-5 mb-0.5 text-amber-300" />
                      <span>Trocar foto</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg border-2 border-slate-900 transition-transform group-hover:scale-110">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleProfileFileSelect}
                    className="hidden"
                  />

                  <div className="text-[10px] text-slate-400 mt-2 text-center">
                    {isUploadingPhoto ? (
                      <span className="text-amber-400 animate-pulse font-medium">Processando...</span>
                    ) : (
                      'Clique para alterar'
                    )}
                  </div>
                </div>

                <div className="flex-1 w-full space-y-3">
                  {/* Seletor do Modo de Inserção da Foto */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <span>Fotografia de Retrato</span>
                      </label>

                      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPhotoInputMode('upload')}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            photoInputMode === 'upload'
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Do Aparelho
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoInputMode('url')}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            photoInputMode === 'url'
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Link (URL)
                        </button>
                      </div>
                    </div>

                    {photoInputMode === 'upload' ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/50 text-amber-200 text-xs font-semibold cursor-pointer transition-all active:scale-98"
                        >
                          <UploadCloud className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            {profilePhoto ? 'Substituir Foto do Celular / Computador' : 'Escolher Foto do Celular / Computador'}
                          </span>
                        </button>

                        {profilePhoto && (
                          <button
                            type="button"
                            onClick={() => setProfilePhoto('')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 text-slate-400 text-xs transition-colors"
                            title="Remover foto personalizada"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remover</span>
                          </button>
                        )}
                        <span className="text-[11px] text-slate-400">
                          (Fotos da galeria, arquivos ou câmera)
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="url"
                          value={profilePhoto}
                          onChange={e => setProfilePhoto(e.target.value)}
                          placeholder="https://exemplo.com/foto_do_familiar.jpg"
                          className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                        {profilePhoto && (
                          <button
                            type="button"
                            onClick={() => setProfilePhoto('')}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-300 text-xs"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                    )}

                    {photoError && (
                      <div className="text-[11px] text-rose-400 flex items-center gap-1.5 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{photoError}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Primeiro Nome *
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => {
                          setFirstName(e.target.value);
                          handleNameChange(e.target.value, middleName, lastName);
                        }}
                        placeholder="Ex: Manuel"
                        required
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Nome do Meio
                      </label>
                      <input
                        type="text"
                        value={middleName}
                        onChange={e => {
                          setMiddleName(e.target.value);
                          handleNameChange(firstName, e.target.value, lastName);
                        }}
                        placeholder="Ex: Ferreira"
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Sobrenome
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => {
                          setLastName(e.target.value);
                          handleNameChange(firstName, middleName, e.target.value);
                        }}
                        placeholder="Ex: Ramos"
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Nome Completo Registrado
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Nome completo formal"
                        required
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Apelido ou Como Era Conhecido
                      </label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        placeholder="Ex: Nhô Manuel, Zequinha"
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sexo Cadastral e Status de Vida */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Gênero / Sexo Cadastral
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as Gender)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                    <option value="U">Não especificado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Estado do Registro
                  </label>
                  <select
                    value={recordStatus}
                    onChange={e => setRecordStatus(e.target.value as RecordStatus)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="completo">Completo</option>
                    <option value="incompleto">Incompleto (Faltam certidões/datas)</option>
                    <option value="em_pesquisa">Em pesquisa histórica</option>
                  </select>
                </div>
              </div>

              {/* Nascimento */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-amber-200 uppercase tracking-wider">
                  Nascimento
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Data de Nascimento (ou Ano)
                    </label>
                    <input
                      type="text"
                      value={birthDate}
                      onChange={e => setBirthDate(e.target.value)}
                      placeholder="AAAA-MM-DD ou apenas o Ano"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-mono"
                    />
                    <label className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={birthDateApproximate}
                        onChange={e => setBirthDateApproximate(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>Data aproximada (estimada)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Local de Nascimento
                    </label>
                    <input
                      type="text"
                      value={birthPlace}
                      onChange={e => setBirthPlace(e.target.value)}
                      placeholder="Cidade, Estado, País"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Falecimento */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-amber-200 uppercase tracking-wider">
                    Condição Vital
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLiving}
                      onChange={e => setIsLiving(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span className="font-medium text-emerald-400">Pessoa Viva</span>
                  </label>
                </div>

                {!isLiving && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Data de Falecimento
                      </label>
                      <input
                        type="text"
                        value={deathDate}
                        onChange={e => setDeathDate(e.target.value)}
                        placeholder="AAAA-MM-DD ou Ano"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-mono"
                      />
                      <label className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deathDateApproximate}
                          onChange={e => setDeathDateApproximate(e.target.checked)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-0"
                        />
                        <span>Data aproximada</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Local de Falecimento
                      </label>
                      <input
                        type="text"
                        value={deathPlace}
                        onChange={e => setDeathPlace(e.target.value)}
                        placeholder="Cidade, Estado"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Local de Sepultamento
                      </label>
                      <input
                        type="text"
                        value={burialPlace}
                        onChange={e => setBurialPlace(e.target.value)}
                        placeholder="Cemitério ou Jazigo"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Biografia e Memórias */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Biografia e Histórias de Vida
                </label>
                <textarea
                  rows={3}
                  value={biography}
                  onChange={e => setBiography(e.target.value)}
                  placeholder="Conte um pouco sobre sua trajetória, vocação, memórias afetuosas e causos..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Alertas de Duplicidade Inteligente */}
              {duplicateMatches.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Atenção: Possível duplicidade detectada</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Já existe familiar com dados semelhantes cadastrado na árvore:
                  </p>
                  <div className="space-y-1">
                    {duplicateMatches.map(m => (
                      <div key={m.person.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-amber-500/20">
                        <span className="font-medium text-amber-200">{m.person.fullName}</span>
                        <span className="text-[10px] text-slate-400">{m.reasons.join(', ')} ({m.similarityScore}% similar)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alertas de Coerência Cronológica */}
              {chronologyAlerts.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-1">
                  {chronologyAlerts.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-amber-300">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>{a.message}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ===================== ETAPA 2 ===================== */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Estabeleça as relações de parentesco. O sistema garante sincronização bidirecional automática (ex: se marcar como filho de A, A passará a ter este registro como pai/mãe).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Seleção do Pai */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-emerald-300">
                    Pai
                  </label>
                  <select
                    value={fatherId}
                    onChange={e => setFatherId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="">-- Não informado / Desconhecido --</option>
                    {existingPeople
                      .filter(p => p.id !== personToEdit?.id)
                      .map(p => {
                        const y = parseDateComponents(p.birthDate).yearStr;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.fullName} {y ? `(${y})` : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* Seleção da Mãe */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-rose-300">
                    Mãe
                  </label>
                  <select
                    value={motherId}
                    onChange={e => setMotherId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="">-- Não informada / Desconhecida --</option>
                    {existingPeople
                      .filter(p => p.id !== personToEdit?.id)
                      .map(p => {
                        const y = parseDateComponents(p.birthDate).yearStr;
                        return (
                          <option key={p.id} value={p.id}>
                            {p.fullName} {y ? `(${y})` : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* Seleção de Cônjuge */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-amber-300">
                    Cônjuge / Companheiro(a)
                  </label>
                  <select
                    value={spouseId}
                    onChange={e => setSpouseId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="">-- Nenhum(a) ou Não casado(a) --</option>
                    {existingPeople
                      .filter(p => p.id !== personToEdit?.id)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.fullName}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Seleção de Filho */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-blue-300">
                    Vincular Filho(a) Existente
                  </label>
                  <select
                    value={childId}
                    onChange={e => setChildId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="">-- Nenhum selecionado --</option>
                    {existingPeople
                      .filter(p => p.id !== personToEdit?.id)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.fullName}
                        </option>
                      ))}
                  </select>
                </div>

              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                💡 <strong>Dica:</strong> Irmãos, tios e primos serão computados e exibidos automaticamente através dos pais e avós comuns cadastrados.
              </div>
            </div>
          )}

          {/* ===================== ETAPA 3 ===================== */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-sm font-semibold text-amber-200">
                    Marcos e Acontecimentos da Vida
                  </h4>
                  <p className="text-xs text-slate-400">
                    Registre nascimentos, casamentos, formaturas, mudanças de estado e memórias marcantes.
                  </p>
                </div>
              </div>

              {/* Lista de Eventos Cadastrados */}
              {events.length > 0 && (
                <div className="space-y-2">
                  {events.map((ev, index) => (
                    <div
                      key={ev.id || index}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-amber-100">{ev.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {ev.date || 'Data não informada'} {ev.location ? `· ${ev.location}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEvents(events.filter((_, i) => i !== index))}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário para Adicionar Novo Evento */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-amber-300">
                  Adicionar Acontecimento
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tipo de Evento</label>
                    <select
                      value={newEventType}
                      onChange={e => setNewEventType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="birth">Nascimento</option>
                      <option value="baptism">Batismo</option>
                      <option value="wedding">Casamento</option>
                      <option value="relocation">Mudança de Cidade / Estado</option>
                      <option value="education">Formação Escolar ou Acadêmica</option>
                      <option value="career">Trabalho / Vocação</option>
                      <option value="death">Falecimento</option>
                      <option value="other">Outro Momento Especial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Título do Evento *</label>
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={e => setNewEventTitle(e.target.value)}
                      placeholder="Ex: Mudança para Belo Horizonte"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Data (ou Ano)</label>
                    <input
                      type="text"
                      value={newEventDate}
                      onChange={e => setNewEventDate(e.target.value)}
                      placeholder="Ex: 1955 ou 1955-03-01"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Local / Cidade</label>
                    <input
                      type="text"
                      value={newEventLocation}
                      onChange={e => setNewEventLocation(e.target.value)}
                      placeholder="Ex: Diamantina - MG"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-200 text-xs font-medium transition-colors"
                >
                  + Adicionar este acontecimento
                </button>
              </div>

            </div>
          )}

          {/* ===================== ETAPA 4 ===================== */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-serif text-sm font-semibold text-amber-200">
                  Memórias, Certidões & Documentos
                </h4>
                <p className="text-xs text-slate-400">
                  Reúna fotos de época, certidões digitalizadas, cartas, manuscritos e receitas tradicionais de família.
                </p>
              </div>

              {/* Lista de Arquivos e Memórias */}
              {mediaList.length > 0 && (
                <div className="space-y-2">
                  {mediaList.map((med, index) => (
                    <div
                      key={med.id || index}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={med.fileURL}
                          alt={med.title}
                          className="w-10 h-10 rounded-lg object-cover border border-amber-400/40"
                        />
                        <div>
                          <div className="font-semibold text-amber-100">{med.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {med.fileType} {med.date ? `· ${med.date}` : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMediaList(mediaList.filter((_, i) => i !== index))}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar Mídia */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-amber-300">
                  Cadastrar Registro ou Memória
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tipo de Registro</label>
                    <select
                      value={newMediaType}
                      onChange={e => setNewMediaType(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="photo">Fotografia Histórica</option>
                      <option value="document">Certidão Notarial ou Documento</option>
                      <option value="letter">Carta ou Cartão Postal</option>
                      <option value="recipe">Receita Tradicional de Família</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Título da Memória *</label>
                    <input
                      type="text"
                      value={newMediaTitle}
                      onChange={e => setNewMediaTitle(e.target.value)}
                      placeholder="Ex: Foto do Casamento em 1940"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="block text-[11px] text-slate-400">
                        Arquivo ou Imagem da Memória *
                      </label>

                      <button
                        type="button"
                        onClick={() => mediaFileInputRef.current?.click()}
                        disabled={isUploadingMedia}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isUploadingMedia ? 'Processando...' : 'Escolher Arquivo do Celular / Computador'}</span>
                      </button>

                      <input
                        ref={mediaFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleMediaFileSelect}
                        className="hidden"
                      />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newMediaURL}
                        onChange={e => setNewMediaURL(e.target.value)}
                        placeholder="Ou cole o link direto (https://exemplo.com/foto_antiga.jpg)"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                      {newMediaURL && (
                        <button
                          type="button"
                          onClick={() => setNewMediaURL('')}
                          className="px-2 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-300 text-xs"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    {newMediaURL && (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <img src={newMediaURL} alt="Prévia" className="w-10 h-10 object-cover rounded-lg border border-amber-400/40" />
                        <span className="text-[11px] text-emerald-400 font-medium">✓ Imagem carregada e pronta para adicionar</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Data / Época</label>
                    <input
                      type="text"
                      value={newMediaDate}
                      onChange={e => setNewMediaDate(e.target.value)}
                      placeholder="Ex: Julho de 1940"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Fonte / Acervo</label>
                    <input
                      type="text"
                      value={newMediaSource}
                      onChange={e => setNewMediaSource(e.target.value)}
                      placeholder="Ex: Álbum de fotos herdado"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddMedia}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-200 text-xs font-medium transition-colors"
                >
                  + Adicionar esta memória
                </button>
              </div>

            </div>
          )}

          {/* Rodapé e Botões de Navegação */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white bg-slate-800 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
              )}

              {personToEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Tem certeza de que deseja excluir o cadastro de ${personToEdit.fullName}? Os demais familiares continuarão na árvore.`)) {
                      onDelete(personToEdit.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-950/50 hover:bg-rose-900 border border-rose-800/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Excluir Cadastro</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30"
                >
                  Próximo passo
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Salvar Registro Familiar
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
