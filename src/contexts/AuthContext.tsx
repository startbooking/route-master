import { createContext, useContext, useState, ReactNode } from 'react';
import { Usuario } from '@/types';
import { mockUsuario } from '@/data/mockData';

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, municipioId: number) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);

  const login = async (email: string, password: string, municipioId: number): Promise<boolean> => {
    // Simulación de login - en producción esto sería una llamada al backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation - dispositivo asignado a Bogotá (id: 1)
    const deviceMunicipioId = 1;
    if (municipioId !== deviceMunicipioId) {
      throw new Error('Este dispositivo no está autorizado para el municipio seleccionado');
    }

    // Login exitoso
    setUser({
      ...mockUsuario,
      email,
    });
    
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
