// context/UserContext.jsx
"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import  supabase  from '@/utils/supabaseClient';

interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  fullName?: string;
}

// Define Context Type
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

interface UserProviderProps {
  children: ReactNode;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);


  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          username: session.user.user_metadata?.full_name || session.user.email,
          avatar: session.user.user_metadata?.avatar_url || "/default-avatar.svg"
        });
      } else {
        setUser(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
