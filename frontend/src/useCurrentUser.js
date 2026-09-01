import { useState, useEffect } from 'react';
import api from './api.js';

export function useCurrentUser(fallback = '') {
  const [userName, setUserName] = useState(() => {
    // Récupérer instantanément depuis localStorage
    return localStorage.getItem('userName') || fallback;
  });

  useEffect(() => {
    // Mettre à jour en arrière-plan si nécessaire
    api.get('/auth/getMe')
      .then((res) => {
        if (res.data.user?.username) {
          setUserName(res.data.user.username);
          localStorage.setItem('userName', res.data.user.username);
        }
      })
      .catch(() => {});
  }, []);

  return userName;
}
