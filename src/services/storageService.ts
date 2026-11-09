import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Person, Relationship, FamilyEvent, FamilyMedia, FamilyTree } from '../types/genealogy';
import { demoFamilyTree, demoPeople, demoRelationships, demoEvents, demoMedia, DEMO_TREE_ID } from '../data/demoFamily';

const STORAGE_KEY_PREFIX = 'nossa_arvore_';

export interface AppState {
  trees: FamilyTree[];
  currentTreeId: string;
  people: Person[];
  relationships: Relationship[];
  events: FamilyEvent[];
  media: FamilyMedia[];
  isDemoData: boolean;
  // Propriedade de compatibilidade retroativa
  currentTree?: FamilyTree;
}

export function getCurrentTree(state: AppState): FamilyTree {
  return state.trees.find(t => t.id === state.currentTreeId) || state.trees[0] || demoFamilyTree;
}

export function getPeopleForTree(people: Person[], treeId: string): Person[] {
  return people.filter(p => !p.treeId || p.treeId === treeId);
}

export function getRelationshipsForTree(relationships: Relationship[], treeId: string): Relationship[] {
  return relationships.filter(r => !r.treeId || r.treeId === treeId);
}

export function getEventsForTree(events: FamilyEvent[], treeId: string): FamilyEvent[] {
  return events.filter(e => !e.treeId || e.treeId === treeId);
}

export function getMediaForTree(media: FamilyMedia[], treeId: string): FamilyMedia[] {
  return media.filter(m => !m.treeId || m.treeId === treeId);
}

export function getInitialLocalState(): AppState {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}data`);
    if (saved) {
      const parsed = JSON.parse(saved);

      // Migração automática de versão com árvore única para múltiplas árvores
      let trees: FamilyTree[] = [];
      if (Array.isArray(parsed.trees) && parsed.trees.length > 0) {
        trees = parsed.trees;
      } else if (parsed.currentTree) {
        trees = [parsed.currentTree];
      } else {
        trees = [demoFamilyTree];
      }

      const currentTreeId = parsed.currentTreeId || parsed.currentTree?.id || trees[0].id;
      const people = Array.isArray(parsed.people) ? parsed.people : demoPeople;
      const relationships = Array.isArray(parsed.relationships) ? parsed.relationships : demoRelationships;
      const events = Array.isArray(parsed.events) ? parsed.events : demoEvents;
      const media = Array.isArray(parsed.media) ? parsed.media : demoMedia;

      const activeTree = trees.find(t => t.id === currentTreeId) || trees[0];

      return {
        trees,
        currentTreeId,
        currentTree: activeTree,
        people,
        relationships,
        events,
        media,
        isDemoData: parsed.isDemoData !== undefined ? parsed.isDemoData : (currentTreeId === DEMO_TREE_ID),
      };
    }
  } catch (err) {
    console.error('Erro ao ler estado do localStorage:', err);
  }

  // Padrão: dados de demonstração
  return {
    trees: [demoFamilyTree],
    currentTreeId: demoFamilyTree.id,
    currentTree: demoFamilyTree,
    people: demoPeople,
    relationships: demoRelationships,
    events: demoEvents,
    media: demoMedia,
    isDemoData: true,
  };
}

export function saveLocalState(state: AppState) {
  try {
    const activeTree = getCurrentTree(state);
    const toSave: AppState = {
      ...state,
      currentTree: activeTree,
    };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}data`, JSON.stringify(toSave));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
}

export function createNewTree(
  state: AppState,
  treeData: {
    name: string;
    surname: string;
    description: string;
    coverImage: string;
    privacy: 'private' | 'family' | 'public';
  },
  ownerId: string = 'local-user'
): { updatedState: AppState; newTree: FamilyTree } {
  const newId = 'tree-' + Date.now();
  const now = new Date().toISOString();

  const newTree: FamilyTree = {
    id: newId,
    name: treeData.name,
    surname: treeData.surname,
    description: treeData.description,
    coverImage: treeData.coverImage,
    ownerId,
    privacy: treeData.privacy,
    createdAt: now,
    updatedAt: now,
  };

  const updatedState: AppState = {
    ...state,
    trees: [...state.trees, newTree],
    currentTreeId: newId,
    currentTree: newTree,
    isDemoData: false,
  };

  saveLocalState(updatedState);
  return { updatedState, newTree };
}

export function switchTree(state: AppState, treeId: string): AppState {
  const tree = state.trees.find(t => t.id === treeId);
  if (!tree) return state;

  const updatedState: AppState = {
    ...state,
    currentTreeId: treeId,
    currentTree: tree,
    isDemoData: tree.id === DEMO_TREE_ID,
  };

  saveLocalState(updatedState);
  return updatedState;
}

export function deleteTree(state: AppState, treeId: string): AppState {
  if (state.trees.length <= 1) {
    return state;
  }

  const remainingTrees = state.trees.filter(t => t.id !== treeId);
  const remainingPeople = state.people.filter(p => p.treeId !== treeId);
  const remainingRelationships = state.relationships.filter(r => r.treeId !== treeId);
  const remainingEvents = state.events.filter(e => e.treeId !== treeId);
  const remainingMedia = state.media.filter(m => m.treeId !== treeId);

  const nextTreeId = state.currentTreeId === treeId ? remainingTrees[0].id : state.currentTreeId;
  const nextActiveTree = remainingTrees.find(t => t.id === nextTreeId) || remainingTrees[0];

  const updatedState: AppState = {
    ...state,
    trees: remainingTrees,
    currentTreeId: nextTreeId,
    currentTree: nextActiveTree,
    people: remainingPeople,
    relationships: remainingRelationships,
    events: remainingEvents,
    media: remainingMedia,
    isDemoData: nextTreeId === DEMO_TREE_ID,
  };

  saveLocalState(updatedState);
  return updatedState;
}

export function resetToEmptyTree(ownerId: string = 'local-user'): AppState {
  const newTree: FamilyTree = {
    id: 'tree-' + Date.now(),
    name: 'Minha Família',
    surname: 'Família',
    description: 'Árvore genealógica recém-iniciada.',
    ownerId,
    privacy: 'private',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const emptyState: AppState = {
    trees: [newTree],
    currentTreeId: newTree.id,
    currentTree: newTree,
    people: [],
    relationships: [],
    events: [],
    media: [],
    isDemoData: false,
  };

  saveLocalState(emptyState);
  return emptyState;
}

export function restoreDemoState(): AppState {
  const demoState: AppState = {
    trees: [demoFamilyTree],
    currentTreeId: demoFamilyTree.id,
    currentTree: demoFamilyTree,
    people: demoPeople,
    relationships: demoRelationships,
    events: demoEvents,
    media: demoMedia,
    isDemoData: true,
  };
  saveLocalState(demoState);
  return demoState;
}

/**
 * Sincronização e Salvamento no Firestore (quando logado)
 */
export async function syncTreeToFirestore(tree: FamilyTree, userId: string) {
  try {
    await setDoc(doc(db, 'familyTrees', tree.id), {
      ...tree,
      ownerId: userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `familyTrees/${tree.id}`);
  }
}

export async function deleteTreeFromFirestore(treeId: string) {
  try {
    await deleteDoc(doc(db, 'familyTrees', treeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `familyTrees/${treeId}`);
  }
}

export async function syncPersonToFirestore(person: Person, userId: string) {
  try {
    await setDoc(doc(db, 'people', person.id), {
      ...person,
      createdBy: userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `people/${person.id}`);
  }
}

export async function deletePersonFromFirestore(personId: string) {
  try {
    await deleteDoc(doc(db, 'people', personId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `people/${personId}`);
  }
}

export async function syncRelationshipToFirestore(rel: Relationship, userId?: string) {
  try {
    await setDoc(doc(db, 'relationships', rel.id), {
      ...rel,
      ...(userId ? { createdBy: userId } : {}),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `relationships/${rel.id}`);
  }
}

export async function deleteRelationshipFromFirestore(relId: string) {
  try {
    await deleteDoc(doc(db, 'relationships', relId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `relationships/${relId}`);
  }
}

export async function loadUserDataFromFirestore(userId: string): Promise<AppState | null> {
  try {
    const qTrees = query(collection(db, 'familyTrees'), where('ownerId', '==', userId));
    const treeSnap = await getDocs(qTrees);
    if (treeSnap.empty) return null;

    const trees = treeSnap.docs.map(d => d.data() as FamilyTree);
    const currentTree = trees[0];
    const treeIds = trees.map(t => t.id);

    // Carregar pessoas
    const qPeople = query(collection(db, 'people'), where('treeId', 'in', treeIds.slice(0, 10)));
    const peopleSnap = await getDocs(qPeople);
    const people = peopleSnap.docs.map(d => d.data() as Person);

    // Carregar relacionamentos
    const qRels = query(collection(db, 'relationships'), where('treeId', 'in', treeIds.slice(0, 10)));
    const relsSnap = await getDocs(qRels);
    const relationships = relsSnap.docs.map(d => d.data() as Relationship);

    // Carregar eventos
    const qEvents = query(collection(db, 'events'), where('treeId', 'in', treeIds.slice(0, 10)));
    const eventsSnap = await getDocs(qEvents);
    const events = eventsSnap.docs.map(d => d.data() as FamilyEvent);

    // Carregar mídias
    const qMedia = query(collection(db, 'media'), where('treeId', 'in', treeIds.slice(0, 10)));
    const mediaSnap = await getDocs(qMedia);
    const media = mediaSnap.docs.map(d => d.data() as FamilyMedia);

    return {
      trees,
      currentTreeId: currentTree.id,
      currentTree,
      people,
      relationships,
      events,
      media,
      isDemoData: false,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'familyTrees');
    return null;
  }
}

/**
 * Utilitários de Exportação e Importação (JSON e CSV)
 */
export function exportToJSON(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function exportPeopleToCSV(people: Person[]): string {
  const headers = [
    'ID',
    'Nome Completo',
    'Primeiro Nome',
    'Sobrenome',
    'Apelido',
    'Gênero',
    'Data de Nascimento',
    'Local de Nascimento',
    'Vivo',
    'Data de Falecimento',
    'Local de Falecimento',
    'Biografia',
  ];

  const escapeCSV = (val?: string | boolean | number) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = people.map(p => [
    escapeCSV(p.id),
    escapeCSV(p.fullName),
    escapeCSV(p.firstName),
    escapeCSV(p.lastName),
    escapeCSV(p.nickname || ''),
    escapeCSV(p.gender),
    escapeCSV(p.birthDate || ''),
    escapeCSV(p.birthPlace || ''),
    escapeCSV(p.isLiving ? 'Sim' : 'Não'),
    escapeCSV(p.deathDate || ''),
    escapeCSV(p.deathPlace || ''),
    escapeCSV(p.biography || ''),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function parsePeopleFromCSV(csvText: string, treeId: string): Person[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const people: Person[] = [];
  const now = new Date().toISOString();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts: string[] = [];
    let insideQuotes = false;
    let currentPart = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' && (c === 0 || line[c - 1] !== '\\')) {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        parts.push(currentPart.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart.replace(/^"|"$/g, '').replace(/""/g, '"').trim());

    if (parts.length >= 2) {
      const fullName = parts[1] || parts[2] || 'Sem Nome';
      const firstName = parts[2] || fullName.split(' ')[0] || 'Familiar';
      const lastName = parts[3] || fullName.split(' ').slice(1).join(' ') || '';

      people.push({
        id: parts[0] || 'csv-' + Date.now() + '-' + i,
        treeId,
        fullName,
        firstName,
        lastName,
        nickname: parts[4] || '',
        gender: (parts[5] === 'F' ? 'F' : 'M'),
        birthDate: parts[6] || '',
        birthPlace: parts[7] || '',
        isLiving: parts[8]?.toLowerCase() !== 'não' && parts[8]?.toLowerCase() !== 'nao' && parts[8]?.toLowerCase() !== 'false',
        deathDate: parts[9] || '',
        deathPlace: parts[10] || '',
        biography: parts[11] || '',
        recordStatus: 'em_pesquisa',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return people;
}
