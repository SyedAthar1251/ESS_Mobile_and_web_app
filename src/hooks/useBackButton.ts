import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { useModalStore } from '../store/modal.store';

// Check if user is authenticated (stored in localStorage)
const isUserAuthenticated = (): boolean => {
  const savedAuthenticated = localStorage.getItem('ess_logged_in');
  return savedAuthenticated === 'true';
};

export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isModalOpen, closeModal } = useModalStore();

  useEffect(() => {
    // Handler for back button
    const handleBackButton = async () => {
      const currentPath = location.pathname;
      const authenticated = isUserAuthenticated();
      
      // If on login page or splash page, exit the app
      if (currentPath === '/login' || currentPath === '/') {
        App.exitApp();
        return;
      }

      // If modal is open, close it first (don't navigate)
      if (isModalOpen) {
        closeModal();
        return;
      }

      // If authenticated user is on dashboard, exit the app
      if (authenticated && currentPath === '/dashboard') {
        App.exitApp();
        return;
      }

      // For all other pages (when authenticated), always go to dashboard
      if (authenticated) {
        navigate('/dashboard', { replace: true });
        return;
      }

      // For unauthenticated users on other pages, go to login
      navigate('/login', { replace: true });
    };

    // Add the back button listener
    const subscription = App.addListener('backButton', handleBackButton);

    // Clean up on unmount
    return () => {
      subscription.then(sub => sub.remove());
    };
  }, [navigate, location.pathname, isModalOpen, closeModal]);
}
