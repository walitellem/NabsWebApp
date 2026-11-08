import React from 'react';
import { User, Role } from '../types';
import { UnauthorizedPage } from './UnauthorizedPage';

interface ProtectedRouteProps {
  currentUser: User | null;
  requiredRoles: Role[];
  children: React.ReactNode;
  onLogout?: () => void;
}

/**
 * ProtectedRoute
 * A high-order component utility that restricts access to child components
 * based on the user's assigned role.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ currentUser, requiredRoles, children, onLogout }) => {
  // If no user is logged in, or the user's role is not included in the requiredRoles list,
  // we block access and show the UnauthorizedPage.
  if (!currentUser || !requiredRoles.includes(currentUser.role)) {
    return <UnauthorizedPage onBack={onLogout || (() => window.location.reload())} />;
  }

  // Otherwise, render the child component (the dashboard/route)
  return <>{children}</>;
};
