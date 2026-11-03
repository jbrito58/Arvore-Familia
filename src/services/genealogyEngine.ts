import { Person, Relationship, KinshipResult, KinshipPathStep } from '../types/genealogy';

/**
 * Normaliza strings para busca e comparação
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Retorna todos os pais de uma pessoa
 */
export function getParents(personId: string, relationships: Relationship[], people: Person[]): Person[] {
  const parentRels = relationships.filter(
    r => (r.relationshipType === 'parent' && r.person2Id === personId) ||
         (r.relationshipType === 'child' && r.person1Id === personId)
  );
  const parentIds = parentRels.map(r => r.relationshipType === 'parent' ? r.person1Id : r.person2Id);
  return people.filter(p => parentIds.includes(p.id));
}

/**
 * Retorna todos os filhos de uma pessoa
 */
export function getChildren(personId: string, relationships: Relationship[], people: Person[]): Person[] {
  const childRels = relationships.filter(
    r => (r.relationshipType === 'parent' && r.person1Id === personId) ||
         (r.relationshipType === 'child' && r.person2Id === personId)
  );
  const childIds = childRels.map(r => r.relationshipType === 'parent' ? r.person2Id : r.person1Id);
  return people.filter(p => childIds.includes(p.id));
}

/**
 * Retorna cônjuges atuais e passados
 */
export function getSpouses(personId: string, relationships: Relationship[], people: Person[]): { person: Person; isCurrent: boolean }[] {
  const spouseRels = relationships.filter(
    r => (r.relationshipType === 'spouse' || r.relationshipType === 'ex_spouse') &&
         (r.person1Id === personId || r.person2Id === personId)
  );
  return spouseRels.map(r => {
    const spouseId = r.person1Id === personId ? r.person2Id : r.person1Id;
    const person = people.find(p => p.id === spouseId);
    return {
      person: person!,
      isCurrent: r.relationshipType === 'spouse',
    };
  }).filter(item => Boolean(item.person));
}

/**
 * Retorna irmãos de uma pessoa (compartilham pelo menos um pai/mãe ou registrados explicitamente)
 */
export function getSiblings(personId: string, relationships: Relationship[], people: Person[]): Person[] {
  const parents = getParents(personId, relationships, people);
  const siblingIds = new Set<string>();

  // Irmãos pelos pais
  parents.forEach(parent => {
    const children = getChildren(parent.id, relationships, people);
    children.forEach(child => {
      if (child.id !== personId) {
        siblingIds.add(child.id);
      }
    });
  });

  // Irmãos explícitos
  relationships
    .filter(r => r.relationshipType === 'sibling' && (r.person1Id === personId || r.person2Id === personId))
    .forEach(r => {
      const otherId = r.person1Id === personId ? r.person2Id : r.person1Id;
      if (otherId !== personId) siblingIds.add(otherId);
    });

  return people.filter(p => siblingIds.has(p.id));
}

/**
 * Verifica se já existe um caminho de ancestralidade para prevenir ciclos
 * Ex: Se B já é ancestral de A, A não pode se tornar pai de B.
 */
export function wouldCreateCycle(
  parentCandidateId: string,
  childCandidateId: string,
  relationships: Relationship[]
): boolean {
  if (parentCandidateId === childCandidateId) return true;

  // DFS para verificar se parentCandidateId é descendente de childCandidateId
  const visited = new Set<string>();
  const queue = [childCandidateId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === parentCandidateId) {
      return true; // Ciclo encontrado!
    }

    if (!visited.has(current)) {
      visited.add(current);
      // Pega filhos de current
      const childRels = relationships.filter(
        r => (r.relationshipType === 'parent' && r.person1Id === current) ||
             (r.relationshipType === 'child' && r.person2Id === current)
      );
      childRels.forEach(r => {
        const nextId = r.relationshipType === 'parent' ? r.person2Id : r.person1Id;
        if (!visited.has(nextId)) queue.push(nextId);
      });
    }
  }

  return false;
}

/**
 * Validação de coerência cronológica
 */
export interface ChronologyAlert {
  type: 'warning' | 'error';
  message: string;
}

export function validatePersonChronology(
  person: Partial<Person>,
  parents: Person[] = []
): ChronologyAlert[] {
  const alerts: ChronologyAlert[] = [];

  const parseYear = (dateStr?: string) => {
    if (!dateStr) return null;
    const match = dateStr.match(/\b(18|19|20)\d{2}\b/);
    return match ? parseInt(match[0], 10) : null;
  };

  const birthYear = parseYear(person.birthDate);
  const deathYear = parseYear(person.deathDate);

  if (birthYear && deathYear && deathYear < birthYear) {
    alerts.push({
      type: 'error',
      message: `Ano de falecimento (${deathYear}) é anterior ao nascimento (${birthYear}).`,
    });
  }

  if (birthYear && deathYear && deathYear - birthYear > 125) {
    alerts.push({
      type: 'warning',
      message: `Idade calculada (${deathYear - birthYear} anos) é incomum. Verifique as datas.`,
    });
  }

  parents.forEach(parent => {
    const parentBirth = parseYear(parent.birthDate);
    const parentDeath = parseYear(parent.deathDate);

    if (birthYear && parentBirth) {
      const ageAtBirth = birthYear - parentBirth;
      if (ageAtBirth < 12) {
        alerts.push({
          type: 'warning',
          message: `${parent.fullName} teria ${ageAtBirth} anos quando ${person.fullName || 'a pessoa'} nasceu.`,
        });
      }
      if (ageAtBirth > 75) {
        alerts.push({
          type: 'warning',
          message: `${parent.fullName} teria ${ageAtBirth} anos no nascimento do filho.`,
        });
      }
    }

    if (birthYear && parentDeath && parentDeath < birthYear) {
      alerts.push({
        type: 'warning',
        message: `${parent.fullName} faleceu em ${parentDeath}, antes do nascimento do filho em ${birthYear}.`,
      });
    }
  });

  return alerts;
}

/**
 * Detecção de Duplicidades
 */
export interface DuplicateMatch {
  person: Person;
  similarityScore: number; // 0 a 100
  reasons: string[];
}

export function detectDuplicates(
  candidate: Partial<Person>,
  existingPeople: Person[],
  currentId?: string
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const candidateNormName = normalizeText(candidate.fullName || `${candidate.firstName || ''} ${candidate.lastName || ''}`);

  if (!candidateNormName) return matches;

  for (const person of existingPeople) {
    if (currentId && person.id === currentId) continue;

    let score = 0;
    const reasons: string[] = [];
    const personNormName = normalizeText(person.fullName);

    // Comparação de Nome
    if (personNormName === candidateNormName) {
      score += 60;
      reasons.push('Nome idêntico');
    } else if (
      candidateNormName.includes(personNormName) ||
      personNormName.includes(candidateNormName)
    ) {
      score += 40;
      reasons.push('Nome muito semelhante');
    }

    // Data de nascimento
    if (candidate.birthDate && person.birthDate) {
      if (candidate.birthDate === person.birthDate) {
        score += 30;
        reasons.push('Data de nascimento idêntica');
      } else {
        const y1 = candidate.birthDate.substring(0, 4);
        const y2 = person.birthDate.substring(0, 4);
        if (y1 === y2 && y1.length === 4) {
          score += 15;
          reasons.push(`Mesmo ano de nascimento (${y1})`);
        }
      }
    }

    // Local de nascimento
    if (
      candidate.birthPlace &&
      person.birthPlace &&
      normalizeText(candidate.birthPlace) === normalizeText(person.birthPlace)
    ) {
      score += 15;
      reasons.push('Mesmo local de nascimento');
    }

    if (score >= 40) {
      matches.push({
        person,
        similarityScore: Math.min(100, score),
        reasons,
      });
    }
  }

  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Calculador de Parentesco (Qual é o Parentesco?)
 * Utiliza BFS em grafo não direcionado com arestas rotuladas para determinar o parentesco exato em português.
 */
interface GraphNode {
  personId: string;
  relationFromPrevious: string;
  direction: 'parent' | 'child' | 'spouse' | 'sibling';
  path: { personId: string; relation: string; direction: 'parent' | 'child' | 'spouse' | 'sibling' }[];
}

export function calculateKinship(
  person1Id: string,
  person2Id: string,
  people: Person[],
  relationships: Relationship[]
): KinshipResult | null {
  if (person1Id === person2Id) {
    const p = people.find(x => x.id === person1Id);
    if (!p) return null;
    return {
      person1: p,
      person2: p,
      relationshipName: 'A mesma pessoa',
      path: [{ person: p, relationToNext: 'mesma pessoa', direction: 'sibling' }],
      generationDifference: 0,
      stepsCount: 0,
    };
  }

  const p1 = people.find(p => p.id === person1Id);
  const p2 = people.find(p => p.id === person2Id);
  if (!p1 || !p2) return null;

  // Grafo de vizinhança
  const adj = new Map<string, { to: string; relation: string; direction: 'parent' | 'child' | 'spouse' | 'sibling' }[]>();

  people.forEach(p => adj.set(p.id, []));

  relationships.forEach(r => {
    if (r.relationshipType === 'parent') {
      // r.person1Id é pai de r.person2Id
      adj.get(r.person1Id)?.push({ to: r.person2Id, relation: 'filho(a)', direction: 'child' });
      adj.get(r.person2Id)?.push({ to: r.person1Id, relation: 'pai/mãe', direction: 'parent' });
    } else if (r.relationshipType === 'child') {
      adj.get(r.person1Id)?.push({ to: r.person2Id, relation: 'pai/mãe', direction: 'parent' });
      adj.get(r.person2Id)?.push({ to: r.person1Id, relation: 'filho(a)', direction: 'child' });
    } else if (r.relationshipType === 'spouse') {
      adj.get(r.person1Id)?.push({ to: r.person2Id, relation: 'cônjuge', direction: 'spouse' });
      adj.get(r.person2Id)?.push({ to: r.person1Id, relation: 'cônjuge', direction: 'spouse' });
    } else if (r.relationshipType === 'sibling') {
      adj.get(r.person1Id)?.push({ to: r.person2Id, relation: 'irmão/irmã', direction: 'sibling' });
      adj.get(r.person2Id)?.push({ to: r.person1Id, relation: 'irmão/irmã', direction: 'sibling' });
    }
  });

  // BFS para encontrar o caminho mais curto
  const queue: GraphNode[] = [{ personId: person1Id, relationFromPrevious: '', direction: 'sibling', path: [] }];
  const visited = new Set<string>([person1Id]);
  let foundPath: { personId: string; relation: string; direction: 'parent' | 'child' | 'spouse' | 'sibling' }[] | null = null;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.personId === person2Id) {
      foundPath = current.path;
      break;
    }

    const neighbors = adj.get(current.personId) || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push({
          personId: edge.to,
          relationFromPrevious: edge.relation,
          direction: edge.direction,
          path: [...current.path, { personId: edge.to, relation: edge.relation, direction: edge.direction }],
        });
      }
    }
  }

  if (!foundPath) return null;

  // Montar objeto KinshipPathStep
  const pathSteps: KinshipPathStep[] = [
    { person: p1, relationToNext: foundPath[0]?.relation || '', direction: foundPath[0]?.direction || 'sibling' }
  ];

  for (let i = 0; i < foundPath.length; i++) {
    const step = foundPath[i];
    const person = people.find(p => p.id === step.personId);
    if (person) {
      pathSteps.push({
        person,
        relationToNext: foundPath[i + 1]?.relation || '',
        direction: step.direction,
      });
    }
  }

  // Análise genealógica de parentesco
  const relationshipName = determineKinshipTerm(p1, p2, pathSteps);

  return {
    person1: p1,
    person2: p2,
    relationshipName,
    path: pathSteps,
    stepsCount: foundPath.length,
    generationDifference: pathSteps.filter(s => s.direction === 'parent').length - pathSteps.filter(s => s.direction === 'child').length,
  };
}

/**
 * Traduz o caminho de passos para termos formais de parentesco brasileiro
 */
function determineKinshipTerm(
  p1: Person,
  p2: Person,
  steps: KinshipPathStep[]
): string {
  const isFemale = p2.gender === 'F';
  const stepsCount = steps.length - 1;

  if (stepsCount === 1) {
    const step = steps[0];
    if (step.direction === 'parent') return isFemale ? 'Mãe' : 'Pai';
    if (step.direction === 'child') return isFemale ? 'Filha' : 'Filho';
    if (step.direction === 'spouse') return isFemale ? 'Esposa / Companheira' : 'Esposo / Companheiro';
    if (step.direction === 'sibling') return isFemale ? 'Irmã' : 'Irmão';
  }

  if (stepsCount === 2) {
    const d1 = steps[0].direction;
    const d2 = steps[1].direction;

    // Pai/Mãe do Pai/Mãe -> Avós
    if (d1 === 'parent' && d2 === 'parent') return isFemale ? 'Avó' : 'Avô';
    // Filho do Filho -> Netos
    if (d1 === 'child' && d2 === 'child') return isFemale ? 'Neta' : 'Neto';
    // Pai/Mãe -> Filho -> Irmãos (via progenitor compartilhado)
    if (d1 === 'parent' && d2 === 'child') return isFemale ? 'Irmã' : 'Irmão';
    // Cônjuge do Pai/Mãe -> Madrasta/Padrasto
    if (d1 === 'parent' && d2 === 'spouse') return isFemale ? 'Madrasta' : 'Padrasto';
    // Filho do cônjuge -> Enteado(a)
    if (d1 === 'spouse' && d2 === 'child') return isFemale ? 'Enteada' : 'Enteado';
    // Irmão do cônjuge / Cônjuge do irmão -> Cunhado(a)
    if ((d1 === 'spouse' && d2 === 'sibling') || (d1 === 'sibling' && d2 === 'spouse')) return isFemale ? 'Cunhada' : 'Cunhado';
    // Irmão do Pai/Mãe -> Tio(a)
    if (d1 === 'parent' && d2 === 'sibling') return isFemale ? 'Tia' : 'Tio';
    // Filho do irmão -> Sobrinho(a)
    if (d1 === 'sibling' && d2 === 'child') return isFemale ? 'Sobrinha' : 'Sobrinho';
  }

  if (stepsCount === 3) {
    const d1 = steps[0].direction;
    const d2 = steps[1].direction;
    const d3 = steps[2].direction;

    // Três ancestrais diretos -> Bisavô
    if (d1 === 'parent' && d2 === 'parent' && d3 === 'parent') return isFemale ? 'Bisavó' : 'Bisavô';
    // Três descendentes diretos -> Bisneto
    if (d1 === 'child' && d2 === 'child' && d3 === 'child') return isFemale ? 'Bisneta' : 'Bisneto';
    // Pai -> Irmão -> Filho (Filho do tio) -> Primo de 1º grau
    if (d1 === 'parent' && d2 === 'sibling' && d3 === 'child') return isFemale ? 'Prima (1º grau)' : 'Primo (1º grau)';
    // Pai -> Pai -> Filho (Irmão do pai/mãe) -> Tio
    if (d1 === 'parent' && d2 === 'parent' && d3 === 'child') return isFemale ? 'Tia' : 'Tio';
    // Pai -> Pai -> Irmão -> Tio-avô
    if (d1 === 'parent' && d2 === 'parent' && d3 === 'sibling') return isFemale ? 'Tia-avó' : 'Tio-avô';
    // Irmão -> Filho -> Filho -> Sobrinho-neto
    if (d1 === 'sibling' && d2 === 'child' && d3 === 'child') return isFemale ? 'Sobrinha-neta' : 'Sobrinho-neto';
  }

  if (stepsCount === 4) {
    // Parent -> Parent -> Child -> Child -> Primo de primeiro grau (via avós compartilhados)
    const dirs = steps.slice(0, 4).map(s => s.direction);
    if (dirs[0] === 'parent' && dirs[1] === 'parent' && dirs[2] === 'child' && dirs[3] === 'child') {
      return isFemale ? 'Prima (1º grau)' : 'Primo (1º grau)';
    }
    // Trisavô
    if (dirs.every(d => d === 'parent')) return isFemale ? 'Trisavó' : 'Trisavô';
    if (dirs.every(d => d === 'child')) return isFemale ? 'Trisneta' : 'Trisneto';
  }

  // Caminho geral compreensível
  return `Parente (${stepsCount} ${stepsCount === 1 ? 'vínculo' : 'vínculos'} de distância)`;
}
