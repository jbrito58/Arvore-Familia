import React, { useState } from 'react';
import {
  X,
  LogIn,
  Shield,
  FileText,
  Mail,
  Lock,
  User,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { loginWithGoogle } from '../firebase/config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'privacy'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        onLoginSuccess(user);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError('Falha ao autenticar com o Google. Verifique a janela de permissão.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Autenticação local / simulação
    const mockUser = {
      uid: 'user-' + Date.now(),
      email,
      displayName: name || email.split('@')[0],
    };
    onLoginSuccess(mockUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl p-6 sm:p-8 space-y-6">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto text-slate-950 shadow-lg shadow-amber-950/40 border border-amber-400/40 mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-amber-100">
            {mode === 'login' ? 'Entrar no Memorial' :
             mode === 'register' ? 'Criar Sua Conta Familiar' :
             mode === 'forgot' ? 'Recuperar Senha' : 'Aviso de Privacidade'}
          </h3>
          <p className="text-xs text-slate-400">
            {mode === 'privacy'
              ? 'Compromisso ético com a segurança dos seus dados'
              : 'Preserve suas raízes em um ambiente protegido'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'privacy' ? (
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-80 overflow-y-auto pr-1">
            <h4 className="font-bold text-amber-200">Requisitos Estritos de Privacidade:</h4>
            <p>1. <strong>Privacidade por padrão:</strong> Nenhuma árvore é pública sem o consentimento do criador.</p>
            <p>2. <strong>Controle de acesso:</strong> Cada usuário acessa unicamente as árvores criadas por ele ou compartilhadas explicitamente.</p>
            <p>3. <strong>Anti-Reconhecimento Facial:</strong> Não usamos suas fotos para reconhecimento facial ou biometria.</p>
            <p>4. <strong>Portabilidade total:</strong> Você pode exportar todos os dados em JSON e CSV ou excluir sua árvore a qualquer instante.</p>
            <button
              onClick={() => setMode('login')}
              className="w-full mt-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-amber-300"
            >
              Voltar ao Login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Botão Entrar com Google */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow-md transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{loading ? 'Conectando...' : 'Entrar com Google'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[11px] text-slate-500 uppercase">ou e-mail</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Formulário E-mail / Senha */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Seu Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {mode !== 'forgot' && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Sua senha segura"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 cursor-pointer"
              >
                {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar Conta' : 'Enviar Link de Recuperação'}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              {mode === 'login' ? (
                <>
                  <button onClick={() => setMode('register')} className="text-amber-400 hover:underline">
                    Criar conta nova
                  </button>
                  <button onClick={() => setMode('privacy')} className="text-slate-400 hover:underline">
                    Privacidade
                  </button>
                </>
              ) : (
                <button onClick={() => setMode('login')} className="text-amber-400 hover:underline">
                  Já tenho conta (Entrar)
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
