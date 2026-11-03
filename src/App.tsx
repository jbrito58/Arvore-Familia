/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { InteractiveTreeCanvas } from './components/InteractiveTreeCanvas';
import { FanChartCanvas } from './components/FanChartCanvas';
import { PeopleListView } from './components/PeopleListView';
import { KinshipCalculator } from './components/KinshipCalculator';
import { TimelineView } from './components/TimelineView';
import { FamilyMap } from './components/FamilyMap';
import { MemoriesGallery } from './components/MemoriesGallery';
import { PersonFormModal } from './components/PersonFormModal';
import { PersonProfileModal } from './components/PersonProfileModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ImportExportModal } from './components/ImportExportModal';
import { AuthModal } from './components/AuthModal';
import { HelpModal } from './components/HelpModal';
import { NewTreeModal } from './components/NewTreeModal';

import { Person, Relationship, FamilyEvent, FamilyMedia, FamilyTree } from './types/genealogy';
import {
  AppState,
  getInitialLocalState,
  saveLocalState,
  resetToEmptyTree,
  restoreDemoState,
  syncTreeToFirestore,
  deleteTreeFromFirestore,
  syncPersonToFirestore,
  deletePersonFromFirestore,
  syncRelationshipToFirestore,
  deleteRelationshipFromFirestore,
  loadUserDataFromFirestore,
  getCurrentTree,
  getPeopleForTree,
  getRelationshipsForTree,
  getEventsForTree,
  getMediaForTree,
  createNewTree,
  switchTree,
  deleteTree
} from './services/storageService';
import { auth, logoutUser, testConnection } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // Estado Global do Aplicativo
  const [appState, setAppState] = useState<AppState>(getInitialLocalState);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Estados de Seleção e Modais
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [personForProfile, setPersonForProfile] = useState<Person | null>(null);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isNewTreeModalOpen, setIsNewTreeModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Árvore ativa e dados filtrados para a árvore corrente
  const currentTree = getCurrentTree(appState);
  const treePeople = React.useMemo(
    () => getPeopleForTree(appState.people, currentTree.id),
    [appState.people, currentTree.id]
  );
  const treeRelationships = React.useMemo(
    () => getRelationshipsForTree(appState.relationships, currentTree.id),
    [appState.relationships, currentTree.id]
  );
  const treeEvents = React.useMemo(
    () => getEventsForTree(appState.events, currentTree.id),
    [appState.events, currentTree.id]
  );
  const treeMedia = React.useMemo(
    () => getMediaForTree(appState.media, currentTree.id),
    [appState.media, currentTree.id]
  );

  // Dica inicial de parentesco para cadastro guiado
  const [initialRelativeHint, setInitialRelativeHint] = useState<{
    relative: Person;
    type: 'parent' | 'child' | 'spouse';
  } | null>(null);

  // Notificações e Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Inicializar Firebase Auth e Testar Conexão
  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) {
        // Tentar carregar dados da nuvem do usuário
        const cloudData = await loadUserDataFromFirestore(user.uid);
        if (cloudData && cloudData.people.length > 0) {
          setAppState(cloudData);
          showToast(`Bem-vindo de volta! Dados da nuvem sincronizados.`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Salvar estado localmente quando alterado
  useEffect(() => {
    saveLocalState(appState);
  }, [appState]);

  // Pessoa Selecionada Padrão para a Árvore Ativa
  useEffect(() => {
    if (treePeople.length > 0) {
      const alreadySelected = treePeople.some(p => p.id === selectedPersonId);
      if (!alreadySelected) {
        const refPerson = treePeople.find(p => p.id === currentTree.referencePersonId);
        setSelectedPersonId(refPerson?.id || treePeople[0].id);
      }
    } else {
      setSelectedPersonId(null);
    }
  }, [treePeople, selectedPersonId, currentTree]);

  // Alternar Modo Noturno / Claro
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Salvar ou Editar Pessoa
  const handleSavePerson = (
    savedPerson: Person,
    relations: {
      fatherId?: string;
      motherId?: string;
      spouseId?: string;
      childId?: string;
    },
    newEvents: FamilyEvent[],
    newMedia: FamilyMedia[]
  ) => {
    const personWithTree: Person = {
      ...savedPerson,
      treeId: savedPerson.treeId || currentTree.id,
    };

    setAppState(prev => {
      const isEditing = prev.people.some(p => p.id === personWithTree.id);
      let updatedPeople: Person[];

      if (isEditing) {
        updatedPeople = prev.people.map(p => (p.id === personWithTree.id ? personWithTree : p));
      } else {
        updatedPeople = [...prev.people, personWithTree];
      }

      // Atualizar Relacionamentos
      let updatedRelationships = [...prev.relationships];
      const now = new Date().toISOString();

      // Vínculo com Pai
      if (relations.fatherId) {
        const existingFatherRel = updatedRelationships.find(
          r => r.relationshipType === 'parent' && r.person1Id === relations.fatherId && r.person2Id === personWithTree.id
        );
        if (!existingFatherRel) {
          const newRel: Relationship = {
            id: 'rel-' + Date.now() + '-f',
            treeId: currentTree.id,
            person1Id: relations.fatherId,
            person2Id: personWithTree.id,
            relationshipType: 'parent',
            parentType: 'biological',
            createdAt: now,
            updatedAt: now,
          };
          updatedRelationships.push(newRel);
          if (currentUser) syncRelationshipToFirestore(newRel);
        }
      }

      // Vínculo com Mãe
      if (relations.motherId) {
        const existingMotherRel = updatedRelationships.find(
          r => r.relationshipType === 'parent' && r.person1Id === relations.motherId && r.person2Id === personWithTree.id
        );
        if (!existingMotherRel) {
          const newRel: Relationship = {
            id: 'rel-' + Date.now() + '-m',
            treeId: currentTree.id,
            person1Id: relations.motherId,
            person2Id: personWithTree.id,
            relationshipType: 'parent',
            parentType: 'biological',
            createdAt: now,
            updatedAt: now,
          };
          updatedRelationships.push(newRel);
          if (currentUser) syncRelationshipToFirestore(newRel);
        }
      }

      // Vínculo com Cônjuge
      if (relations.spouseId) {
        const existingSpouseRel = updatedRelationships.find(
          r => r.relationshipType === 'spouse' &&
               ((r.person1Id === relations.spouseId && r.person2Id === personWithTree.id) ||
                (r.person1Id === personWithTree.id && r.person2Id === relations.spouseId))
        );
        if (!existingSpouseRel) {
          const newRel: Relationship = {
            id: 'rel-' + Date.now() + '-sp',
            treeId: currentTree.id,
            person1Id: personWithTree.id,
            person2Id: relations.spouseId,
            relationshipType: 'spouse',
            createdAt: now,
            updatedAt: now,
          };
          updatedRelationships.push(newRel);
          if (currentUser) syncRelationshipToFirestore(newRel);
        }
      }

      // Vínculo com Filho(a)
      if (relations.childId) {
        const existingChildRel = updatedRelationships.find(
          r => r.relationshipType === 'parent' && r.person1Id === personWithTree.id && r.person2Id === relations.childId
        );
        if (!existingChildRel) {
          const newRel: Relationship = {
            id: 'rel-' + Date.now() + '-ch',
            treeId: currentTree.id,
            person1Id: personWithTree.id,
            person2Id: relations.childId,
            relationshipType: 'parent',
            parentType: 'biological',
            createdAt: now,
            updatedAt: now,
          };
          updatedRelationships.push(newRel);
          if (currentUser) syncRelationshipToFirestore(newRel);
        }
      }

      // Sincronizar no Firestore se logado
      if (currentUser) {
        syncPersonToFirestore(personWithTree, currentUser.uid);
      }

      const taggedEvents = newEvents.map(e => ({ ...e, treeId: e.treeId || currentTree.id }));
      const taggedMedia = newMedia.map(m => ({ ...m, treeId: m.treeId || currentTree.id }));

      return {
        ...prev,
        people: updatedPeople,
        relationships: updatedRelationships,
        events: [...prev.events, ...taggedEvents],
        media: [...prev.media, ...taggedMedia],
        isDemoData: false, // Marcar como dados customizados
      };
    });

    setSelectedPersonId(personWithTree.id);
    setInitialRelativeHint(null);
    setPersonToEdit(null);

    // Efeito comemorativo suave
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#D4AF37', '#2D6A4F', '#C59B27'],
      });
    } catch (e) {
      // Ignorar se confetti falhar
    }

    showToast(`${personWithTree.fullName} salvo com sucesso!`);
  };

  // Excluir Pessoa
  const handleDeletePerson = (personId: string) => {
    setAppState(prev => {
      const updatedPeople = prev.people.filter(p => p.id !== personId);
      const updatedRelationships = prev.relationships.filter(
        r => r.person1Id !== personId && r.person2Id !== personId
      );
      if (currentUser) {
        deletePersonFromFirestore(personId);
      }
      return {
        ...prev,
        people: updatedPeople,
        relationships: updatedRelationships,
      };
    });

    if (personForProfile?.id === personId) {
      setPersonForProfile(null);
    }
    if (selectedPersonId === personId) {
      const remaining = treePeople.filter(p => p.id !== personId);
      setSelectedPersonId(remaining[0]?.id || null);
    }

    showToast('Familiar removido com segurança da árvore.');
  };

  const handleRequestDelete = (person: Person) => {
    setPersonToDelete(person);
  };

  const handleConfirmDelete = () => {
    if (personToDelete) {
      const personName = personToDelete.fullName;
      handleDeletePerson(personToDelete.id);
      setPersonToDelete(null);
      showToast(`Cadastro de ${personName} excluído com sucesso.`);
    }
  };

  // Criar Nova Família / Nova Árvore
  const handleCreateTree = (treeData: {
    name: string;
    surname: string;
    description: string;
    coverImage: string;
    privacy: 'private' | 'family' | 'public';
  }) => {
    const { updatedState, newTree } = createNewTree(appState, treeData, currentUser?.uid || 'local-user');
    setAppState(updatedState);
    setSelectedPersonId(null);
    setIsNewTreeModalOpen(false);
    setCurrentTab('tree');
    if (currentUser) {
      syncTreeToFirestore(newTree, currentUser.uid);
    }
    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#2D6A4F', '#48CAE4'],
      });
    } catch (e) {}
    showToast(`Árvore da ${newTree.name} iniciada! Adicione agora o primeiro familiar.`);
  };

  // Alternar entre Árvores
  const handleSelectTree = (treeId: string) => {
    const updated = switchTree(appState, treeId);
    setAppState(updated);
    const activeTree = getCurrentTree(updated);
    const peopleInNewTree = getPeopleForTree(updated.people, treeId);
    const refPerson = peopleInNewTree.find(p => p.id === activeTree.referencePersonId);
    setSelectedPersonId(refPerson?.id || peopleInNewTree[0]?.id || null);
    showToast(`Visualizando: ${activeTree.name}`);
  };

  // Excluir Árvore Familiar Inteira
  const handleDeleteTree = (treeId: string) => {
    if (appState.trees.length <= 1) {
      showToast('Você deve manter pelo menos uma árvore familiar cadastrada.');
      return;
    }
    const treeToDelete = appState.trees.find(t => t.id === treeId);
    if (!treeToDelete) return;

    if (window.confirm(`Tem certeza que deseja excluir a árvore "${treeToDelete.name}" e todas as suas pessoas cadastradas?`)) {
      const updated = deleteTree(appState, treeId);
      setAppState(updated);
      const peopleInNewTree = getPeopleForTree(updated.people, updated.currentTreeId);
      setSelectedPersonId(peopleInNewTree[0]?.id || null);
      if (currentUser) {
        deleteTreeFromFirestore(treeId);
      }
      showToast(`Árvore "${treeToDelete.name}" excluída.`);
    }
  };

  // Ações de Adicionar Parente com Vínculo
  const handleAddRelative = (
    relative: Person,
    type: 'parent' | 'child' | 'spouse'
  ) => {
    setPersonToEdit(null);
    setInitialRelativeHint({ relative, type });
    setIsFormModalOpen(true);
  };

  // Adicionar Primeira Pessoa
  const handleOpenAddFirstPerson = (role?: 'self' | 'father' | 'mother') => {
    setPersonToEdit(null);
    setInitialRelativeHint(null);
    setIsFormModalOpen(true);
  };

  // Limpar Demonstração e Começar do Zero
  const handleClearDemoData = () => {
    if (window.confirm('Deseja iniciar sua árvore familiar do zero? Os dados de demonstração serão removidos.')) {
      const emptyState = resetToEmptyTree(currentUser?.uid || 'local-user');
      setAppState(emptyState);
      setSelectedPersonId(null);
      setCurrentTab('tree');
      showToast('Árvore limpa. Comece adicionando seus familiares!');
    }
  };

  // Restaurar Demonstração
  const handleRestoreDemoData = () => {
    const demo = restoreDemoState();
    setAppState(demo);
    setSelectedPersonId('p-gabriela');
    showToast('Dados de demonstração da Família Oliveira Ramos restaurados.');
  };

  // Importar Estado Completo
  const handleImportState = (newState: AppState) => {
    setAppState(newState);
    saveLocalState(newState);
    if (newState.people.length > 0) {
      setSelectedPersonId(newState.people[0].id);
    }
    showToast('Importação de dados concluída com sucesso!');
  };

  // Importar Pessoas via CSV
  const handleImportPeopleFromCSV = (newPeople: Person[]) => {
    const tagged = newPeople.map(p => ({ ...p, treeId: currentTree.id }));
    setAppState(prev => ({
      ...prev,
      people: [...prev.people, ...tagged],
      isDemoData: false,
    }));
    showToast(`${newPeople.length} familiares adicionados via planilha CSV.`);
  };

  // Selecionar e abrir perfil
  const handleOpenProfile = (person: Person) => {
    setPersonForProfile(person);
  };

  const handleEditPerson = (person: Person) => {
    setPersonToEdit(person);
    setInitialRelativeHint(null);
    setIsFormModalOpen(true);
  };

  const handleViewInTree = (person: Person) => {
    setSelectedPersonId(person.id);
    setPersonForProfile(null);
    setCurrentTab('tree');
  };

  const handleCalculateKinship = (person: Person) => {
    setSelectedPersonId(person.id);
    setPersonForProfile(null);
    setCurrentTab('kinship');
  };

  const selectedPerson = treePeople.find(p => p.id === selectedPersonId) || treePeople[0];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isDarkMode ? 'bg-[#060B18] text-slate-100' : 'bg-[#FAF7F0] text-slate-900'
    }`}>
      
      {/* Toast Flutuante de Notificação */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 p-3.5 rounded-2xl bg-slate-900/95 border border-amber-400 text-amber-200 shadow-2xl text-xs flex items-center gap-2.5 backdrop-blur-md animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barra de Navegação Superior com Seletor de Linhagens/Árvores */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        trees={appState.trees}
        currentTree={currentTree}
        onSelectTree={handleSelectTree}
        onOpenNewTreeModal={() => setIsNewTreeModalOpen(true)}
        onDeleteTree={handleDeleteTree}
        people={treePeople}
        isDemoData={appState.isDemoData}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onOpenAddPerson={() => {
          setPersonToEdit(null);
          setInitialRelativeHint(null);
          setIsFormModalOpen(true);
        }}
        onOpenImportExport={() => setIsImportModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onClearDemoData={handleClearDemoData}
        onRestoreDemoData={handleRestoreDemoData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSelectPerson={id => {
          setSelectedPersonId(id);
          const p = treePeople.find(x => x.id === id);
          if (p) setPersonForProfile(p);
        }}
        currentUser={currentUser}
        onLogout={async () => {
          await logoutUser();
          setCurrentUser(null);
          showToast('Desconectado com sucesso.');
        }}
      />

      {/* Conteúdo Principal Dinâmico por Aba */}
      <main className="flex-1 flex flex-col pb-16 lg:pb-0">
        
        {/* ABA: PAINEL DASHBOARD */}
        {currentTab === 'dashboard' && (
          <Dashboard
            currentTree={currentTree}
            people={treePeople}
            relationships={treeRelationships}
            events={treeEvents}
            media={treeMedia}
            onOpenTree={() => setCurrentTab('tree')}
            onOpenAddPerson={() => {
              setPersonToEdit(null);
              setInitialRelativeHint(null);
              setIsFormModalOpen(true);
            }}
            onOpenNewTreeModal={() => setIsNewTreeModalOpen(true)}
            onSelectPerson={p => setSelectedPersonId(p.id)}
            onOpenProfile={handleOpenProfile}
            setCurrentTab={setCurrentTab}
          />
        )}

        {/* ABA: ÁRVORE GENEALÓGICA INTERATIVA */}
        {currentTab === 'tree' && (
          <InteractiveTreeCanvas
            people={treePeople}
            relationships={treeRelationships}
            selectedPersonId={selectedPersonId}
            onSelectPerson={p => setSelectedPersonId(p.id)}
            onOpenProfile={handleOpenProfile}
            onEditPerson={handleEditPerson}
            onDeletePerson={handleRequestDelete}
            onAddRelative={handleAddRelative}
            onCalculateKinship={handleCalculateKinship}
            onOpenAddFirstPerson={handleOpenAddFirstPerson}
            onOpenImport={() => setIsImportModalOpen(true)}
            onRestoreDemo={handleRestoreDemoData}
            isDarkMode={isDarkMode}
          />
        )}

        {/* ABA: LISTA DE PESSOAS */}
        {currentTab === 'people' && (
          <PeopleListView
            people={treePeople}
            onSelectPerson={p => setSelectedPersonId(p.id)}
            onOpenProfile={handleOpenProfile}
            onEditPerson={handleEditPerson}
            onDeletePerson={handleRequestDelete}
            onViewInTree={handleViewInTree}
            onCalculateKinship={handleCalculateKinship}
            onOpenAddPerson={() => {
              setPersonToEdit(null);
              setInitialRelativeHint(null);
              setIsFormModalOpen(true);
            }}
          />
        )}

        {/* ABA: CALCULADORA DE PARENTESCO */}
        {currentTab === 'kinship' && (
          <KinshipCalculator
            people={treePeople}
            relationships={treeRelationships}
            initialPerson1Id={selectedPersonId}
            initialPerson2Id={treePeople.find(p => p.id !== selectedPersonId)?.id}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {/* ABA: LINHA DO TEMPO FAMILIAR */}
        {currentTab === 'timeline' && (
          <TimelineView
            events={treeEvents}
            people={treePeople}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {/* ABA: MAPA DE ORIGENS & POLOS */}
        {currentTab === 'map' && (
          <FamilyMap
            people={treePeople}
            events={treeEvents}
            onOpenProfile={handleOpenProfile}
          />
        )}

        {/* ABA: MEMÓRIAS & ACERVO */}
        {currentTab === 'memories' && (
          <MemoriesGallery
            media={treeMedia}
            people={treePeople}
            onOpenProfile={handleOpenProfile}
          />
        )}

      </main>

      {/* Navegação Inferior para Celulares e Tablets */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAddPerson={() => {
          setPersonToEdit(null);
          setInitialRelativeHint(null);
          setIsFormModalOpen(true);
        }}
        onOpenImportExport={() => setIsImportModalOpen(true)}
        onOpenNewTreeModal={() => setIsNewTreeModalOpen(true)}
      />

      {/* Modais Globais */}
      {isNewTreeModalOpen && (
        <NewTreeModal
          isOpen={isNewTreeModalOpen}
          onClose={() => setIsNewTreeModalOpen(false)}
          onCreateTree={handleCreateTree}
        />
      )}

      {isFormModalOpen && (
        <PersonFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setPersonToEdit(null);
            setInitialRelativeHint(null);
          }}
          onSave={handleSavePerson}
          onDelete={handleDeletePerson}
          personToEdit={personToEdit}
          existingPeople={treePeople}
          existingRelationships={treeRelationships}
          initialRelativeHint={initialRelativeHint}
          treeId={currentTree.id}
        />
      )}

      {personForProfile && (
        <PersonProfileModal
          person={personForProfile}
          isOpen={Boolean(personForProfile)}
          onClose={() => setPersonForProfile(null)}
          onEdit={handleEditPerson}
          onDelete={handleDeletePerson}
          onViewInTree={handleViewInTree}
          onCalculateKinship={handleCalculateKinship}
          onSelectRelative={p => setPersonForProfile(p)}
          onAddRelative={handleAddRelative}
          people={treePeople}
          relationships={treeRelationships}
          events={treeEvents}
          media={treeMedia}
        />
      )}

      {personToDelete && (
        <ConfirmDeleteModal
          isOpen={Boolean(personToDelete)}
          person={personToDelete}
          onClose={() => setPersonToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {isImportModalOpen && (
        <ImportExportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          appState={appState}
          onImportState={handleImportState}
          onImportPeopleFromCSV={handleImportPeopleFromCSV}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={user => {
            setCurrentUser(user);
            showToast(`Sessão iniciada como ${user.displayName || user.email}!`);
          }}
        />
      )}

      {isHelpModalOpen && (
        <HelpModal
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
        />
      )}

    </div>
  );
}
