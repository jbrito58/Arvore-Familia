import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network connection is restricted.');
    }
  }
}

// Interpretar erros do Firebase Auth em mensagens amigáveis em português
export function getFriendlyAuthErrorMessage(error: any): { message: string; code?: string; isDomainError?: boolean; isPopupBlocked?: boolean } {
  if (!error) return { message: 'Ocorreu um erro desconhecido na autenticação.' };
  const code: string = error.code || '';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  if (code === 'auth/popup-blocked') {
    return {
      code,
      isPopupBlocked: true,
      message: 'A janela de login foi bloqueada pelo seu navegador. Verifique o ícone de pop-up na barra de endereços do navegador e permita pop-ups para este site, ou tente entrar com seu e-mail e senha abaixo.'
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      code,
      message: 'A janela de autenticação foi fechada antes de concluir o login. Clique em "Entrar com Google" novamente para continuar.'
    };
  }

  if (code === 'auth/unauthorized-domain') {
    return {
      code,
      isDomainError: true,
      message: `O domínio atual (${currentHost}) precisa ser autorizado no Console do Firebase (Authentication > Settings > Authorized domains). Enquanto isso, você pode entrar usando seu E-mail e Senha abaixo.`
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      code,
      message: 'O método de login precisa ser ativado no Firebase Console (Authentication > Sign-in method). Use a opção de e-mail/senha ou acesso local.'
    };
  }

  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return {
      code,
      message: 'E-mail ou senha incorretos. Verifique suas credenciais ou clique em "Criar conta nova".'
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      code,
      message: 'Este e-mail já está cadastrado. Alterne para "Já tenho conta" para fazer login com sua senha.'
    };
  }

  if (code === 'auth/weak-password') {
    return {
      code,
      message: 'A senha informada deve possuir pelo menos 6 caracteres.'
    };
  }

  if (code === 'auth/invalid-email') {
    return {
      code,
      message: 'O formato do e-mail digitado não é válido.'
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      code,
      message: 'Falha de conexão com os servidores do Firebase. Verifique sua conexão com a internet.'
    };
  }

  return {
    code,
    message: error.message || 'Falha ao autenticar. Tente novamente ou use a opção de e-mail e senha.'
  };
}

// Login com Google
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Erro ao autenticar com Google:', error);
    throw error;
  }
}

// Login com E-mail e Senha
export async function loginWithEmail(email: string, pass: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  } catch (error) {
    console.error('Erro ao logar com e-mail/senha:', error);
    throw error;
  }
}

// Criar Conta com E-mail e Senha
export async function registerWithEmail(email: string, pass: string, displayName?: string) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && cred.user) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch (e) {
        console.warn('Não foi possível atualizar o nome de exibição:', e);
      }
    }
    return cred.user;
  } catch (error) {
    console.error('Erro ao registrar com e-mail/senha:', error);
    throw error;
  }
}

// Recuperar Senha via E-mail
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Erro ao enviar e-mail de recuperação:', error);
    throw error;
  }
}

// Sign out helper
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao sair:', error);
    throw error;
  }
}
