
import { useAuth } from '@/hooks/useAuth';
import Index from '@/pages/Index';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Index />;
  }

  return <>{children}</>;
};
