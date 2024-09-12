import {
  createContext, useContext, useMemo, ReactNode,
  useEffect, useState, useCallback,
} from 'react';
import {
  getAuth, onAuthStateChanged, User, signOut, Auth,
} from 'firebase/auth';
import { LoadingOverlay } from '@mantine/core';
import { useStorageEngine } from '../../storage/storageEngineHooks';
import { FirebaseStorageEngine } from '../../storage/engines/FirebaseStorageEngine';
import { UserWrapped } from '../../storage/engines/StorageEngine';

// Defines default AuthContextValue
interface AuthContextValue {
  user: UserWrapped;
  logout: () => Promise<void>;
  triggerAuth: () => void;
  verifyAdminStatus: (inputUser: UserWrapped) => Promise<boolean>;
}

// Initializes AuthContext
const AuthContext = createContext<AuthContextValue>({
  user: {
    user: null,
    determiningStatus: false,
    isAdmin: false,
    adminVerification: false,
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  logout: async () => {},
  triggerAuth: () => {},
  verifyAdminStatus: () => Promise.resolve(false),
});

// Firebase auth context
export const useAuth = () => useContext(AuthContext);

// Defines the functions that are exposed in this hook.
export function AuthProvider({ children }: { children: ReactNode }) {
  // Memoize loadingNullUser to prevent it from changing on every render
  const loadingNullUser: UserWrapped = useMemo(() => ({
    user: null,
    determiningStatus: true,
    isAdmin: false,
    adminVerification: false,
  }), []);

  // Memoize nonLoadingNullUser to prevent it from changing on every render
  const nonLoadingNullUser: UserWrapped = useMemo(() => ({
    user: null,
    determiningStatus: false,
    isAdmin: false,
    adminVerification: false,
  }), []);

  // Memoize nonAuthUser to prevent it from changing on every render
  const nonAuthUser: UserWrapped = useMemo(() => ({
    user: {
      name: 'fakeName',
      email: 'fakeEmail@fake.com',
      uid: 'fakeUid',
    },
    determiningStatus: false,
    isAdmin: true,
    adminVerification: true,
  }), []);

  const [user, setUser] = useState(loadingNullUser);
  const [enableAuthTrigger, setEnableAuthTrigger] = useState(false);
  const { storageEngine } = useStorageEngine();

  // Use useCallback for logout to prevent it from changing on every render
  const logout = useCallback(async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`There was an issue signing-out the user: ${error.message}`);
      } else {
        console.error('An unknown error occurred during sign-out.');
      }
    } finally {
      setUser(nonLoadingNullUser);
    }
  }, [nonLoadingNullUser]);

  const triggerAuth = () => {
    setEnableAuthTrigger(true);
  };

  // Use useCallback for verifyAdminStatus to prevent it from changing on every render
  const verifyAdminStatus = useCallback(async (inputUser: UserWrapped) => {
    if (storageEngine) {
      return await storageEngine.validateUser(inputUser);
    }
    return false;
  }, [storageEngine]);

  useEffect(() => {
    // Set initialUser
    setUser(loadingNullUser);

    // Get authentication
    let auth: Auth;
    if (storageEngine instanceof FirebaseStorageEngine) {
      try {
        auth = getAuth();
      } catch (error) {
        console.warn('No firebase store.');
      }
    }

    // Handle auth state changes for Firebase
    const handleAuthStateChanged = async (firebaseUser: User | null) => {
      // Reset the user. This also gets called on signOut
      setUser((prevUser) => ({
        user: prevUser.user,
        isAdmin: prevUser.isAdmin,
        determiningStatus: true,
        adminVerification: false,
      }));
      if (firebaseUser) {
        // Reach out to firebase to validate user
        const currUser: UserWrapped = {
          user: firebaseUser,
          determiningStatus: false,
          isAdmin: false,
          adminVerification: true,
        };
        const isAdmin = await verifyAdminStatus(currUser);
        currUser.isAdmin = !!isAdmin;
        setUser(currUser);
      } else {
        logout();
      }
    };

    // Determine authentication listener based on storageEngine and authEnabled variable
    const determineAuthentication = async () => {
      if (storageEngine instanceof FirebaseStorageEngine) {
        const authInfo = await storageEngine?.getUserManagementData('authentication');
        if (authInfo?.isEnabled) {
          // Define unsubscribe function for listening to authentication state changes when using Firebase with authentication
          const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => await handleAuthStateChanged(firebaseUser));
          return () => unsubscribe();
        }
        setUser(nonAuthUser);
      } else if (storageEngine) {
        setUser(nonAuthUser);
      }
      return () => {};
    };

    const cleanupPromise = determineAuthentication();

    return () => {
      cleanupPromise.then((cleanup) => cleanup());
    };
  }, [loadingNullUser, logout, nonAuthUser, verifyAdminStatus, storageEngine, enableAuthTrigger]);

  const memoizedValue = useMemo(() => ({
    user,
    triggerAuth,
    logout,
    verifyAdminStatus,
  }), [user, logout, verifyAdminStatus]);

  return (
    <AuthContext.Provider value={memoizedValue}>
      {user.determiningStatus ? <LoadingOverlay visible /> : children}
    </AuthContext.Provider>
  );
}
