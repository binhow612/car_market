import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import toast from 'react-hot-toast';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { initialize } = useAuthStore();
  const hasProcessed = useRef(false);

  const handleOAuthCallback = useCallback(async () => {
    // Prevent multiple executions
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    const token = searchParams.get('token');
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      toast.error(message || 'OAuth authentication failed');
      navigate('/login');
      return;
    }

    if (success && token) {
      // Store the token
      localStorage.setItem('accessToken', token);
      
      // Initialize auth state to get user info
      await initialize();
      
      // Toast will be shown by the destination page if needed
      navigate('/', { state: { fromCallback: true } });
      return;
    }

    // No token or success flag, redirect to login
    navigate('/login');
  }, [searchParams, navigate, initialize]);

  useEffect(() => {
    handleOAuthCallback();
  }, [handleOAuthCallback]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
