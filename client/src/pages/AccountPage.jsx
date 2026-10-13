import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  User, Package, LogOut, KeyRound, MapPin, Sliders,
  CheckCircle2, AlertTriangle, Trash2, Plus, Moon, Sun,
  Mail, ArrowRight, RefreshCw, Lock, AlertCircle, Edit3, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiRequest, formatPrice } from '../api/client';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry'
];

export default function AccountPage() {
  const navigate = useNavigate();
  const {
    user,
    login,
    requestSignupOtp,
    verifySignupOtp,
    requestForgotPasswordOtp,
    verifyForgotPasswordOtp,
    resetPasswordWithOtp,
    updateProfile,
    updatePassword,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    logout
  } = useAuth();

  const { theme, setSpecificTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Auth Mode: 'login' | 'register' | 'forgot_password'
  const [authMode, setAuthMode] = useState(searchParams.get('mode') || 'login');

  // Sign in / Sign up form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // OTP Signup state: 'form' | 'verify'
  const [signupStep, setSignupStep] = useState('form');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupCooldown, setSignupCooldown] = useState(0);

  // Forgot password flow state: 1 = Email Form, 2 = OTP Form, 3 = New Password Form
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [forgotCooldown, setForgotCooldown] = useState(0);

  // Cooldown timers
  useEffect(() => {
    let timer;
    if (signupCooldown > 0) {
      timer = setInterval(() => setSignupCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [signupCooldown]);

  useEffect(() => {
    let timer;
    if (forgotCooldown > 0) {
      timer = setInterval(() => setForgotCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [forgotCooldown]);

  // Active Account Tab: 'orders' | 'profile' | 'addresses' | 'security' | 'preferences'
  const activeTab = searchParams.get('tab') || 'orders';
  const setActiveTab = (tab) => setSearchParams({ tab });

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Karnataka',
    postalCode: '',
    country: 'IN',
    label: 'Home',
    deliveryInstructions: '',
    isDefault: false
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [addressSuccess, setAddressSuccess] = useState('');
  const [addressError, setAddressError] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);

  const redirectParam = searchParams.get('redirect');
  const noticeParam = searchParams.get('notice');

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      apiRequest('/orders/my-orders')
        .then((res) => {
          if (res.success) setOrders(res.orders);
        })
        .catch((err) => console.error(err));
    }
  }, [user]);

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      setAuthLoading(true);
      await login(email, password);
      if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
        navigate(redirectParam);
        return;
      }
    } catch (err) {
      setAuthError(err.message || 'Invalid email or password.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Signup: Step 1 (Request OTP)
  const handleSignupRequestOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setAuthLoading(true);
      const res = await requestSignupOtp(name, email, password, regPhone);
      if (res.success) {
        setSignupStep('verify');
        setSignupCooldown(res.cooldownSeconds || 60);
        setAuthSuccess(res.message || `A verification code was sent to ${email}`);
      }
    } catch (err) {
      setAuthError(err.message || 'Could not send verification code.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Signup: Step 2 (Verify OTP & Activate)
  const handleSignupVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!signupOtp || signupOtp.trim().length !== 6) {
      setAuthError('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setAuthLoading(true);
      const res = await verifySignupOtp(email, signupOtp.trim());
      if (res.success) {
        setAuthSuccess('Account verified and created successfully!');
        if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
          navigate(redirectParam);
          return;
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Invalid or expired verification code.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Address Handlers
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: user?.name || '',
      phone: user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: 'Karnataka',
      postalCode: '',
      country: 'IN',
      label: 'Home',
      deliveryInstructions: '',
      isDefault: !user?.addresses || user.addresses.length === 0
    });
    setAddressError('');
    setAddressSuccess('');
    setShowAddressForm(true);
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || 'IN',
      label: addr.label || 'Home',
      deliveryInstructions: addr.deliveryInstructions || '',
      isDefault: !!addr.isDefault
    });
    setAddressError('');
    setAddressSuccess('');
    setShowAddressForm(true);
  };

  const handleSaveAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressError('');
    setAddressSuccess('');

    if (!addressForm.fullName.trim() || addressForm.fullName.trim().length < 2) {
      setAddressError('Recipient name must be at least 2 characters.');
      return;
    }
    const cleanPhone = addressForm.phone.replace(/[\s-]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setAddressError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!addressForm.addressLine1.trim() || addressForm.addressLine1.trim().length < 5) {
      setAddressError('Street address must be at least 5 characters.');
      return;
    }
    if (!/^\d{6}$/.test(addressForm.postalCode.trim())) {
      setAddressError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    try {
      setAddressLoading(true);
      if (editingAddressId) {
        const res = await updateAddress(editingAddressId, addressForm);
        if (res.success) {
          setAddressSuccess('Delivery address updated successfully.');
          setShowAddressForm(false);
          setEditingAddressId(null);
        } else {
          setAddressError(res.message || 'Could not update address.');
        }
      } else {
        const res = await addAddress(addressForm);
        if (res.success) {
          setAddressSuccess(res.message || 'Address saved successfully.');
          setShowAddressForm(false);
        } else {
          setAddressError(res.message || 'Could not save address.');
        }
      }
    } catch (err) {
      setAddressError(err.message || 'Failed to persist address.');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    setAddressError('');
    setAddressSuccess('');
    try {
      setAddressLoading(true);
      const res = await setDefaultAddress(addressId);
      if (res.success) {
        setAddressSuccess('Default address updated successfully.');
      }
    } catch (err) {
      setAddressError(err.message || 'Could not change default address.');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!deleteConfirmId) return;
    setAddressError('');
    setAddressSuccess('');
    try {
      setAddressLoading(true);
      const res = await deleteAddress(deleteConfirmId);
      if (res.success) {
        setAddressSuccess('Address removed successfully from your address book.');
        setDeleteConfirmId(null);
      }
    } catch (err) {
      setAddressError(err.message || 'Could not delete address.');
    } finally {
      setAddressLoading(false);
    }
  };

  // Resend Signup OTP
  const handleResendSignupOtp = async () => {
    if (signupCooldown > 0) return;
    setAuthError('');
    try {
      setAuthLoading(true);
      const res = await requestSignupOtp(name, email, password, regPhone);
      if (res.success) {
        setSignupCooldown(res.cooldownSeconds || 60);
        setAuthSuccess('A fresh 6-digit code has been sent to your email.');
      }
    } catch (err) {
      setAuthError(err.message || 'Could not resend verification code.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Forgot Password: Step 1 (Request OTP)
  const handleForgotRequestOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      setAuthLoading(true);
      const res = await requestForgotPasswordOtp(forgotEmail.trim());
      if (res.success) {
        setForgotStep(2);
        setForgotCooldown(res.cooldownSeconds || 60);
        setAuthSuccess(res.message || 'If an account exists, a code was sent.');
      }
    } catch (err) {
      setAuthError(err.message || 'Could not process reset request.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Forgot Password: Step 2 (Verify OTP)
  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setAuthError('Please enter the complete 6-digit code.');
      return;
    }

    try {
      setAuthLoading(true);
      const res = await verifyForgotPasswordOtp(forgotEmail.trim(), forgotOtp.trim());
      if (res.success) {
        setResetToken(res.resetToken);
        setForgotStep(3);
        setAuthSuccess('Code verified! Please enter your new password.');
      }
    } catch (err) {
      setAuthError(err.message || 'Incorrect or expired reset code.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Resend Forgot Password OTP
  const handleResendForgotOtp = async () => {
    if (forgotCooldown > 0) return;
    setAuthError('');
    try {
      setAuthLoading(true);
      const res = await requestForgotPasswordOtp(forgotEmail.trim());
      if (res.success) {
        setForgotCooldown(res.cooldownSeconds || 60);
        setAuthSuccess('A fresh reset code has been sent to your email.');
      }
    } catch (err) {
      setAuthError(err.message || 'Could not resend code.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Forgot Password: Step 3 (Set New Password)
  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (resetNewPassword !== resetConfirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    if (resetNewPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setAuthLoading(true);
      const res = await resetPasswordWithOtp(forgotEmail.trim(), resetToken, resetNewPassword);
      if (res.success) {
        setAuthSuccess('Password has been reset securely! You may now sign in.');
        setAuthMode('login');
        setForgotStep(1);
        setEmail(forgotEmail);
        setPassword('');
      }
    } catch (err) {
      setAuthError(err.message || 'Could not reset password.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Update Profile Details Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    if (!profileName.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }
    if (profilePhone && !/^[6-9]\d{9}$/.test(profilePhone.replace(/[\s-]/g, ''))) {
      setProfileError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    try {
      setProfileLoading(true);
      const res = await updateProfile({
        name: profileName.trim(),
        phone: profilePhone.trim()
      });
      if (res.success) {
        setProfileSuccess('Personal details updated successfully.');
      }
    } catch (err) {
      setProfileError(err.message || 'Error updating details');
    } finally {
      setProfileLoading(false);
    }
  };

  // Password Change Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await updatePassword({
        currentPassword,
        newPassword
      });
      if (res.success) {
        setPasswordSuccess('Your password has been changed securely.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError(err.message || 'Password update failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  // -------------------------------------------------------------
  // AUTHENTICATION SCREENS (When user is not logged in)
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-6">
        {/* FORGOT PASSWORD WORKFLOW */}
        {authMode === 'forgot_password' ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Account Recovery</span>
              <h1 className="font-editorial text-3xl font-semibold text-neutral-900 dark:text-white">
                Reset Password
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {forgotStep === 1 && 'Enter your registered email address to receive a secure 6-digit code.'}
                {forgotStep === 2 && 'Enter the 6-digit code sent to your email.'}
                {forgotStep === 3 && 'Choose a new password of at least 6 characters.'}
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Step 1: Email Form */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotRequestOtp} className="bg-white dark:bg-noir-card p-6 border border-neutral-300 dark:border-noir-border rounded space-y-4 text-xs shadow-sm">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Registered Email Address *</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity rounded flex items-center justify-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{authLoading ? 'Sending Code...' : 'Send Verification Code'}</span>
                </button>
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    className="text-neutral-500 hover:text-black dark:hover:text-white underline text-[11px]"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: OTP Verification Form */}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotVerifyOtp} className="bg-white dark:bg-noir-card p-6 border border-neutral-300 dark:border-noir-border rounded space-y-4 text-xs shadow-sm">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Enter 6-Digit Code *</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full p-2.5 text-center font-mono text-lg tracking-widest border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity rounded"
                >
                  {authLoading ? 'Verifying...' : 'Verify Code'}
                </button>
                <div className="flex justify-between items-center pt-2 text-[11px]">
                  <button
                    type="button"
                    onClick={handleResendForgotOtp}
                    disabled={forgotCooldown > 0 || authLoading}
                    className="text-neutral-600 dark:text-neutral-300 hover:underline disabled:opacity-50"
                  >
                    {forgotCooldown > 0 ? `Resend in ${forgotCooldown}s` : 'Resend Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setAuthError('');
                    }}
                    className="text-neutral-500 hover:underline"
                  >
                    Change Email
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Enter New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleForgotResetPassword} className="bg-white dark:bg-noir-card p-6 border border-neutral-300 dark:border-noir-border rounded space-y-4 text-xs shadow-sm">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">New Password (Min 6 chars) *</label>
                  <input
                    type="password"
                    required
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity rounded"
                >
                  {authLoading ? 'Updating...' : 'Set New Password & Sign In'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* LOGIN & SIGNUP WORKFLOW */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="font-editorial text-3xl font-semibold text-neutral-900 dark:text-white">
                {authMode === 'login'
                  ? 'Sign In to Atelier'
                  : signupStep === 'verify'
                  ? 'Verify Your Email'
                  : 'Create Atelier Account'}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {authMode === 'login'
                  ? 'Access your orders, saved addresses, and custom designs.'
                  : signupStep === 'verify'
                  ? `Enter the 6-digit verification code sent to ${email}`
                  : 'Join to save designs and receive exclusive drops.'}
              </p>
            </div>

            {noticeParam === 'auth_required' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded flex items-start gap-3 shadow-sm">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Please sign in to continue with your purchase.</h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                    An authenticated customer account is required to protect your order details and delivery address. Your bag items have been safely preserved.
                  </p>
                </div>
              </div>
            )}

            {authError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* SIGNUP STEP 2: EMAIL OTP VERIFICATION */}
            {authMode === 'register' && signupStep === 'verify' ? (
              <form onSubmit={handleSignupVerifyOtp} className="bg-white dark:bg-noir-card p-6 border border-neutral-300 dark:border-noir-border rounded space-y-4 text-xs shadow-sm">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">6-Digit Email Code *</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full p-2.5 text-center font-mono text-xl tracking-widest border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">Code expires in 5 minutes.</p>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity rounded"
                >
                  {authLoading ? 'Verifying Code...' : 'Verify & Activate Account'}
                </button>

                <div className="flex justify-between items-center pt-2 text-[11px]">
                  <button
                    type="button"
                    onClick={handleResendSignupOtp}
                    disabled={signupCooldown > 0 || authLoading}
                    className="text-neutral-600 dark:text-neutral-300 hover:underline disabled:opacity-50"
                  >
                    {signupCooldown > 0 ? `Resend in ${signupCooldown}s` : 'Resend Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep('form');
                      setAuthError('');
                    }}
                    className="text-neutral-500 hover:underline"
                  >
                    Edit Registration Details
                  </button>
                </div>
              </form>
            ) : (
              /* LOGIN OR SIGNUP STEP 1 FORM */
              <form
                onSubmit={authMode === 'login' ? handleLoginSubmit : handleSignupRequestOtp}
                className="bg-white dark:bg-noir-card p-6 border border-neutral-300 dark:border-noir-border rounded space-y-4 text-xs shadow-sm"
              >
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Aryan Sen"
                        className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">10-Digit Phone (Optional)</label>
                      <input
                        type="tel"
                        maxLength="10"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none font-mono"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-neutral-600 dark:text-neutral-400 font-medium">Password *</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot_password');
                          setForgotEmail(email);
                          setForgotStep(1);
                          setAuthError('');
                          setAuthSuccess('');
                        }}
                        className="text-[11px] text-neutral-500 hover:text-black dark:hover:text-white underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none"
                  />
                  {authMode === 'register' && (
                    <span className="text-[10px] text-neutral-400 mt-1 block">At least 6 characters.</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity rounded flex items-center justify-center gap-2"
                >
                  {authLoading
                    ? 'Processing...'
                    : authMode === 'login'
                    ? 'Sign In'
                    : 'Send Verification Code'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setSignupStep('form');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white underline text-xs"
                  >
                    {authMode === 'login' ? "Don't have an account? Sign up with email OTP" : 'Already registered? Sign in'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // LOGGED-IN CUSTOMER ACCOUNT DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-[#E5E5E0] dark:border-noir-border gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">
            Atelier Account & Settings
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 dark:text-white mt-1">
            Welcome, {user.name}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
            {user.email} {user.phone && `• +91 ${user.phone}`}
          </p>
        </div>

        <button
          onClick={logout}
          className="px-3.5 py-2 border border-neutral-300 dark:border-noir-border rounded text-xs text-neutral-700 dark:text-neutral-300 hover:border-black dark:hover:border-white transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b border-neutral-200 dark:border-noir-border pb-px text-xs uppercase tracking-wider font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-black dark:border-white text-black dark:text-white'
              : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'profile'
              ? 'border-black dark:border-white text-black dark:text-white'
              : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal Details</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`py-3 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'addresses'
              ? 'border-black dark:border-white text-black dark:text-white'
              : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Addresses ({user.addresses?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-3 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'security'
              ? 'border-black dark:border-white text-black dark:text-white'
              : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Password</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`py-3 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1 ${
            activeTab === 'preferences'
              ? 'border-black dark:border-white text-black dark:text-white'
              : 'border-transparent text-neutral-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Theme & Mode</span>
        </button>
      </div>

      {/* TAB 1: Orders History (Displaying real statuses & Retry Payment) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
              Recent Order History
            </h2>
            <Link to="/shop" className="text-xs text-neutral-500 hover:underline">
              Continue Shopping
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-noir-card border border-neutral-200 dark:border-noir-border rounded text-xs text-neutral-500 dark:text-neutral-400 space-y-3">
              <Package className="w-8 h-8 mx-auto text-neutral-400" />
              <p>You haven't placed any orders yet.</p>
              <Link to="/customize" className="inline-block px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-[11px] uppercase tracking-wider font-semibold rounded">
                Design Your First POD Tee
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => {
                const isPending = o.orderStatus === 'PENDING_PAYMENT';
                const isCod = o.paymentMethod === 'COD';

                return (
                  <div key={o._id} className="bg-white dark:bg-noir-card border border-neutral-200 dark:border-noir-border p-5 rounded space-y-3 text-xs shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 dark:border-noir-border gap-2">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">#{o.orderNumber}</span>
                        <span className="text-neutral-500 dark:text-neutral-400">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {/* Payment Method Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          isCod ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {o.paymentMethod || 'PREPAID'}
                        </span>
                        {/* Order Status Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          o.orderStatus === 'CONFIRMED' || o.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : o.orderStatus === 'CANCELLED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}>
                          {o.orderStatus || o.fulfilmentStatus}
                        </span>
                        {/* Payment Status Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          o.paymentStatus === 'PAID'
                            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40'
                            : o.paymentStatus === 'FAILED'
                            ? 'text-red-700 bg-red-50 dark:bg-red-950/40'
                            : 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800'
                        }`}>
                          Payment: {o.paymentStatus || o.payment?.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-black dark:text-white">
                          {formatPrice(o.pricing?.totalAmountPaise)}
                        </span>
                        {isPending ? (
                          <Link
                            to={`/checkout?retry=${o._id}`}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] uppercase font-semibold rounded flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Complete Payment</span>
                          </Link>
                        ) : (
                          <Link
                            to={`/track-order?order=${o.orderNumber}`}
                            className="px-2.5 py-1 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase font-semibold rounded"
                          >
                            Track Status
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {o.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-neutral-100 dark:bg-noir-subtle border border-neutral-200 dark:border-noir-border rounded overflow-hidden flex-shrink-0">
                            <img src={it.previewImageUrl} alt="" className="w-full h-full object-contain p-0.5" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-black dark:text-white">{it.productName}</span>
                            <span className="text-neutral-500 dark:text-neutral-400 ml-2">Size {it.selectedSize} × {it.quantity}</span>
                            {it.isCustom && (
                              <span className="ml-2 text-[10px] bg-neutral-100 dark:bg-noir-subtle px-1 rounded font-mono">Custom POD</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Personal Details Settings */}
      {activeTab === 'profile' && (
        <div className="max-w-xl space-y-6 bg-white dark:bg-noir-card p-6 border border-neutral-200 dark:border-noir-border rounded shadow-sm text-xs">
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
              Update Personal Details
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              Keep your contact information updated for order confirmation and shipping dispatch SMS alerts.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">Full Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">Registered Email</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full p-2.5 border border-neutral-200 dark:border-noir-border rounded bg-neutral-100 dark:bg-noir-card text-neutral-500 font-mono cursor-not-allowed"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Primary login email cannot be edited directly for security reasons.
              </span>
            </div>

            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">Mobile Phone (+91)</label>
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="9876543210"
                className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="py-3 px-6 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold hover:opacity-90 transition-opacity rounded"
            >
              {profileLoading ? 'Saving Changes...' : 'Save Personal Details'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Saved Delivery Addresses (Full Address Book CRUD & Consistency) */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-noir-border">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
                  Customer Address Book
                </h2>
                <span className="text-[10px] bg-neutral-200 dark:bg-noir-border text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-full font-mono">
                  {user.addresses?.length || 0} saved
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Manage your verified delivery locations. Your default address is preselected at checkout.
              </p>
            </div>

            <button
              onClick={showAddressForm ? () => setShowAddressForm(false) : handleOpenAddAddress}
              className="px-3.5 py-2 bg-black dark:bg-white text-white dark:text-black text-xs uppercase tracking-wider font-semibold rounded flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddressForm ? 'Cancel' : 'Add New Address'}</span>
            </button>
          </div>

          {addressSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{addressSuccess}</span>
            </div>
          )}

          {addressError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{addressError}</span>
            </div>
          )}

          {/* ADD / EDIT ADDRESS FORM */}
          {showAddressForm && (
            <form onSubmit={handleSaveAddressSubmit} className="bg-white dark:bg-noir-card p-6 border border-neutral-300 dark:border-noir-border rounded space-y-4 text-xs shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-noir-border">
                <h3 className="font-editorial text-xl font-semibold text-neutral-900 dark:text-white">
                  {editingAddressId ? 'Edit Delivery Destination' : 'Add New Indian Delivery Address'}
                </h3>
                <span className="text-[11px] text-neutral-500 font-mono">All fields marked * are required</span>
              </div>

              {/* Label Selection Buttons */}
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 mb-1.5 font-medium">Address Label</label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                      className={`px-3.5 py-1.5 text-xs rounded font-medium border transition-colors ${
                        addressForm.label === lbl
                          ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-sm'
                          : 'border-neutral-300 dark:border-noir-border text-neutral-700 dark:text-neutral-300 hover:border-black'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">Recipient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    placeholder="e.g. Aryan Sen"
                    className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">10-Digit Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength="10"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="9876543210"
                    className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">Address Line 1 (Flat, House, Building, Street) *</label>
                <input
                  type="text"
                  required
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  placeholder="e.g. Flat 402, Palm Residency, 8th Main"
                  className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">Address Line 2 (Area, Colony, Landmark) - Optional</label>
                <input
                  type="text"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  placeholder="e.g. Near Metro Station / Behind Axis Bank"
                  className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Bengaluru"
                    className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">State *</label>
                  <select
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">PIN Code (6 Digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value.replace(/\D/g, '') })}
                    placeholder="560038"
                    className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">Delivery Instructions (Optional)</label>
                <input
                  type="text"
                  value={addressForm.deliveryInstructions}
                  onChange={(e) => setAddressForm({ ...addressForm, deliveryInstructions: e.target.value })}
                  placeholder="e.g. Leave with security / Call upon arrival"
                  className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Set as Default Checkbox */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-neutral-800 dark:text-neutral-200">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="rounded border-neutral-300 text-black focus:ring-black"
                  />
                  <span>Make this my primary default delivery address</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={addressLoading}
                  className="py-3 px-6 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {addressLoading ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="py-3 px-5 border border-neutral-300 dark:border-noir-border text-neutral-700 dark:text-neutral-300 uppercase text-xs tracking-wider font-semibold rounded hover:border-black"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* DELETE CONFIRMATION MODAL */}
          {deleteConfirmId && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded text-xs space-y-3">
              <div className="flex items-start gap-2.5 text-red-900 dark:text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Delete Delivery Address?</strong>
                  <span>Are you sure you want to permanently remove this address? If this is your default address, another saved address will automatically be selected as default.</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAddress}
                  disabled={addressLoading}
                  className="py-1.5 px-4 bg-red-600 text-white rounded font-semibold text-xs hover:bg-red-700"
                >
                  {addressLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="py-1.5 px-4 border border-neutral-300 dark:border-noir-border rounded font-semibold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* LIST OF SAVED ADDRESSES (DEFAULT ALWAYS FIRST) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(!user.addresses || user.addresses.length === 0) ? (
              <div className="p-12 text-center bg-white dark:bg-noir-card border border-neutral-200 dark:border-noir-border rounded text-xs text-neutral-500 col-span-2 space-y-2">
                <MapPin className="w-8 h-8 mx-auto text-neutral-400" />
                <p className="font-editorial text-lg text-neutral-900 dark:text-white">Your Address Book is Empty</p>
                <p>You haven't saved any delivery addresses yet. Add one now to expedite checkout.</p>
                <button
                  onClick={handleOpenAddAddress}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-black dark:bg-white text-white dark:text-black uppercase text-[11px] font-semibold tracking-wider rounded"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Address</span>
                </button>
              </div>
            ) : (
              user.addresses.map((addr) => {
                const isDefault = !!addr.isDefault;
                return (
                  <div
                    key={addr._id}
                    className={`p-5 bg-white dark:bg-noir-card border rounded text-xs space-y-3 relative transition-all ${
                      isDefault
                        ? 'border-black dark:border-white shadow-sm ring-1 ring-black dark:ring-white'
                        : 'border-neutral-200 dark:border-noir-border hover:border-neutral-400'
                    }`}
                  >
                    {/* Header with Name, Label & Default Badge */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-black dark:text-white text-sm font-semibold">{addr.fullName}</strong>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                            addr.label === 'Work'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                              : addr.label === 'Other'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}>
                            {addr.label || 'Home'}
                          </span>
                          {isDefault && (
                            <span className="px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              <span>Default</span>
                            </span>
                          )}
                        </div>
                        <span className="text-neutral-500 dark:text-neutral-400 block font-mono text-[11px]">
                          +91 {addr.phone}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditAddress(addr)}
                          className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white rounded hover:bg-neutral-100 dark:hover:bg-noir-subtle transition-colors"
                          title="Edit Address"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(addr._id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded hover:bg-neutral-100 dark:hover:bg-noir-subtle transition-colors"
                          title="Delete Address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Address details */}
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}<br />
                      {addr.city}, {addr.state} — <strong className="font-mono text-black dark:text-white">{addr.postalCode}</strong>
                      <span className="block text-[11px] text-neutral-500 font-mono mt-0.5">India (IN)</span>
                    </p>

                    {addr.deliveryInstructions && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic bg-neutral-50 dark:bg-noir-subtle p-2 rounded border border-neutral-100 dark:border-noir-border">
                        Note: {addr.deliveryInstructions}
                      </p>
                    )}

                    {/* Footer Actions: Set As Default */}
                    {!isDefault && (
                      <div className="pt-2 border-t border-neutral-100 dark:border-noir-border flex justify-end">
                        <button
                          onClick={() => handleSetDefault(addr._id)}
                          disabled={addressLoading}
                          className="text-[11px] text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:underline font-medium flex items-center gap-1"
                        >
                          <Star className="w-3 h-3" />
                          <span>Set as Default Address</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Password & Security */}
      {activeTab === 'security' && (
        <div className="max-w-xl space-y-6 bg-white dark:bg-noir-card p-6 border border-neutral-200 dark:border-noir-border rounded shadow-sm text-xs">
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
              Account Security & Password
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              Ensure your account is protected with a secure password of at least 6 characters.
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">New Password (Min 6 characters) *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-neutral-300 dark:border-noir-border rounded bg-white dark:bg-noir-subtle text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="py-3 px-6 bg-black dark:bg-white text-white dark:text-black uppercase text-xs tracking-wider font-semibold hover:opacity-90 transition-opacity rounded"
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: Theme & Atelier Preferences */}
      {activeTab === 'preferences' && (
        <div className="max-w-2xl space-y-6 bg-white dark:bg-noir-card p-6 border border-neutral-200 dark:border-noir-border rounded shadow-sm text-xs">
          <div>
            <h2 className="text-xs uppercase tracking-widest font-bold text-neutral-900 dark:text-white">
              Visual Theme & Aesthetic Mode
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              Select your preferred browsing aesthetic. Changes are applied instantly and persisted across devices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div
              onClick={() => setSpecificTheme('light')}
              className={`p-5 rounded border cursor-pointer transition-all ${
                theme === 'light'
                  ? 'border-black ring-2 ring-black bg-[#FAFAF8]'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Sun className="w-5 h-5 text-amber-500" />
                {theme === 'light' && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-black text-white rounded font-bold">
                    Active
                  </span>
                )}
              </div>
              <h3 className="font-editorial text-lg font-bold text-black">Blanc Pure (Light Mode)</h3>
              <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">
                Warm off-white background with editorial serif accents. Inspired by classic art monographs and paper printing plates.
              </p>
            </div>

            <div
              onClick={() => setSpecificTheme('dark')}
              className={`p-5 rounded border cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'border-white ring-2 ring-white bg-[#0F0F10] text-white'
                  : 'border-neutral-700 hover:border-neutral-500 bg-[#18181B] text-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Moon className="w-5 h-5 text-indigo-400" />
                {theme === 'dark' && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white text-black rounded font-bold">
                    Active
                  </span>
                )}
              </div>
              <h3 className="font-editorial text-lg font-bold">Obsidian Noir (Dark Mode)</h3>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Deep black charcoal tones with refined luminescent white typography. High-contrast comfort for night studio sessions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
