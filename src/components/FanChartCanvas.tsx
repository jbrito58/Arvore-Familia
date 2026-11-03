import React, { useMemo } from 'react';
import { GitFork, Eye, User, Sparkles } from 'lucide-react';
import { Person, Relationship } from '../types/genealogy';
import { getParents } from '../services/genealogyEngine';

interface FanChartCanvasProps {
  rootPerson: Person;
  people: Person[];
  relationships: Relationship[];
  onSelectPerson: (person: Person) => void;
  onOpenProfile: (person: Person) => void;
}

interface FanSlice {
  person: Person;
  generation: number;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
}

export const FanChartCanvas: React.FC<FanChartCanvasProps> = ({
  rootPerson,
  people,
  relationships,
  onSelectPerson,
  onOpenProfile,
}) => {
  // Construir anéis de antepassados até a 4ª geração (16 fatias)
  const slices: FanSlice[] = useMemo(() => {
    const list: FanSlice[] = [];
    const baseRadius = 70;
    const ringWidth = 85;

    // Geração 0 (Centro)
    list.push({
      person: rootPerson,
      generation: 0,
      startAngle: Math.PI,
      endAngle: 0,
      innerRadius: 0,
      outerRadius: baseRadius,
    });

    // BFS para preencher árvore binária de antepassados
    // Posições teóricas: gen 1 tem 2 pais, gen 2 tem 4 avós, gen 3 tem 8 bisavós
    interface AncestorNode {
      person: Person;
      gen: number;
      slot: number; // 0..2^gen - 1
    }

    const queue: AncestorNode[] = [{ person: rootPerson, gen: 0, slot: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.gen >= 3) continue;

      const parents = getParents(current.person.id, relationships, people);
      const father = parents.find(p => p.gender === 'M') || parents[0];
      const mother = parents.find(p => p.gender === 'F') || (parents[1] !== father ? parents[1] : undefined);

      const nextGen = current.gen + 1;
      const totalSlotsInNextGen = Math.pow(2, nextGen);
      const anglePerSlot = Math.PI / totalSlotsInNextGen;

      if (father) {
        const slot = current.slot * 2;
        const startAngle = Math.PI - slot * anglePerSlot;
        const endAngle = Math.PI - (slot + 1) * anglePerSlot;
        list.push({
          person: father,
          generation: nextGen,
          startAngle,
          endAngle,
          innerRadius: baseRadius + (nextGen - 1) * ringWidth,
          outerRadius: baseRadius + nextGen * ringWidth,
        });
        queue.push({ person: father, gen: nextGen, slot });
      }

      if (mother) {
        const slot = current.slot * 2 + 1;
        const startAngle = Math.PI - slot * anglePerSlot;
        const endAngle = Math.PI - (slot + 1) * anglePerSlot;
        list.push({
          person: mother,
          generation: nextGen,
          startAngle,
          endAngle,
          innerRadius: baseRadius + (nextGen - 1) * ringWidth,
          outerRadius: baseRadius + nextGen * ringWidth,
        });
        queue.push({ person: mother, gen: nextGen, slot });
      }
    }

    return list;
  }, [rootPerson, people, relationships]);

  // Função para desenhar arcos em SVG
  const describeArc = (
    x: number,
    y: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => ({
      x: cx + r * Math.cos(angle),
      y: cy - r * Math.sin(angle),
    });

    const p1 = polarToCartesian(x, y, outerRadius, startAngle);
    const p2 = polarToCartesian(x, y, outerRadius, endAngle);
    const p3 = polarToCartesian(x, y, innerRadius, endAngle);
    const p4 = polarToCartesian(x, y, innerRadius, startAngle);

    if (innerRadius === 0) {
      // Centro circular
      return `M ${x} ${y} L ${p1.x} ${p1.y} A ${outerRadius} ${outerRadius} 0 0 1 ${p2.x} ${p2.y} Z`;
    }

    return [
      `M ${p1.x} ${p1.y}`,
      `A ${outerRadius} ${outerRadius} 0 0 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${innerRadius} ${innerRadius} 0 0 0 ${p4.x} ${p4.y}`,
      'Z',
    ].join(' ');
  };

  const colorsByGen = [
    '#D4AF37', // Ouro puro
    '#2D6A4F', // Verde esmeralda
    '#1B4332', // Verde floresta profundo
    '#0F1D38', // Azul marinho
  ];

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      <div className="text-center">
        <h3 className="font-serif text-2xl font-bold text-amber-100">
          Leque Genealógico de Antepassados
        </h3>
        <p className="text-xs text-slate-300 mt-1">
          Visualização radial semicircular com foco em {rootPerson.fullName} no centro e suas linhagens ancestrais.
        </p>
      </div>

      <div className="relative overflow-x-auto max-w-full flex justify-center">
        <svg width="700" height="400" viewBox="0 0 700 400" className="select-none">
          <g transform="translate(350, 360)">
            {slices.map((s, idx) => {
              const pathD = describeArc(0, 0, s.innerRadius, s.outerRadius, s.startAngle, s.endAngle);
              const midAngle = (s.startAngle + s.endAngle) / 2;
              const textRadius = s.innerRadius === 0 ? 0 : (s.innerRadius + s.outerRadius) / 2;
              const textX = textRadius * Math.cos(midAngle);
              const textY = -textRadius * Math.sin(midAngle);

              return (
                <g
                  key={s.person.id + '-' + idx}
                  onClick={() => onSelectPerson(s.person)}
                  onDoubleClick={() => onOpenProfile(s.person)}
                  className="cursor-pointer group"
                >
                  <path
                    d={pathD}
                    fill={colorsByGen[s.generation] || '#1E293B'}
                    stroke="#D4AF37"
                    strokeWidth="1.5"
                    strokeOpacity="0.5"
                    className="transition-colors group-hover:fill-amber-500/80"
                  />
                  {s.generation === 0 ? (
                    <text
                      x="0"
                      y="15"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="bold"
                      className="font-serif pointer-events-none"
                    >
                      {s.person.firstName}
                    </text>
                  ) : (
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="600"
                      className="pointer-events-none font-sans"
                      transform={`rotate(${(-midAngle * 180) / Math.PI + 90}, ${textX}, ${textY})`}
                    >
                      {s.person.firstName} {s.person.lastName?.split(' ')[0] || ''}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#D4AF37]" />
          <span>Raiz Central</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#2D6A4F]" />
          <span>Geração 1 (Pais)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#1B4332]" />
          <span>Geração 2 (Avós)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#0F1D38]" />
          <span>Geração 3 (Bisavós)</span>
        </span>
      </div>
    </div>
  );
};
