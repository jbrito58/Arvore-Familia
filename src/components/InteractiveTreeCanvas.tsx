import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  GitFork,
  Heart,
  Users,
  Compass,
  UserPlus,
  Layers,
  ArrowUpDown,
  ArrowLeftRight,
  Eye,
  Info,
  Sparkles,
  Search,
  Trash2
} from 'lucide-react';
import { Person, Relationship } from '../types/genealogy';
import { PersonCard } from './PersonCard';
import { getParents, getChildren, getSpouses, getSiblings } from '../services/genealogyEngine';

export type TreeViewMode = 'all' | 'ancestors' | 'descendants' | 'nuclear' | 'fan';

interface InteractiveTreeCanvasProps {
  people: Person[];
  relationships: Relationship[];
  selectedPersonId: string | null;
  onSelectPerson: (person: Person) => void;
  onOpenProfile: (person: Person) => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson?: (person: Person) => void;
  onAddRelative: (person: Person, relationType: 'parent' | 'child' | 'spouse') => void;
  onCalculateKinship: (person: Person) => void;
  onOpenAddFirstPerson: (role?: 'self' | 'father' | 'mother') => void;
  onOpenImport: () => void;
  onRestoreDemo: () => void;
  isDarkMode: boolean;
}

interface TreeNodePos {
  person: Person;
  x: number;
  y: number;
  generation: number;
}

export const InteractiveTreeCanvas: React.FC<InteractiveTreeCanvasProps> = ({
  people,
  relationships,
  selectedPersonId,
  onSelectPerson,
  onOpenProfile,
  onEditPerson,
  onDeletePerson,
  onAddRelative,
  onCalculateKinship,
  onOpenAddFirstPerson,
  onOpenImport,
  onRestoreDemo,
  isDarkMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Estados de navegação (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [viewFilter, setViewFilter] = useState<TreeViewMode>('all');
  const [generationDepth, setGenerationDepth] = useState<number>(4);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [showLegend, setShowLegend] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);

  // Pessoa selecionada
  const selectedPerson = useMemo(() => {
    if (!selectedPersonId) return people[0] || null;
    return people.find(p => p.id === selectedPersonId) || people[0] || null;
  }, [people, selectedPersonId]);

  // Filtragem de pessoas de acordo com a visualização selecionada
  const visiblePeople = useMemo(() => {
    if (people.length === 0) return [];
    if (!selectedPerson || viewFilter === 'all') return people;

    const visibleSet = new Set<string>();
    visibleSet.add(selectedPerson.id);

    if (viewFilter === 'nuclear') {
      // Pais, cônjuges, filhos e irmãos
      getParents(selectedPerson.id, relationships, people).forEach(p => visibleSet.add(p.id));
      getChildren(selectedPerson.id, relationships, people).forEach(p => visibleSet.add(p.id));
      getSpouses(selectedPerson.id, relationships, people).forEach(s => visibleSet.add(s.person.id));
      getSiblings(selectedPerson.id, relationships, people).forEach(p => visibleSet.add(p.id));
    } else if (viewFilter === 'ancestors') {
      // Subir gerações
      const queue = [{ id: selectedPerson.id, depth: 0 }];
      while (queue.length > 0) {
        const item = queue.shift()!;
        if (item.depth < generationDepth) {
          const parents = getParents(item.id, relationships, people);
          parents.forEach(p => {
            visibleSet.add(p.id);
            queue.push({ id: p.id, depth: item.depth + 1 });
          });
        }
      }
    } else if (viewFilter === 'descendants') {
      // Descer gerações
      const queue = [{ id: selectedPerson.id, depth: 0 }];
      while (queue.length > 0) {
        const item = queue.shift()!;
        if (item.depth < generationDepth) {
          const children = getChildren(item.id, relationships, people);
          children.forEach(c => {
            visibleSet.add(c.id);
            queue.push({ id: c.id, depth: item.depth + 1 });
          });
          const spouses = getSpouses(item.id, relationships, people);
          spouses.forEach(s => visibleSet.add(s.person.id));
        }
      }
    }

    return people.filter(p => visibleSet.has(p.id));
  }, [people, relationships, selectedPerson, viewFilter, generationDepth]);

  // Cálculo de Layout de Coordenadas
  const nodePositions = useMemo(() => {
    if (visiblePeople.length === 0) return new Map<string, TreeNodePos>();

    // Determinar gerações relativas
    // Raízes: pessoas sem pais conhecidos no conjunto visível
    const generationMap = new Map<string, number>();

    const getPersonParentsInSet = (pid: string) => {
      return getParents(pid, relationships, people).filter(p =>
        visiblePeople.some(vp => vp.id === p.id)
      );
    };

    // Atribuir geração por nível topológico
    const roots = visiblePeople.filter(p => getPersonParentsInSet(p.id).length === 0);
    const assigned = new Set<string>();

    const queue: { id: string; gen: number }[] = roots.map(r => ({ id: r.id, gen: 0 }));
    roots.forEach(r => assigned.add(r.id));

    while (queue.length > 0) {
      const { id, gen } = queue.shift()!;
      generationMap.set(id, Math.max(generationMap.get(id) || 0, gen));

      const children = getChildren(id, relationships, people).filter(c =>
        visiblePeople.some(vp => vp.id === c.id)
      );
      children.forEach(c => {
        queue.push({ id: c.id, gen: gen + 1 });
        assigned.add(c.id);
      });

      // Cônjuges na mesma geração
      const spouses = getSpouses(id, relationships, people).filter(s =>
        visiblePeople.some(vp => vp.id === s.person.id)
      );
      spouses.forEach(s => {
        if (!assigned.has(s.person.id)) {
          generationMap.set(s.person.id, gen);
          assigned.add(s.person.id);
        }
      });
    }

    // Pessoas não conectadas recebem geração 0
    visiblePeople.forEach(p => {
      if (!generationMap.has(p.id)) {
        generationMap.set(p.id, 0);
      }
    });

    // Agrupar pessoas por geração
    const byGen = new Map<number, Person[]>();
    visiblePeople.forEach(p => {
      const g = generationMap.get(p.id) || 0;
      if (!byGen.has(g)) byGen.set(g, []);
      byGen.get(g)!.push(p);
    });

    const positions = new Map<string, TreeNodePos>();
    const nodeWidth = 280;
    const nodeHeight = 110;
    const xGap = 40;
    const yGap = 90;

    const sortedGens = Array.from(byGen.keys()).sort((a, b) => a - b);

    sortedGens.forEach(gen => {
      const genPeople = byGen.get(gen)!;
      const count = genPeople.length;
      const totalSpan = count * nodeWidth + (count - 1) * xGap;
      const startOffset = -totalSpan / 2;

      genPeople.forEach((person, idx) => {
        const offset = startOffset + idx * (nodeWidth + xGap);
        if (orientation === 'vertical') {
          positions.set(person.id, {
            person,
            x: offset,
            y: gen * (nodeHeight + yGap),
            generation: gen,
          });
        } else {
          // Horizontal: gerações avançam no eixo X
          positions.set(person.id, {
            person,
            x: gen * (nodeWidth + xGap * 1.5),
            y: offset,
            generation: gen,
          });
        }
      });
    });

    return positions;
  }, [visiblePeople, relationships, people, orientation]);

  // Conexões e Linhas de Parentesco (SVG)
  const connections = useMemo(() => {
    const lines: Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      type: 'parent-child' | 'spouse';
    }> = [];

    const nodeWidth = 260;
    const nodeHeight = 90;

    // Relacionamentos Cônjuges
    relationships
      .filter(r => r.relationshipType === 'spouse')
      .forEach(r => {
        const p1 = nodePositions.get(r.person1Id);
        const p2 = nodePositions.get(r.person2Id);
        if (p1 && p2) {
          lines.push({
            id: `spouse-${r.id}`,
            x1: p1.x + nodeWidth / 2,
            y1: p1.y + nodeHeight / 2,
            x2: p2.x + nodeWidth / 2,
            y2: p2.y + nodeHeight / 2,
            type: 'spouse',
          });
        }
      });

    // Relacionamentos Pais e Filhos
    relationships
      .filter(r => r.relationshipType === 'parent')
      .forEach(r => {
        const parentPos = nodePositions.get(r.person1Id);
        const childPos = nodePositions.get(r.person2Id);
        if (parentPos && childPos) {
          if (orientation === 'vertical') {
            lines.push({
              id: `pc-${r.id}`,
              x1: parentPos.x + nodeWidth / 2,
              y1: parentPos.y + nodeHeight,
              x2: childPos.x + nodeWidth / 2,
              y2: childPos.y,
              type: 'parent-child',
            });
          } else {
            lines.push({
              id: `pc-${r.id}`,
              x1: parentPos.x + nodeWidth,
              y1: parentPos.y + nodeHeight / 2,
              x2: childPos.x,
              y2: childPos.y + nodeHeight / 2,
              type: 'parent-child',
            });
          }
        }
      });

    return lines;
  }, [relationships, nodePositions, orientation]);

  // Centralizar na tela
  const centerTree = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (selectedPerson && nodePositions.has(selectedPerson.id)) {
      const pos = nodePositions.get(selectedPerson.id)!;
      setPan({
        x: rect.width / 2 - (pos.x + 130) * zoom,
        y: rect.height / 2 - (pos.y + 45) * zoom,
      });
    } else {
      setPan({ x: rect.width / 2, y: 100 });
    }
  }, [selectedPerson, nodePositions, zoom]);

  useEffect(() => {
    centerTree();
  }, [selectedPersonId, orientation]);

  // Manipulação de Mouse Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.select-none') && !(e.target as HTMLElement).closest('.person-card-node')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom pelo scroll do mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(2.5, Math.max(0.3, prev * factor)));
  };

  // Toggle Tela Cheia
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Estado Vazio da Árvore
  if (people.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[500px]">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center mb-6 shadow-xl shadow-amber-950/20">
          <GitFork className="w-10 h-10 text-amber-400 rotate-180" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-amber-100 mb-2">
          Comece pelas suas raízes
        </h3>
        <p className="text-sm text-slate-300 max-w-md mb-8">
          Sua árvore genealógica ainda está vazia. Cadastre a sua própria pessoa para iniciar as ramificações ou carregue o exemplo de demonstração.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onOpenAddFirstPerson('self')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs shadow-lg shadow-amber-950/30 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar minha pessoa
          </button>
          <button
            onClick={() => onOpenAddFirstPerson('father')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-200 text-xs font-medium cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            Adicionar pai
          </button>
          <button
            onClick={() => onOpenAddFirstPerson('mother')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-200 text-xs font-medium cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-rose-400" />
            Adicionar mãe
          </button>
          <button
            onClick={onOpenImport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
          >
            Importar dados (JSON/CSV)
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800">
          <button
            onClick={onRestoreDemo}
            className="text-xs text-amber-400/80 hover:text-amber-200 underline cursor-pointer"
          >
            Carregar exemplo de demonstração da Família Oliveira Ramos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden bg-radial from-slate-900 via-slate-950 to-[#060B18] select-none cursor-grab active:cursor-grabbing"
    >
      {/* Imagem de Fundo Sutil de Árvore Histórica (inspirada no memorial da família) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15 bg-center bg-cover mix-blend-screen"
        style={{ backgroundImage: `url('/assets/aistudio/image_023006cc.png')` }}
      />

      {/* Grade de fundo pontilhada suave */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <defs>
          <pattern id="tree-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="#D4AF37" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tree-grid)" />
      </svg>

      {/* Barra de Controles Superiores da Árvore */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Controles de Filtros e Modos de Visão */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl pointer-events-auto">
          <button
            onClick={() => setViewFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewFilter === 'all'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Árvore Completa
          </button>
          <button
            onClick={() => setViewFilter('ancestors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewFilter === 'ancestors'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Antepassados
          </button>
          <button
            onClick={() => setViewFilter('descendants')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewFilter === 'descendants'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Descendentes
          </button>
          <button
            onClick={() => setViewFilter('nuclear')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewFilter === 'nuclear'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Núcleo Familiar
          </button>
        </div>

        {/* Controles de Navegação (Zoom, Orientação, Centralização) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl pointer-events-auto">
          {/* Alternar Orientação */}
          <button
            onClick={() => setOrientation(orientation === 'vertical' ? 'horizontal' : 'vertical')}
            className="p-2 rounded-lg text-slate-300 hover:text-amber-200 hover:bg-slate-800 transition-colors"
            title={`Mudar para orientação ${orientation === 'vertical' ? 'horizontal' : 'vertical'}`}
          >
            {orientation === 'vertical' ? <ArrowUpDown className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />}
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* Zoom In */}
          <button
            onClick={() => setZoom(prev => Math.min(2.5, prev * 1.2))}
            className="p-2 rounded-lg text-slate-300 hover:text-amber-200 hover:bg-slate-800 transition-colors"
            title="Aproximar (Zoom +)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => setZoom(prev => Math.max(0.3, prev / 1.2))}
            className="p-2 rounded-lg text-slate-300 hover:text-amber-200 hover:bg-slate-800 transition-colors"
            title="Afastar (Zoom -)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Centralizar */}
          <button
            onClick={centerTree}
            className="p-2 rounded-lg text-slate-300 hover:text-amber-200 hover:bg-slate-800 transition-colors"
            title="Centralizar Árvore"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* Legenda */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`p-2 rounded-lg transition-colors ${
              showLegend ? 'bg-amber-500/20 text-amber-200' : 'text-slate-300 hover:text-amber-200 hover:bg-slate-800'
            }`}
            title="Mostrar Legenda de Parentesco"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-slate-300 hover:text-amber-200 hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Sair da tela cheia' : 'Visualizar em tela cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Legenda Flutuante */}
      {showLegend && (
        <div className="absolute top-20 right-4 z-20 w-64 p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl text-xs text-slate-300">
          <div className="font-serif font-semibold text-amber-200 pb-2 border-b border-slate-800 mb-2">
            Legenda da Árvore
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span>Pessoa Viva</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-600" />
              <span>Em Memória (Falecida)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-amber-400" />
              <span>Filiação (Pais e Filhos)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 border-t border-dashed border-rose-400" />
              <span>Casamento / União Estável</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded border border-amber-400 bg-amber-400/20" />
              <span>Pessoa em Destaque</span>
            </div>
          </div>
        </div>
      )}

      {/* Camada Transformável da Árvore (Pan & Zoom) */}
      <div
        className="absolute inset-0 origin-center transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Linhas SVG Conectoras */}
        <svg
          className="absolute inset-0 overflow-visible pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="parent-child-line" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="spouse-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E5B869" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#F43F5E" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#E5B869" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {connections.map(conn => {
            if (conn.type === 'spouse') {
              return (
                <line
                  key={conn.id}
                  x1={conn.x1}
                  y1={conn.y1}
                  x2={conn.x2}
                  y2={conn.y2}
                  stroke="url(#spouse-line)"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                />
              );
            }

            // Conexão suave pai-filho
            const midY = (conn.y1 + conn.y2) / 2;
            const midX = (conn.x1 + conn.x2) / 2;

            const pathData = orientation === 'vertical'
              ? `M ${conn.x1} ${conn.y1} C ${conn.x1} ${midY}, ${conn.x2} ${midY}, ${conn.x2} ${conn.y2}`
              : `M ${conn.x1} ${conn.y1} C ${midX} ${conn.y1}, ${midX} ${conn.y2}, ${conn.x2} ${conn.y2}`;

            return (
              <path
                key={conn.id}
                d={pathData}
                fill="none"
                stroke="url(#parent-child-line)"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {/* Cartões dos Familiares na Árvore */}
        {Array.from(nodePositions.values()).map(node => (
          <div
            key={node.person.id}
            className="absolute person-card-node"
            style={{
              transform: `translate(${node.x}px, ${node.y}px)`,
            }}
          >
            <PersonCard
              person={node.person}
              isSelected={selectedPerson?.id === node.person.id}
              onSelect={onSelectPerson}
              onOpenProfile={onOpenProfile}
              onEdit={onEditPerson}
              onDelete={onDeletePerson}
              onAddRelative={onAddRelative}
              onCalculateKinship={onCalculateKinship}
              onCenterOnPerson={() => {
                setPan({
                  x: (containerRef.current?.clientWidth || 800) / 2 - (node.x + 130) * zoom,
                  y: (containerRef.current?.clientHeight || 600) / 2 - (node.y + 45) * zoom,
                });
              }}
              hasMemories={true}
              hasDocuments={node.person.gender === 'M'}
            />
          </div>
        ))}
      </div>

      {/* Painel Inferior Flutuante com Ações da Pessoa Selecionada */}
      {selectedPerson && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-2 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-amber-500/30 shadow-2xl max-w-full overflow-x-auto">
          <div className="flex items-center gap-2.5 px-3 border-r border-slate-800">
            <img
              src={selectedPerson.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop'}
              alt={selectedPerson.fullName}
              className="w-7 h-7 rounded-full object-cover border border-amber-400"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-amber-200 truncate max-w-[140px]">
                {selectedPerson.fullName}
              </div>
              <div className="text-[10px] text-slate-400">
                Pessoa em foco
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenProfile(selectedPerson)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium border border-amber-500/30 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Perfil</span>
          </button>

          <button
            onClick={() => onEditPerson(selectedPerson)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <span>Editar</span>
          </button>

          <button
            onClick={() => onAddRelative(selectedPerson, 'parent')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">+ Pai/Mãe</span>
          </button>

          <button
            onClick={() => onAddRelative(selectedPerson, 'spouse')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5" />
            <span className="hidden md:inline">+ Cônjuge</span>
          </button>

          <button
            onClick={() => onAddRelative(selectedPerson, 'child')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden md:inline">+ Filho</span>
          </button>

          <button
            onClick={() => onCalculateKinship(selectedPerson)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Verificar parentesco com outro familiar"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Parentesco</span>
          </button>

          {onDeletePerson && (
            <button
              onClick={() => onDeletePerson(selectedPerson)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 hover:text-rose-200 text-xs font-medium border border-slate-700 hover:border-rose-700/60 transition-colors cursor-pointer"
              title="Excluir cadastro desta pessoa"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Excluir</span>
            </button>
          )}
        </div>
      )}

      {/* Mini Mapa de Navegação no Canto Inferior Direito */}
      {showMinimap && people.length > 3 && (
        <div className="absolute bottom-6 right-4 z-20 hidden md:block w-36 h-28 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2 shadow-xl">
          <div className="text-[9px] uppercase font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>Visão Geral</span>
            <span className="text-amber-400">{people.length}</span>
          </div>
          <div className="relative w-full h-20 bg-slate-950/80 rounded border border-slate-800/80 overflow-hidden">
            {Array.from(nodePositions.values()).map(node => (
              <div
                key={node.person.id}
                className={`absolute w-1.5 h-1.5 rounded-full ${
                  selectedPerson?.id === node.person.id ? 'bg-amber-400' : 'bg-slate-600'
                }`}
                style={{
                  left: `${Math.min(90, Math.max(5, 50 + (node.x / 30)))}%`,
                  top: `${Math.min(90, Math.max(5, 20 + (node.y / 15)))}%`,
                }}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
