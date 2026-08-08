import React, { useState, useEffect } from 'react';
import { Lock, Mail, UserCheck, School, KeyRound, CheckCircle2, AlertCircle, ShieldCheck, ArrowLeft, RefreshCw, X, Sparkles } from 'lucide-react';
import { User } from '../types';
import { getSupabaseClient, saveUser, getStoredSystemUsers, fetchSystemUsers, saveOrUpdateUser } from '../lib/supabase';
import { DEFAULT_BRANDING } from '../lib/initialData';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  branding?: typeof DEFAULT_BRANDING;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, branding = DEFAULT_BRANDING }) => {
  const [userIdOrEmail, setUserIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot Password States
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetEmailOrId, setResetEmailOrId] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // SMTP Configuration States
  const [smtpUser, setSmtpUser] = useState<string>(() => localStorage.getItem('SMTP_USER') || 'uttamkumarb247@gmail.com');
  const [smtpPass, setSmtpPass] = useState<string>(() => localStorage.getItem('SMTP_PASS') || 'iluelciwxelafevw');
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);
  const [emailSendingStatus, setEmailSendingStatus] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    fetch('/api/db/smtp')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.smtpUser) {
            setSmtpUser(data.smtpUser);
            localStorage.setItem('SMTP_USER', data.smtpUser);
          }
          if (data.smtpPass) {
            setSmtpPass(data.smtpPass);
            localStorage.setItem('SMTP_PASS', data.smtpPass);
          }
        }
      })
      .catch((e) => console.warn('Failed to load SMTP settings:', e));
  }, []);

  const saveSmtpCredentials = async (u: string, p: string) => {
    localStorage.setItem('SMTP_USER', u);
    localStorage.setItem('SMTP_PASS', p);
    setSmtpUser(u);
    setSmtpPass(p);
    try {
      await fetch('/api/db/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpUser: u.trim(), smtpPass: p.trim() })
      });
    } catch (e) {
      console.warn('Failed to save SMTP settings to server:', e);
    }
  };

  // Helper function to send OTP email via server API
  const sendOtpEmail = async (emailTo: string, otpCode: string, name: string, customUser?: string, customPass?: string) => {
    setIsSendingEmail(true);
    setEmailSendingStatus('ইমেইল পাঠানো হচ্ছে...');
    try {
      const activeUser = customUser !== undefined ? customUser : smtpUser;
      const activePass = customPass !== undefined ? customPass : smtpPass;

      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTo,
          otp: otpCode,
          userName: name,
          customSmtpUser: activeUser,
          customSmtpPass: activePass
        })
      });

      const data = await response.json();
      if (data.success) {
        if (data.delivered) {
          setEmailSendingStatus(`✅ আপনার ইমেইল (${emailTo})-এ ওটিপি সফলভাবে পাঠানো হয়েছে! ইনবক্স চেক করুন।`);
        } else {
          setEmailSendingStatus(`ℹ️ ${data.message}`);
        }
      } else {
        setEmailSendingStatus(`⚠️ ইমেইল পাঠানো যায়নি: ${data.error || 'ত্রুটি হয়েছে'}`);
      }
    } catch (err: any) {
      setEmailSendingStatus('ℹ️ অ্যাপ পাসওয়ার্ড কনফিগার না থাকায় অন-স্ক্রিন ওটিপি কোড নিচে প্রদর্শিত হচ্ছে।');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!userIdOrEmail.trim() || !password.trim()) {
      setErrorMessage('অনুগ্রহ করে ইউজার আইডি/ইমেইল এবং পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check if Supabase client is connected and attempt Supabase Auth first
      const client = getSupabaseClient();
      if (client && userIdOrEmail.includes('@')) {
        const { data, error } = await client.auth.signInWithPassword({
          email: userIdOrEmail,
          password: password,
        });

        if (!error && data.user) {
          const authenticatedUser: User = {
            id: data.user.id,
            user_id: data.user.email?.split('@')[0] || 'admin',
            email: data.user.email || userIdOrEmail,
            full_name: data.user.user_metadata?.full_name || 'সুপার অ্যাডমিন (Supabase)',
            role: 'ADMIN',
          };
          saveUser(authenticatedUser);
          setSuccessMessage('সফলভাবে লগইন করা হয়েছে!');
          setTimeout(() => onLoginSuccess(authenticatedUser), 600);
          return;
        }
      }

      // 2. Dynamic matching against stored system users
      const input = userIdOrEmail.trim().toLowerCase();
      const systemUsers = await fetchSystemUsers();

      let authenticatedUser: User | null = null;

      const matchedUser = systemUsers.find(u => {
        const matchEmail = u.email && u.email.toLowerCase() === input;
        const matchUserId = u.user_id && u.user_id.toLowerCase() === input;
        const matchNameShortcut = u.full_name && (
          (input === 'shankar' && u.full_name.includes('শংকর')) ||
          (input === 'dilip' && u.full_name.includes('দীলিপ')) ||
          (input === 'admin' && u.role === 'ADMIN') ||
          (input === 'accounts' && u.role === 'ACCOUNTANT') ||
          (input === 'headmaster' && u.role === 'HEADMASTER')
        );

        return matchEmail || matchUserId || matchNameShortcut;
      });

      if (matchedUser) {
        // Check password (allow user-set password, or default fallbacks 123456 / pass1234 / admin)
        const userPass = matchedUser.password || '123456';
        if (password === userPass || password === '123456' || password === 'pass1234' || password === 'admin') {
          authenticatedUser = matchedUser;
        }
      }

      if (authenticatedUser) {
        saveUser(authenticatedUser);
        setSuccessMessage('সফলভাবে লগইন সম্পন্ন হয়েছে!');
        setTimeout(() => {
          onLoginSuccess(authenticatedUser!);
        }, 500);
      } else {
        setErrorMessage('ইউজার আইডি বা পাসওয়ার্ড সঠিক নয়! সঠিক তথ্য প্রদান করুন।');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset Step 1: Search Account
  const handleSearchAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetEmailOrId.trim()) {
      setResetError('অনুগ্রহ করে ইমেইল বা ইউজার আইডি লিখুন।');
      return;
    }

    const query = resetEmailOrId.trim().toLowerCase();
    const systemUsers = await fetchSystemUsers();
    
    const matched = systemUsers.find(u => 
      (u.email && u.email.toLowerCase() === query) ||
      (u.user_id && u.user_id.toLowerCase() === query) ||
      (query.includes('uttam') && u.role === 'ACCOUNTANT') ||
      (query === 'dilip' && u.full_name.includes('দীলিপ')) ||
      (query === 'shankar' && u.full_name.includes('শংকর'))
    );

    if (matched) {
      setFoundUser(matched);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setInputOtp('');
      setResetStep(2);

      const recipient = matched.email || 'uttamkumarb247@gmail.com';
      await sendOtpEmail(recipient, otp, matched.full_name);
    } else {
      setResetError('এই ইমেইল বা ইউজার আইডির কোনো অ্যাকাউন্ট পাওয়া যায়নি! সঠিক ইমেইল (যেমন: uttamkumarb247@gmail.com) প্রবেশ করুন।');
    }
  };

  // Password Reset Step 2: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (inputOtp.trim() === generatedOtp) {
      setResetStep(3);
    } else {
      setResetError('ভুল ওটিপি (OTP) কোড! নিচে দৃশ্যমান ভেরিফিকেশন কোডটি সঠিকভাবে লিখুন।');
    }
  };

  // Password Reset Step 3: Save Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setResetError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('পাসওয়ার্ড দুটি মিলছে না! পুনরায় পরীক্ষা করে নিশ্চিত করুন।');
      return;
    }

    if (!foundUser) return;

    setIsResetting(true);
    try {
      const updatedUser: User = {
        ...foundUser,
        password: newPassword
      };

      await saveOrUpdateUser(updatedUser);

      setResetSuccess('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! নতুন পাসওয়ার্ড দিয়ে এখন প্রবেশ করুন।');
      setUserIdOrEmail(updatedUser.email || updatedUser.user_id);
      setPassword(newPassword);

      setTimeout(() => {
        setShowForgotPasswordModal(false);
        setResetStep(1);
        setResetSuccess('');
      }, 1800);
    } catch (err: any) {
      setResetError(err.message || 'পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 relative overflow-hidden font-kalpurush">
      {/* Background Decorative Circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header Header Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-1 shadow-2xl shadow-emerald-900/50 mb-4 transform hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
              {branding.logo_url ? (
                <img
                  src={branding.logo_url}
                  alt={branding.school_name}
                  className="w-16 h-16 object-cover rounded-xl"
                  onError={(e) => {
                    // Fallback icon if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <School className="w-10 h-10 text-emerald-400 absolute" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide font-heading">
            {branding.school_name}
          </h1>
          <p className="text-emerald-400 text-sm font-medium mt-1">
            ভাউচার জেনারেটর ও ম্যানেজমেন্ট সফটওয়্যার
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            {branding.sub_header}
          </p>
        </div>

        {/* Login Form Box */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-700/60 relative">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-100">সিস্টেম প্রবেশ করুন</h2>
            </div>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full font-medium">
              সুরক্ষিত সংস্করণ ২.০
            </span>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 space-x-reverse text-rose-300 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 space-x-reverse text-emerald-300 text-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                ইউজার আইডি বা ইমেইল ঠিকানা
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={userIdOrEmail}
                  onChange={(e) => setUserIdOrEmail(e.target.value)}
                  placeholder="যেমন: uttamkumarr247@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                গোপন পাসওয়ার্ড
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-slate-500">পাসওয়ার্ড মনে নেই?</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(true);
                    setResetStep(1);
                    setResetEmailOrId(userIdOrEmail || 'uttamkumarr247@gmail.com');
                    setResetError('');
                    setResetSuccess('');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-all cursor-pointer flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>পাসওয়ার্ড রিসেট করুন</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center space-x-2 space-x-reverse"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-5 h-5" />
                  <span>সফটওয়্যার প্রবেশ করুন</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Credit */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © ২০২৬ চরভৈরবী উচ্চ বিদ্যালয়, হাইমচর, চাঁদপুর। সর্বস্বত্ব সংরক্ষিত।
        </p>
      </div>

      {/* Forgotten Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in font-kalpurush">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    পাসওয়ার্ড রিসেট প্রসেস
                  </h3>
                  <p className="text-xs text-slate-400">
                    ধাপ {resetStep} / ৩ - নিরাপদ পাসওয়ার্ড পরিবর্তন
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Messages */}
            {resetError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 space-x-reverse text-rose-300 text-xs animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 space-x-reverse text-emerald-300 text-xs animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {/* STEP 1: Account Lookup */}
            {resetStep === 1 && (
              <form onSubmit={handleSearchAccount} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  আপনার রেজিস্টার্ড ইমেইল ঠিকানা বা ইউজার আইডি লিখুন। সিস্টেম আপনার অ্যাকাউন্ট খুঁজে ওটিপি (OTP) কোড তৈরি করবে।
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ইমেইল বা ইউজার আইডি:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={resetEmailOrId}
                      onChange={(e) => setResetEmailOrId(e.target.value)}
                      placeholder="যেমন: uttamkumarr247@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>একাউন্ট খুঁজুন</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Verify OTP Code */}
            {resetStep === 2 && foundUser && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="text-emerald-400 font-bold flex items-center justify-between">
                    <span>ইউজার পাওয়া গেছে:</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">
                      {foundUser.role}
                    </span>
                  </div>
                  <div className="text-white font-semibold">{foundUser.full_name}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{foundUser.email}</div>
                </div>

                {/* Status of Email Sending */}
                {emailSendingStatus ? (
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    emailSendingStatus.includes('✅')
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-amber-300'
                  }`}>
                    {emailSendingStatus}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 leading-relaxed flex items-center justify-between">
                    <span>📧 আপনার ইমেইল (<strong>{foundUser.email}</strong>)-এ ওটিপি ভেরিফিকেশন কোড পাঠানো হয়েছে।</span>
                  </div>
                )}

                {/* Resend Email Button Box */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <span className="text-slate-400 text-[11px]">ইমেইল পাননি?</span>
                  <button
                    type="button"
                    disabled={isSendingEmail}
                    onClick={async () => {
                      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                      setGeneratedOtp(newCode);
                      setResetError('');
                      await sendOtpEmail(foundUser.email || 'uttamkumarb247@gmail.com', newCode, foundUser.full_name);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSendingEmail ? 'animate-spin' : ''}`} /> ওটিপি পুনরায় পাঠান
                  </button>
                </div>

                {/* Collapsible Gmail SMTP App Password Settings */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowSmtpConfig(!showSmtpConfig)}
                    className="w-full px-3 py-2 flex items-center justify-between text-slate-300 hover:text-white font-medium hover:bg-slate-900/80 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                      <KeyRound className="w-3.5 h-3.5" /> Gmail App Password সেট করুন (আসল ইমেইলে পাঠাতে)
                    </span>
                    <span className="text-[10px] text-slate-500">{showSmtpConfig ? 'সংকুচিত করুন ▲' : 'প্রসারণ করুন ▼'}</span>
                  </button>

                  {showSmtpConfig && (
                    <div className="p-3 border-t border-slate-800 space-y-2.5 bg-slate-900/90 animate-fade-in">
                      <p className="text-[11px] text-slate-400 leading-normal">
                        আপনার Google Account-এর 16-digit <span className="text-amber-300 font-semibold">App Password</span> এখানে দিলে ওটিপি সরাসরি আপনার আসল Gmail ইনবক্সে চলে যাবে।
                      </p>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">
                          প্রেরক জিমেইল ইমেইল:
                        </label>
                        <input
                          type="email"
                          value={smtpUser}
                          onChange={(e) => {
                            setSmtpUser(e.target.value);
                            saveSmtpCredentials(e.target.value, smtpPass);
                          }}
                          placeholder="uttamkumarb247@gmail.com"
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">
                          16-Digit Google App Password:
                        </label>
                        <input
                          type="password"
                          value={smtpPass}
                          onChange={(e) => {
                            setSmtpPass(e.target.value);
                            saveSmtpCredentials(smtpUser, e.target.value);
                          }}
                          placeholder="xxxx xxxx xxxx xxxx"
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isSendingEmail}
                        onClick={async () => {
                          saveSmtpCredentials(smtpUser, smtpPass);
                          await sendOtpEmail(foundUser.email || 'uttamkumarb247@gmail.com', generatedOtp, foundUser.full_name, smtpUser, smtpPass);
                        }}
                        className="w-full py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isSendingEmail ? (
                          <span>পাঠানো হচ্ছে...</span>
                        ) : (
                          <span>সেভ করুন ও ইমেইল টেস্ট পাঠান</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ৬ ডিজিটের ওটিপি প্রবেশ করুন:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="কোডটি এখানে লিখুন (যেমন: 123456)"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-white font-mono text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> পেছনে যান
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    কোড যাচাই করুন
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Enter New Password */}
            {resetStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-slate-300">
                  আপনার একাউন্টের জন্য নতুন পাসওয়ার্ড সেট করুন (কমপক্ষে ৬ অক্ষর):
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    নতুন পাসওয়ার্ড:
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষর..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    পাসওয়ার্ড নিশ্চিত করুন:
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পুনরায় একই পাসওয়ার্ড লিখুন..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isResetting ? (
                      <span>আপডেট করা হচ্ছে...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>পাসওয়ার্ড পরিবর্তন ও সেভ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

