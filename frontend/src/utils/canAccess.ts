import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  roles: string[];
}

export const canAccess = {
  roles: () => {
    const token = Cookies.get('token');
    if (!token) return false;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.roles.includes('super_admin');
    } catch (error) {
      return false;
    }
  },

  isLoggedIn: () => {
    const token = Cookies.get('token');
    if (!token) return false;

    try {
      jwtDecode<DecodedToken>(token);
      return true;
    } catch (error) {
      return false;
    }
  }
}; 