import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { getAuthState, onAuthChange, logout as authLogout } from '@/services/authService';
import type { User } from '@supabase/supabase-js';
import {
  getProfile,
  saveProfile,
  type Profile,
  type ProfileSaveValues,
} from '@/services/profileService';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  profile: Profile | null;
  isProfileLoading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (values: ProfileSaveValues) => Promise<Profile>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    setIsProfileLoading(true);

    try {
      const data = await getProfile(userId);
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const state = await getAuthState();
      setUser(state.user);
      setIsLoading(false);
    };

    initializeAuth();

    const unsub = onAuthChange((state) => {
      setUser(state.user);
      setIsLoading(state.isLoading);
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    void fetchProfile(user.id);
  }, [user, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const updateProfile = useCallback(
    async (values: ProfileSaveValues) => {
      if (!user) {
        throw new Error('You must be logged in to update your profile.');
      }

      const updatedProfile = await saveProfile(user.id, values);
      setProfile(updatedProfile);
      return updatedProfile;
    },
    [user]
  );

  const logout = useCallback(async () => {
    await authLogout();
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      profile,
      isProfileLoading,
      logout,
      refreshProfile,
      updateProfile,
    }),
    [user, isLoading, profile, isProfileLoading, logout, refreshProfile, updateProfile]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}