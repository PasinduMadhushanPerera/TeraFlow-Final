import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const {
    user,
    isLoading
  } = useAuth();
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};