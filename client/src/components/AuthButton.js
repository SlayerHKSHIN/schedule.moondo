import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const AuthContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 8px 16px;
  border-radius: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #f0f0f0;
`;

const UserName = styled.span`
  font-weight: 500;
  color: #333;
  margin-right: 8px;
`;

const Button = styled.button`
  background: ${props => props.variant === 'logout' ? '#ff4444' : '#4285f4'};
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.variant === 'logout' ? '#cc0000' : '#357ae8'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const GoogleIcon = styled.span`
  margin-right: 8px;
  font-size: 16px;
`;

function AuthButton() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/user', {
        withCredentials: true
      });
      
      if (response.data.authenticated) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.get('/api/auth/google');
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error('Error initiating login:', error);
      alert('Failed to start login process. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, {
        withCredentials: true
      });
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContainer>
      {user ? (
        <UserInfo>
          {user.picture && <UserAvatar src={user.picture} alt={user.name} />}
          <UserName>{user.name}</UserName>
          <Button variant="logout" onClick={handleLogout}>
            Logout
          </Button>
        </UserInfo>
      ) : (
        <Button onClick={handleLogin}>
          <GoogleIcon>🔷</GoogleIcon>
          Connect Google Calendar
        </Button>
      )}
    </AuthContainer>
  );
}

export default AuthButton;