import React, { useEffect, useState } from 'react';
import { useNavigate } from 'umi';
import { canAccess } from '@/utils/canAccess';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (canAccess.isLoggedIn()) {
        navigate('/dashboard', { replace: true });
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [navigate]);

  if (isChecking) {
    return null;
  }

  return <>{children}</>;
};

export default PublicRoute; 