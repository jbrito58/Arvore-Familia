import React from 'react';
import { X, HelpCircle, GitFork, Users, Compass, Shield, Download, Heart, Camera } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl p-6 sm:p-8 space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif text-xl font-bold text-amber-100">
              Orientações & Guia de Uso
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
          
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-serif text-sm font-bold text-amber-200 flex items-center gap-2">
              <GitFork className="w-4 h-4 rotate-180 text-amber-400" />
              1. Navegação na Árvore Genealógica
            </h4>
            <p>
              • <strong>Arrastar e Mover:</strong> Clique e arraste com o mouse em qualquer espaço vazio para explorar os ramos da árvore. Em celulares e tablets, deslize com o dedo.
            </p>
            <p>
              • <strong>Aproximar / Afastar:</strong> Use a roda do scroll do mouse ou os botões de Zoom (+ / -) na barra superior.
            </p>
            <p>
              • <strong>Filtros de Visualização:</strong> Alterne entre Árvore Completa, Antepassados, Descendentes e Núcleo Familiar nos botões do topo.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-serif text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              2. Sincronização Automática de Parentesco
            </h4>
            <p>
              • Os relacionamentos são estritamente bidirecionais: ao definir quem é o pai ou a mãe de uma pessoa, o sistema sincroniza a filiação no perfil correspondente de forma instantânea.
            </p>
            <p>
              • Irmãos, primos e tios são calculados automaticamente pelos antepassados comuns.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-serif text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              3. Ferramenta "Qual é o Parentesco?"
            </h4>
            <p>
              • Selecione qualquer par de familiares cadastrados na aba <strong>Qual o Parentesco?</strong> para ver o termo exato em português (ex: "Prima em 2º grau", "Sobrinho-neto") e o caminho passo-a-passo no grafo da família.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-serif text-sm font-bold text-amber-300 flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" />
              4. Como Inserir Fotografias e Documentos
            </h4>
            <p>
              • <strong>Foto de Perfil do Familiar:</strong> No formulário de cadastro (Etapa 1), clique no círculo do retrato ou no botão <strong>“Escolher Foto do Celular / Computador”</strong> para selecionar imagens da sua galeria ou arquivos. O sistema otimiza a imagem automaticamente.
            </p>
            <p>
              • <strong>Links da Internet:</strong> Se preferir usar fotos hospedadas na web, alterne para <strong>“Link (URL)”</strong> e cole o link direto da imagem.
            </p>
            <p>
              • <strong>Acervo Histórico e Certidões:</strong> Na Etapa 4 (Memórias), você pode enviar documentos digitalizados, certidões de nascimento/casamento, cartas antigas e receitas de família.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-serif text-sm font-bold text-rose-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400" />
              5. Privacidade e Segurança dos Seus Dados
            </h4>
            <p>
              • Suas informações pertencem à sua família. Não fazemos reconhecimento facial nas fotos nem tornamos seus dados públicos sem sua autorização explícita.
            </p>
            <p>
              • Faça backups a qualquer momento usando a função de exportação em JSON ou planilha CSV.
            </p>
          </div>

        </div>

        <div className="pt-3 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
