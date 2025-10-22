import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated) {
    // Redirect authenticated users to the page they were trying to access
    // or to the homepage if no specific page was requested
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
