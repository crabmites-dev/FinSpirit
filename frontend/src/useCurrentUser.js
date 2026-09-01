import { useState, useEffect } from 'react';
import api from './api.js';

export function useCurrentUser(fallback = 'Utilisateur') {
  const [userName, setUserName] = useState(fallback);

  useEffect(() => {
    api.get('/auth/getMe')
      .then((res) => {
        if (res.data.user?.username) setUserName(res.data.user.username);
      })
      .catch(() => {});
  }, []);

  return userName;
}
