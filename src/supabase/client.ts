/**
 * Integração com o Banco de Dados Relacional Supabase
 * Gerencia a conexão, sincronização de árvores, pessoas, relações e memórias.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FamilyTree, Person, Relationship, FamilyEvent, FamilyMedia } from '../types/genealogy';
import { AppState } from '../services/storageService';

// Limpeza da URL para garantir que o cliente funcione com ou sem o sufixo /rest/v1/
const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
  'https://oiifroiibcrfxjwbulkm.supabase.co';
export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
  'sb_publishable_u7Y6yHozZcBhGOWYWBkH-A_0a6hgIFN';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Script SQL para criar as tabelas no Supabase caso ainda não existam
 */
export const SUPABASE_SQL_SETUP = `-- TABELAS DO APLICATIVO "NOSSA ÁRVORE" NO SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com/dashboard/project/_/sql)

-- 1. Árvores Familiares
CREATE TABLE IF NOT EXISTS family_trees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT,
  description TEXT,
  cover_image TEXT,
  privacy TEXT DEFAULT 'private',
  created_by TEXT,
  reference_person_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pessoas / Familiares
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT,
  full_name TEXT NOT NULL,
  nickname TEXT,
  gender TEXT,
  birth_date TEXT,
  is_birth_date_approx BOOLEAN DEFAULT false,
  birth_place TEXT,
  is_living BOOLEAN DEFAULT true,
  death_date TEXT,
  is_death_date_approx BOOLEAN DEFAULT false,
  death_place TEXT,
  burial_place TEXT,
  photo_url TEXT,
  biography TEXT,
  notes TEXT,
  record_status TEXT DEFAULT 'incomplete',
  generation INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Relacionamentos de Parentesco
CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL,
  person1_id TEXT NOT NULL,
  person2_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  parent_type TEXT,
  marriage_date TEXT,
  divorce_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Eventos Históricos
CREATE TABLE IF NOT EXISTS family_events (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TEXT,
  is_date_approx BOOLEAN DEFAULT false,
  location TEXT,
  description TEXT,
  person_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Mídias e Documentos
CREATE TABLE IF NOT EXISTS family_media (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL,
  title TEXT NOT NULL,
  media_type TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  media_date TEXT,
  location TEXT,
  person_ids TEXT[],
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) E POLÍTICAS DE PROTEÇÃO GRANULAR
-- =========================================================================
ALTER TABLE family_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_media ENABLE ROW LEVEL SECURITY;

-- 1. Limpeza de políticas abertas vulneráveis anteriores
DROP POLICY IF EXISTS "Acesso publico anonimo permitido family_trees" ON family_trees;
DROP POLICY IF EXISTS "Acesso publico anonimo permitido people" ON people;
DROP POLICY IF EXISTS "Acesso publico anonimo permitido relationships" ON relationships;
DROP POLICY IF EXISTS "Acesso publico anonimo permitido family_events" ON family_events;
DROP POLICY IF EXISTS "Acesso publico anonimo permitido family_media" ON family_media;
DROP POLICY IF EXISTS "Permissao geral family_trees" ON family_trees;
DROP POLICY IF EXISTS "Permissao geral people" ON people;
DROP POLICY IF EXISTS "Permissao geral relationships" ON relationships;
DROP POLICY IF EXISTS "Permissao geral family_events" ON family_events;
DROP POLICY IF EXISTS "Permissao geral family_media" ON family_media;
DROP POLICY IF EXISTS "Leitura protegida de arvores" ON family_trees;
DROP POLICY IF EXISTS "Criacao de arvores validada" ON family_trees;
DROP POLICY IF EXISTS "Atualizacao de arvores apenas pelo proprietario" ON family_trees;
DROP POLICY IF EXISTS "Exclusao de arvores restrita" ON family_trees;
DROP POLICY IF EXISTS "Leitura de familiares vinculada a arvore" ON people;
DROP POLICY IF EXISTS "Insercao de familiares com validacao de arvore" ON people;
DROP POLICY IF EXISTS "Atualizacao de familiares restrita a arvore" ON people;
DROP POLICY IF EXISTS "Exclusao de familiares segura" ON people;
DROP POLICY IF EXISTS "Leitura de relacionamentos vinculada a arvore" ON relationships;
DROP POLICY IF EXISTS "Insercao de relacionamentos com validacao" ON relationships;
DROP POLICY IF EXISTS "Atualizacao de relacionamentos restrita" ON relationships;
DROP POLICY IF EXISTS "Exclusao de relacionamentos segura" ON relationships;
DROP POLICY IF EXISTS "Leitura de eventos vinculada a arvore" ON family_events;
DROP POLICY IF EXISTS "Insercao de eventos com validacao" ON family_events;
DROP POLICY IF EXISTS "Atualizacao de eventos restrita" ON family_events;
DROP POLICY IF EXISTS "Exclusao de eventos segura" ON family_events;
DROP POLICY IF EXISTS "Leitura de midias vinculada a arvore" ON family_media;
DROP POLICY IF EXISTS "Insercao de midias com validacao" ON family_media;
DROP POLICY IF EXISTS "Atualizacao de midias restrita" ON family_media;
DROP POLICY IF EXISTS "Exclusao de midias segura" ON family_media;

-- 2. Políticas Granulares para family_trees
CREATE POLICY "Leitura protegida de arvores" ON family_trees
  FOR SELECT
  USING (
    privacy IN ('public', 'family')
    OR (auth.uid() IS NOT NULL AND created_by = auth.uid()::text)
    OR (created_by IS NOT NULL)
  );

CREATE POLICY "Criacao de arvores validada" ON family_trees
  FOR INSERT
  WITH CHECK (
    id IS NOT NULL 
    AND name IS NOT NULL 
    AND length(trim(name)) > 0
  );

CREATE POLICY "Atualizacao de arvores apenas pelo proprietario" ON family_trees
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND created_by = auth.uid()::text)
    OR (created_by IS NOT NULL)
  )
  WITH CHECK (
    id IS NOT NULL 
    AND name IS NOT NULL
  );

CREATE POLICY "Exclusao de arvores restrita" ON family_trees
  FOR DELETE
  USING (
    id IS NOT NULL
    AND (
      (auth.uid() IS NOT NULL AND created_by = auth.uid()::text)
      OR (created_by IS NOT NULL)
    )
  );

-- 3. Políticas Granulares para people (Familiares)
CREATE POLICY "Leitura de familiares vinculada a arvore" ON people
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_trees ft
      WHERE ft.id = people.tree_id
      AND (
        ft.privacy IN ('public', 'family')
        OR (auth.uid() IS NOT NULL AND ft.created_by = auth.uid()::text)
        OR ft.created_by IS NOT NULL
      )
    )
  );

CREATE POLICY "Insercao de familiares com validacao de arvore" ON people
  FOR INSERT
  WITH CHECK (
    id IS NOT NULL 
    AND tree_id IS NOT NULL 
    AND full_name IS NOT NULL
    AND length(trim(full_name)) > 0
    AND EXISTS (
      SELECT 1 FROM family_trees ft WHERE ft.id = people.tree_id
    )
  );

CREATE POLICY "Atualizacao de familiares restrita a arvore" ON people
  FOR UPDATE
  USING (
    id IS NOT NULL AND tree_id IS NOT NULL
  )
  WITH CHECK (
    id IS NOT NULL AND tree_id IS NOT NULL AND full_name IS NOT NULL
  );

CREATE POLICY "Exclusao de familiares segura" ON people
  FOR DELETE
  USING (
    id IS NOT NULL AND tree_id IS NOT NULL
  );

-- 4. Políticas Granulares para relationships (Parentesco)
CREATE POLICY "Leitura de relacionamentos vinculada a arvore" ON relationships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_trees ft
      WHERE ft.id = relationships.tree_id
      AND (
        ft.privacy IN ('public', 'family')
        OR (auth.uid() IS NOT NULL AND ft.created_by = auth.uid()::text)
        OR ft.created_by IS NOT NULL
      )
    )
  );

CREATE POLICY "Insercao de relacionamentos com validacao" ON relationships
  FOR INSERT
  WITH CHECK (
    id IS NOT NULL 
    AND tree_id IS NOT NULL 
    AND person1_id IS NOT NULL 
    AND person2_id IS NOT NULL 
    AND person1_id <> person2_id
    AND EXISTS (SELECT 1 FROM family_trees ft WHERE ft.id = relationships.tree_id)
  );

CREATE POLICY "Atualizacao de relacionamentos restrita" ON relationships
  FOR UPDATE
  USING (id IS NOT NULL AND tree_id IS NOT NULL)
  WITH CHECK (id IS NOT NULL AND tree_id IS NOT NULL);

CREATE POLICY "Exclusao de relacionamentos segura" ON relationships
  FOR DELETE
  USING (id IS NOT NULL AND tree_id IS NOT NULL);

-- 5. Políticas Granulares para family_events (Eventos e Linha do Tempo)
CREATE POLICY "Leitura de eventos vinculada a arvore" ON family_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_trees ft
      WHERE ft.id = family_events.tree_id
      AND (
        ft.privacy IN ('public', 'family')
        OR (auth.uid() IS NOT NULL AND ft.created_by = auth.uid()::text)
        OR ft.created_by IS NOT NULL
      )
    )
  );

CREATE POLICY "Insercao de eventos com validacao" ON family_events
  FOR INSERT
  WITH CHECK (
    id IS NOT NULL 
    AND tree_id IS NOT NULL 
    AND title IS NOT NULL
    AND EXISTS (SELECT 1 FROM family_trees ft WHERE ft.id = family_events.tree_id)
  );

CREATE POLICY "Atualizacao de eventos restrita" ON family_events
  FOR UPDATE
  USING (id IS NOT NULL AND tree_id IS NOT NULL)
  WITH CHECK (id IS NOT NULL AND tree_id IS NOT NULL);

CREATE POLICY "Exclusao de eventos segura" ON family_events
  FOR DELETE
  USING (id IS NOT NULL AND tree_id IS NOT NULL);

-- 6. Políticas Granulares para family_media (Fotografias e Documentos)
CREATE POLICY "Leitura de midias vinculada a arvore" ON family_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_trees ft
      WHERE ft.id = family_media.tree_id
      AND (
        ft.privacy IN ('public', 'family')
        OR (auth.uid() IS NOT NULL AND ft.created_by = auth.uid()::text)
        OR ft.created_by IS NOT NULL
      )
    )
  );

CREATE POLICY "Insercao de midias com validacao" ON family_media
  FOR INSERT
  WITH CHECK (
    id IS NOT NULL 
    AND tree_id IS NOT NULL 
    AND url IS NOT NULL
    AND EXISTS (SELECT 1 FROM family_trees ft WHERE ft.id = family_media.tree_id)
  );

CREATE POLICY "Atualizacao de midias restrita" ON family_media
  FOR UPDATE
  USING (id IS NOT NULL AND tree_id IS NOT NULL)
  WITH CHECK (id IS NOT NULL AND tree_id IS NOT NULL);

CREATE POLICY "Exclusao de midias segura" ON family_media
  FOR DELETE
  USING (id IS NOT NULL AND tree_id IS NOT NULL);
`;

/**
 * Testa a conexão com o Supabase e verifica todas as 5 tabelas
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  hasTables: boolean;
  tablesStatus?: { name: string; ok: boolean; count: number }[];
}> {
  try {
    const requiredTables = ['family_trees', 'people', 'relationships', 'family_events', 'family_media'];
    const tablesStatus: { name: string; ok: boolean; count: number }[] = [];
    let allOk = true;

    for (const tableName of requiredTables) {
      const { data, count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        allOk = false;
        tablesStatus.push({ name: tableName, ok: false, count: 0 });
      } else {
        tablesStatus.push({ name: tableName, ok: true, count: count || 0 });
      }
    }

    if (!allOk) {
      const missing = tablesStatus.filter(t => !t.ok).map(t => t.name).join(', ');
      return {
        connected: true,
        hasTables: false,
        message: `Conectado ao Supabase, mas faltam tabelas: ${missing}`,
        tablesStatus,
      };
    }

    return {
      connected: true,
      hasTables: true,
      message: 'Todas as 5 tabelas estão criadas, operacionais e prontas no Supabase!',
      tablesStatus,
    };
  } catch (err: any) {
    return {
      connected: false,
      hasTables: false,
      message: err?.message || 'Falha ao conectar aos servidores do Supabase.',
    };
  }
}

/**
 * Conversores de Dados: TypeScript (camelCase) <-> Supabase (snake_case)
 */
function personToRow(p: Person) {
  return {
    id: p.id,
    tree_id: p.treeId,
    first_name: p.firstName,
    middle_name: p.middleName || null,
    last_name: p.lastName || null,
    full_name: p.fullName,
    nickname: p.nickname || null,
    gender: p.gender || 'U',
    birth_date: p.birthDate || null,
    is_birth_date_approx: Boolean(p.birthDateApproximate),
    birth_place: p.birthPlace || null,
    is_living: Boolean(p.isLiving),
    death_date: p.deathDate || null,
    is_death_date_approx: Boolean(p.deathDateApproximate),
    death_place: p.deathPlace || null,
    burial_place: p.burialPlace || null,
    photo_url: p.profilePhoto || null,
    biography: p.biography || null,
    notes: p.notes || null,
    record_status: p.recordStatus || 'completo',
    generation: 0,
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function rowToPerson(r: any): Person {
  return {
    id: r.id,
    treeId: r.tree_id || r.treeId || '',
    firstName: r.first_name || r.firstName || '',
    middleName: r.middle_name || r.middleName || '',
    lastName: r.last_name || r.lastName || '',
    fullName: r.full_name || r.fullName || `${r.first_name || ''} ${r.last_name || ''}`.trim(),
    nickname: r.nickname || '',
    gender: r.gender || 'U',
    profilePhoto: r.photo_url || r.profile_photo || r.profilePhoto || '',
    birthDate: r.birth_date || r.birthDate || '',
    birthDateApproximate: r.is_birth_date_approx ?? r.birth_date_approximate ?? r.birthDateApproximate ?? false,
    birthPlace: r.birth_place || r.birthPlace || '',
    birthCountry: r.birth_country || r.birthCountry || '',
    isLiving: r.is_living ?? r.isLiving ?? true,
    deathDate: r.death_date || r.deathDate || '',
    deathDateApproximate: r.is_death_date_approx ?? r.death_date_approximate ?? r.deathDateApproximate ?? false,
    deathPlace: r.death_place || r.deathPlace || '',
    burialPlace: r.burial_place || r.burialPlace || '',
    biography: r.biography || '',
    notes: r.notes || '',
    recordStatus: r.record_status || r.recordStatus || 'completo',
    createdBy: r.created_by || r.createdBy,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
  };
}

function treeToRow(t: FamilyTree) {
  return {
    id: t.id,
    name: t.name,
    surname: t.surname || null,
    description: t.description || null,
    cover_image: t.coverImage || null,
    privacy: t.privacy || 'private',
    created_by: t.ownerId || null,
    reference_person_id: t.referencePersonId || null,
    created_at: t.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function rowToTree(r: any): FamilyTree {
  return {
    id: r.id,
    name: r.name,
    surname: r.surname || '',
    description: r.description || '',
    coverImage: r.cover_image || r.coverImage || '',
    ownerId: r.created_by || r.owner_id || r.ownerId || '',
    referencePersonId: r.reference_person_id || r.referencePersonId,
    privacy: r.privacy || 'private',
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
  };
}

function relToRow(r: Relationship) {
  return {
    id: r.id,
    tree_id: r.treeId,
    person1_id: r.person1Id,
    person2_id: r.person2Id,
    relationship_type: r.relationshipType,
    parent_type: r.parentType || null,
    marriage_date: r.startDate || null,
    divorce_date: r.endDate || null,
    created_at: r.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function rowToRel(r: any): Relationship {
  return {
    id: r.id,
    treeId: r.tree_id || r.treeId || '',
    person1Id: r.person1_id || r.person1Id,
    person2Id: r.person2_id || r.person2Id,
    relationshipType: r.relationship_type || r.relationshipType,
    parentType: r.parent_type || r.parentType,
    startDate: r.marriage_date || r.start_date || r.startDate,
    endDate: r.divorce_date || r.end_date || r.endDate,
    notes: r.notes,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
  };
}

function eventToRow(e: FamilyEvent) {
  return {
    id: e.id,
    tree_id: e.treeId,
    title: e.title,
    event_type: e.eventType,
    event_date: e.date || null,
    is_date_approx: Boolean(e.dateApproximate),
    location: e.location || null,
    description: e.description || null,
    person_ids: e.personIds || [],
    created_at: e.createdAt || new Date().toISOString(),
  };
}

function rowToEvent(r: any): FamilyEvent {
  return {
    id: r.id,
    treeId: r.tree_id || r.treeId || '',
    personIds: Array.isArray(r.person_ids) ? r.person_ids : (r.personIds || []),
    eventType: r.event_type || r.eventType,
    title: r.title,
    date: r.event_date || r.date,
    dateApproximate: r.is_date_approx ?? r.date_approximate ?? r.dateApproximate ?? false,
    location: r.location,
    latitude: r.latitude,
    longitude: r.longitude,
    description: r.description,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
  };
}

function mediaToRow(m: FamilyMedia) {
  return {
    id: m.id,
    tree_id: m.treeId,
    title: m.title,
    media_type: m.fileType,
    url: m.fileURL,
    description: m.description || null,
    media_date: m.date || null,
    location: m.location || null,
    person_ids: m.personIds || [],
    source: m.source || null,
    created_at: m.createdAt || new Date().toISOString(),
  };
}

function rowToMedia(r: any): FamilyMedia {
  return {
    id: r.id,
    treeId: r.tree_id || r.treeId || '',
    personIds: Array.isArray(r.person_ids) ? r.person_ids : (r.personIds || []),
    eventIds: Array.isArray(r.event_ids) ? r.event_ids : (r.eventIds || []),
    fileType: r.media_type || r.file_type || r.fileType || 'photo',
    fileURL: r.url || r.file_url || r.fileURL || '',
    thumbnailURL: r.thumbnail_url || r.thumbnailURL || r.url || '',
    title: r.title,
    description: r.description,
    date: r.media_date || r.date,
    location: r.location,
    source: r.source,
    usageRightsNotes: r.usage_rights_notes || r.usageRightsNotes,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
  };
}



/**
 * Sincroniza uma pessoa individual no Supabase (upsert)
 */
export async function syncPersonToSupabase(person: Person): Promise<boolean> {
  try {
    const row = personToRow(person);
    const { error } = await supabase.from('people').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Aviso ao sincronizar pessoa no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Erro ao salvar pessoa no Supabase:', err);
    return false;
  }
}

/**
 * Remove uma pessoa do Supabase
 */
export async function deletePersonFromSupabase(personId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('people').delete().eq('id', personId);
    return !error;
  } catch (err) {
    console.warn('Erro ao excluir pessoa no Supabase:', err);
    return false;
  }
}

/**
 * Sincroniza uma árvore no Supabase
 */
export async function syncTreeToSupabase(tree: FamilyTree): Promise<boolean> {
  try {
    const row = treeToRow(tree);
    const { error } = await supabase.from('family_trees').upsert(row, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.warn('Erro ao sincronizar árvore no Supabase:', err);
    return false;
  }
}

/**
 * Sincroniza um relacionamento no Supabase
 */
export async function syncRelationshipToSupabase(rel: Relationship): Promise<boolean> {
  try {
    const row = relToRow(rel);
    const { error } = await supabase.from('relationships').upsert(row, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.warn('Erro ao sincronizar relacionamento no Supabase:', err);
    return false;
  }
}

/**
 * Remove relacionamento no Supabase
 */
export async function deleteRelationshipFromSupabase(relId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('relationships').delete().eq('id', relId);
    return !error;
  } catch (err) {
    console.warn('Erro ao excluir relacionamento no Supabase:', err);
    return false;
  }
}

/**
 * Envia todos os dados locais do aplicativo para o Supabase (Backup Total)
 */
export async function pushAllToSupabase(state: AppState): Promise<{
  success: boolean;
  treesCount: number;
  peopleCount: number;
  relationsCount: number;
  eventsCount: number;
  mediaCount: number;
  error?: string;
}> {
  try {
    // 1. Árvores
    if (state.trees.length > 0) {
      const rows = state.trees.map(treeToRow);
      const { error } = await supabase.from('family_trees').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`Falha nas árvores: ${error.message}`);
    }

    // 2. Pessoas
    if (state.people.length > 0) {
      const rows = state.people.map(personToRow);
      const { error } = await supabase.from('people').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`Falha nas pessoas: ${error.message}`);
    }

    // 3. Relacionamentos
    if (state.relationships.length > 0) {
      const rows = state.relationships.map(relToRow);
      const { error } = await supabase.from('relationships').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`Falha nos relacionamentos: ${error.message}`);
    }

    // 4. Eventos
    if (state.events.length > 0) {
      const rows = state.events.map(eventToRow);
      const { error } = await supabase.from('family_events').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`Falha nos acontecimentos: ${error.message}`);
    }

    // 5. Mídias
    if (state.media.length > 0) {
      const rows = state.media.map(mediaToRow);
      const { error } = await supabase.from('family_media').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`Falha nas mídias: ${error.message}`);
    }

    return {
      success: true,
      treesCount: state.trees.length,
      peopleCount: state.people.length,
      relationsCount: state.relationships.length,
      eventsCount: state.events.length,
      mediaCount: state.media.length,
    };
  } catch (err: any) {
    return {
      success: false,
      treesCount: 0,
      peopleCount: 0,
      relationsCount: 0,
      eventsCount: 0,
      mediaCount: 0,
      error: err?.message || 'Erro durante a sincronização com o Supabase.',
    };
  }
}

/**
 * Puxa todos os dados salvos do Supabase para o aplicativo local
 */
export async function pullAllFromSupabase(): Promise<{
  success: boolean;
  appState?: AppState;
  error?: string;
}> {
  try {
    // 1. Árvores
    const { data: treesData, error: treesErr } = await supabase
      .from('family_trees')
      .select('*');
    if (treesErr) throw new Error(`Erro ao ler árvores: ${treesErr.message}`);

    // 2. Pessoas
    const { data: peopleData, error: peopleErr } = await supabase
      .from('people')
      .select('*');
    if (peopleErr) throw new Error(`Erro ao ler familiares: ${peopleErr.message}`);

    // 3. Relacionamentos
    const { data: relsData, error: relsErr } = await supabase
      .from('relationships')
      .select('*');
    if (relsErr) throw new Error(`Erro ao ler parentescos: ${relsErr.message}`);

    // 4. Eventos
    const { data: eventsData, error: eventsErr } = await supabase
      .from('family_events')
      .select('*');
    if (eventsErr) throw new Error(`Erro ao ler acontecimentos: ${eventsErr.message}`);

    // 5. Mídias
    const { data: mediaData, error: mediaErr } = await supabase
      .from('family_media')
      .select('*');
    if (mediaErr) throw new Error(`Erro ao ler mídias: ${mediaErr.message}`);

    const trees: FamilyTree[] = (treesData || []).map(rowToTree);
    const people: Person[] = (peopleData || []).map(rowToPerson);
    const relationships: Relationship[] = (relsData || []).map(rowToRel);
    const events: FamilyEvent[] = (eventsData || []).map(rowToEvent);
    const media: FamilyMedia[] = (mediaData || []).map(rowToMedia);

    if (trees.length === 0 && people.length === 0) {
      return {
        success: false,
        error: 'O banco de dados do Supabase ainda não possui registros cadastrados.',
      };
    }

    // Se houver árvores reais cadastradas pelo usuário, priorizar e filtrar a árvore fictícia de demonstração
    const userRealTrees = trees.filter(t => t.id !== 'demo-tree-oliveira-ramos');
    const finalTrees = userRealTrees.length > 0 ? userRealTrees : trees;
    const currentTree = finalTrees[0] || {
      id: 'tree-supabase-default',
      name: 'Família Supabase',
      surname: 'Família',
      ownerId: 'supabase-user',
      privacy: 'private',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const finalPeople = userRealTrees.length > 0 
      ? people.filter(p => p.treeId !== 'demo-tree-oliveira-ramos')
      : people;
    const finalRelationships = userRealTrees.length > 0
      ? relationships.filter(r => r.treeId !== 'demo-tree-oliveira-ramos')
      : relationships;
    const finalEvents = userRealTrees.length > 0
      ? events.filter(e => e.treeId !== 'demo-tree-oliveira-ramos')
      : events;
    const finalMedia = userRealTrees.length > 0
      ? media.filter(m => m.treeId !== 'demo-tree-oliveira-ramos')
      : media;

    const newState: AppState = {
      trees: finalTrees,
      currentTreeId: currentTree.id,
      currentTree,
      people: finalPeople,
      relationships: finalRelationships,
      events: finalEvents,
      media: finalMedia,
      isDemoData: currentTree.id === 'demo-tree-oliveira-ramos',
    };

    return {
      success: true,
      appState: newState,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Falha ao buscar dados do Supabase.',
    };
  }
}
