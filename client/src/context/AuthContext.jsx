import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken, getAuthToken } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await apiRequest('/auth/profile');
        if (res.success) setUser(res.user);
      } catch (err) {
        setAuthToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.success) {
      setAuthToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  // OTP Signup Request
  const requestSignupOtp = async (name, email, password, phone = '') => {
    return await apiRequest('/auth/signup/request-otp', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone })
    });
  };

  // OTP Signup Verify & Account Activation
  const verifySignupOtp = async (email, otp) => {
    const res = await apiRequest('/auth/signup/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    if (res.success) {
      setAuthToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  // Forgot Password: Step 1 Request OTP
  const requestForgotPasswordOtp = async (email) => {
    return await apiRequest('/auth/forgot-password/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };

  // Forgot Password: Step 2 Verify OTP
  const verifyForgotPasswordOtp = async (email, otp) => {
    return await apiRequest('/auth/forgot-password/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
  };

  // Forgot Password: Step 3 Reset Password
  const resetPasswordWithOtp = async (email, resetToken, newPassword) => {
    return await apiRequest('/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify({ email, resetToken, newPassword })
    });
  };

  // Legacy/Direct register fallback
  const register = async (name, email, password, phone = '') => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone })
    });
    if (res.success) {
      setAuthToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const updateProfile = async (profileData) => {
    const res = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    if (res.success) {
      setUser(prev => ({ ...prev, ...res.user }));
    }
    return res;
  };

  const updatePassword = async (passwords) => {
    return await apiRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwords)
    });
  };

  const getAddresses = async () => {
    const res = await apiRequest('/auth/addresses');
    if (res.success && res.addresses) {
      setUser(prev => prev ? ({ ...prev, addresses: res.addresses }) : null);
      return res.addresses;
    }
    return [];
  };

  const addAddress = async (addressData) => {
    const res = await apiRequest('/auth/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData)
    });
    if (res.success && res.addresses) {
      setUser(prev => prev ? ({ ...prev, addresses: res.addresses }) : null);
    }
    return res;
  };

  const updateAddress = async (addressId, addressData) => {
    const res = await apiRequest(`/auth/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(addressData)
    });
    if (res.success && res.addresses) {
      setUser(prev => prev ? ({ ...prev, addresses: res.addresses }) : null);
    }
    return res;
  };

  const deleteAddress = async (addressId) => {
    const res = await apiRequest(`/auth/addresses/${addressId}`, {
      method: 'DELETE'
    });
    if (res.success && res.addresses) {
      setUser(prev => prev ? ({ ...prev, addresses: res.addresses }) : null);
    }
    return res;
  };

  const setDefaultAddress = async (addressId) => {
    const res = await apiRequest(`/auth/addresses/${addressId}/default`, {
      method: 'PUT'
    });
    if (res.success && res.addresses) {
      setUser(prev => prev ? ({ ...prev, addresses: res.addresses }) : null);
    }
    return res;
  };

  const logout = () => {
    setAuthToken('');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        requestSignupOtp,
        verifySignupOtp,
        requestForgotPasswordOtp,
        verifyForgotPasswordOtp,
        resetPasswordWithOtp,
        updateProfile,
        updatePassword,
        getAddresses,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        logout,
        isAdmin,
        fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
