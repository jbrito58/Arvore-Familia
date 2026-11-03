export type Gender = 'M' | 'F' | 'O' | 'U'; // Masculino, Feminino, Outro, Não especificado

export type RecordStatus = 'completo' | 'incompleto' | 'em_pesquisa';

export interface Person {
  id: string;
  treeId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  nickname?: string;
  gender: Gender;
  profilePhoto?: string;
  
  // Nascimento
  birthDate?: string;
  birthDateApproximate?: boolean;
  birthPlace?: string;
  birthCountry?: string;
  
  // Falecimento
  isLiving: boolean;
  deathDate?: string;
  deathDateApproximate?: boolean;
  deathPlace?: string;
  burialPlace?: string;
  
  // Conteúdo histórico
  biography?: string;
  notes?: string;
  recordStatus: RecordStatus;
  
  // Metadados
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type RelationshipType = 
  | 'parent'     // person1Id é pai/mãe de person2Id
  | 'child'      // person1Id é filho de person2Id
  | 'spouse'     // Casados / união estável
  | 'ex_spouse'  // Ex-cônjuge / divorciados
  | 'sibling';   // Irmãos diretos

export type ParentType = 'biological' | 'adoptive' | 'guardian';

export interface Relationship {
  id: string;
  treeId: string;
  person1Id: string;
  person2Id: string;
  relationshipType: RelationshipType;
  parentType?: ParentType;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EventType = 
  | 'birth'
  | 'baptism'
  | 'wedding'
  | 'divorce'
  | 'relocation'
  | 'education'
  | 'career'
  | 'death'
  | 'other';

export interface FamilyEvent {
  id: string;
  treeId: string;
  personIds: string[];
  eventType: EventType;
  title: string;
  date?: string;
  dateApproximate?: boolean;
  location?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  createdAt: string;
}

export type MediaType = 'photo' | 'document' | 'audio' | 'video' | 'letter' | 'recipe';

export interface FamilyMedia {
  id: string;
  treeId: string;
  personIds: string[];
  eventIds?: string[];
  fileType: MediaType;
  fileURL: string;
  thumbnailURL?: string;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  source?: string;
  usageRightsNotes?: string;
  createdAt: string;
}

export interface FamilyTree {
  id: string;
  name: string;
  surname: string;
  description?: string;
  coverImage?: string;
  ownerId: string;
  referencePersonId?: string;
  privacy: 'private' | 'family' | 'public';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: 'owner' | 'admin' | 'collaborator' | 'reader';
}

export interface KinshipPathStep {
  person: Person;
  relationToNext: string;
  direction: 'parent' | 'child' | 'spouse' | 'sibling';
}

export interface KinshipResult {
  person1: Person;
  person2: Person;
  relationshipName: string;
  path: KinshipPathStep[];
  commonAncestor?: Person;
  generationDifference: number;
  stepsCount: number;
}
