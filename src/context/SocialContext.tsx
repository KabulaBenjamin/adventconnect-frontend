import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api.js'; 
import { useAuth } from '../context/AuthContext.js';

interface SocialContextType {
  friends: any[];
  requests: any[];
  loading: boolean;
  fetchFriends: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  sendFriendRequest: (recipientId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  unfriend: (friendId: string) => Promise<void>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = user?._id || user?.id;

  // Fetch Connected Friends
  const fetchFriends = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiFetch('/users/friends'); 
      setFriends(Array.isArray(data) ? data : data?.friends || []);
    } catch (err) {
      console.error('Failed to load friends directory:', err);
    }
  }, [userId]);

  // Fetch Pending Invites
  const fetchRequests = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await apiFetch('/users/friend-requests/pending');
      if (Array.isArray(response)) {
        setRequests(response);
      } else if (response?.requests) {
        setRequests(response.requests);
      }
    } catch (err) {
      console.log('Friend requests skipped or pending verification.');
    }
  }, [userId]);

  // Synchronize dynamic updates on log-in/out
  useEffect(() => {
    if (userId) {
      setLoading(true);
      Promise.all([fetchFriends(), fetchRequests()]).finally(() => setLoading(false));
    } else {
      setFriends([]);
      setRequests([]);
    }
  }, [userId, fetchFriends, fetchRequests]);

  // UPGRADE: Matches the backend body destructuring parameter: "targetUserId"
  const sendFriendRequest = async (recipientId: string) => {
    await apiFetch('/users/friend-request/send', {
      method: 'POST',
      body: JSON.stringify({ targetUserId: recipientId }),
    });
    await fetchRequests();
  };

  // UPGRADE: Matches POST '/users/friend-request/respond' with { senderId, action }
  const acceptFriendRequest = async (senderId: string) => {
    await apiFetch('/users/friend-request/respond', {
      method: 'POST',
      body: JSON.stringify({ senderId, action: 'accept' }),
    });
    await Promise.all([fetchRequests(), fetchFriends()]);
  };

  // UPGRADE: Matches POST '/users/friend-request/respond' with { senderId, action }
  const declineFriendRequest = async (senderId: string) => {
    await apiFetch('/users/friend-request/respond', {
      method: 'POST',
      body: JSON.stringify({ senderId, action: 'decline' }),
    });
    await fetchRequests();
  };

  const unfriend = async (friendId: string) => {
    await apiFetch(`/users/unfriend/${friendId}`, { method: 'DELETE' });
    await fetchFriends();
  };

  return (
    <SocialContext.Provider
      value={{
        friends,
        requests,
        loading,
        fetchFriends,
        fetchRequests,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        unfriend,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};