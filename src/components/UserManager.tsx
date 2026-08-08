import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Key, 
  PenTool, 
  Upload, 
  Trash2, 
  Save, 
  Plus, 
  Copy, 
  Check, 
  Database, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  FileCode,
  Sparkles,
  Mail,
  KeyRound,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Server,
  RefreshCw
} from 'lucide-react';
import { User } from '../types';
import { getStoredSystemUsers, fetchSystemUsers, saveOrUpdateUser, deleteSystemUser, saveUser } from '../lib/supabase';
import { compressImageFile } from '../lib/imageUtils';

interface UserManagerProps {
  currentUser: User;
  onUpdateCurrentUser: (user: User) => void;
}

export const UserManager: React.FC<UserManagerProps> = ({
  currentUser,
  onUpdateCurrentUser,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(currentUser);
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'ACCOUNTANT' | 'HEADMASTER' | 'VIEWER'>('ACCOUNTANT');
  const [signatureUrl, setSignatureUrl] = useState('');
  
  // UI Helpers
  const [showPassword, setShowPassword] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'smtp' | 'sql'>('users');

  // SMTP Settings State
  const [smtpUser, setSmtpUser] = useState<string>(() => localStorage.getItem('SMTP_USER') || 'uttamkumarb247@gmail.com');
  const [smtpPass, setSmtpPass] = useState<string>(() => localStorage.getItem('SMTP_PASS') || 'iluelciwxelafevw');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [smtpTestEmail, setSmtpTestEmail] = useState<string>(() => currentUser.email || 'uttamkumarb247@gmail.com');
  const [smtpTestStatus, setSmtpTestStatus] = useState<string>('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpSuccessMsg, setSmtpSuccessMsg] = useState('');

  // Pop Up Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalUserData, setModalUserData] = useState<User | null>(null);

  // Load stored users and SMTP settings from server
  useEffect(() => {
    fetchSystemUsers().then((list) => {
      setUsers(list);
      if (list.length > 0) {
        setSelectedUser((prev) => prev || list[0]);
      }
    });

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

  // When selected user changes, update form
  useEffect(() => {
    if (selectedUser) {
      setFullName(selectedUser.full_name || '');
      setUserId(selectedUser.user_id || '');
      setEmail(selectedUser.email || '');
      setPassword(selectedUser.password || '123456');
      setRole(selectedUser.role || 'ACCOUNTANT');
      setSignatureUrl(selectedUser.signature_url || '');
    }
  }, [selectedUser]);

  // Handle signature file upload
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 350, 150, 0.85);
      setSignatureUrl(compressed);
    } catch (err) {
      console.error('Error compressing signature image:', err);
    }
  };

  // Save changes
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const updatedUser: User = {
      ...selectedUser,
      full_name: fullName.trim(),
      user_id: userId.trim(),
      email: email.trim(),
      password: password.trim(),
      role: role,
      signature_url: signatureUrl,
    };

    const newUsers = await saveOrUpdateUser(updatedUser);
    setUsers(newUsers);
    setSelectedUser(updatedUser);

    // Update session user if updating current logged in user or matching role
    if (updatedUser.id === currentUser.id || updatedUser.role === currentUser.role || updatedUser.user_id === currentUser.user_id) {
      saveUser(updatedUser);
      onUpdateCurrentUser(updatedUser);
    }

    setSavedSuccessMsg('ইউজার তথ্য ও ডিজিটাল স্বাক্ষর সফলভাবে সংরক্ষিত হয়েছে!');
    setModalUserData(updatedUser);
    setShowSuccessModal(true);
    setTimeout(() => setSavedSuccessMsg(''), 4000);
  };

  // Create New User
  const handleCreateNewUser = () => {
    const newUser: User = {
      id: `u-${Date.now()}`,
      user_id: `USER-${Math.floor(Math.random() * 900) + 100}`,
      email: `user${Date.now()}@charbhairabi.edu.bd`,
      full_name: 'নতুন ব্যবহারকারী',
      role: 'ACCOUNTANT',
      password: '123456',
      signature_url: ''
    };
    setSelectedUser(newUser);
  };

  // Delete User
  const handleDeleteUser = async (id: string) => {
    if (users.length <= 1) {
      alert('কমপক্ষে একজন সিস্টেমে অ্যাডমিন/ইউজার থাকতে হবে।');
      return;
    }
    if (confirm('আপনি কি নিশ্চিত যে এই ইউজার প্রোফাইল মুছে ফেলতে চান?')) {
      const remaining = await deleteSystemUser(id);
      setUsers(remaining);
      setSelectedUser(remaining[0] || null);
    }
  };

  const sqlScript = `-- =========================================================
-- Supabase SQL Setup Script for Charbhairabi High School App
-- Copy and run this in your Supabase Project -> SQL Editor
-- =========================================================

-- 1. Create app_users table
CREATE TABLE IF NOT EXISTS public.app_users (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT '123456',
  role TEXT NOT NULL DEFAULT 'ACCOUNTANT',
  signature_url TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create vouchers table
CREATE TABLE IF NOT EXISTS public.vouchers (
  id TEXT PRIMARY KEY,
  voucher_no TEXT UNIQUE NOT NULL,
  date TEXT NOT NULL,
  voucher_type TEXT NOT NULL,
  payee_name TEXT NOT NULL,
  account_head TEXT NOT NULL,
  amount_number NUMERIC NOT NULL,
  amount_words TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  reference_no TEXT,
  particulars JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'APPROVED',
  created_by TEXT,
  prepared_by TEXT,
  checked_by TEXT,
  approved_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) & Public Access Policies
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access app_users" ON public.app_users;
CREATE POLICY "Public full access app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access vouchers" ON public.vouchers;
CREATE POLICY "Public full access vouchers" ON public.vouchers FOR ALL USING (true) WITH CHECK (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Save SMTP Settings Handler
  const handleSaveSmtpSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('SMTP_USER', smtpUser.trim());
    localStorage.setItem('SMTP_PASS', smtpPass.trim());

    try {
      await fetch('/api/db/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim()
        })
      });
    } catch (err) {
      console.warn('Failed to save SMTP to server DB:', err);
    }

    setSmtpSuccessMsg('Gmail SMTP কনফিগারেশন ডাটাবেসে সেভ করা হয়েছে!');
    setTimeout(() => setSmtpSuccessMsg(''), 4000);
  };

  // Test SMTP Connection & Send Email Handler
  const handleTestSmtpConnection = async () => {
    if (!smtpUser || !smtpPass) {
      setSmtpTestStatus('⚠️ অনুগ্রহ করে জিমেইল এবং ১৬-ডিজিটের অ্যাপ পাসওয়ার্ড ফিল্ডে লিখুন।');
      return;
    }

    setIsTestingSmtp(true);
    setSmtpTestStatus('Gmail SMTP সার্ভার কানেকশন ও টেস্ট ইমেইল ভেরিফাই করা হচ্ছে...');

    try {
      // Step 1: Test SMTP connection
      const testRes = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpUser: smtpUser.trim(), smtpPass: smtpPass.trim() })
      });
      const testData = await testRes.json();

      if (!testData.success) {
        setSmtpTestStatus(`❌ সংযোগ ব্যর্থ: ${testData.message || 'ভুল জিমেইল বা ১৬-ডিজিটের অ্যাপ পাসওয়ার্ড।'}`);
        setIsTestingSmtp(false);
        return;
      }

      // Step 2: Send actual OTP test email
      const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const sendRes = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: smtpTestEmail.trim(),
          otp: testOtp,
          userName: currentUser.full_name || 'অ্যাডমিন',
          customSmtpUser: smtpUser.trim(),
          customSmtpPass: smtpPass.trim()
        })
      });
      const sendData = await sendRes.json();

      if (sendData.success && sendData.delivered) {
        setSmtpTestStatus(`✅ সফল! টেস্ট ওটিপি ইমেইল (${testOtp}) সফলভাবে ${smtpTestEmail} ঠিকানায় পাঠানো হয়েছে। আপনার ইনবক্স চেক করুন!`);
      } else {
        setSmtpTestStatus(`✅ SMTP কানেকশন সফল! রেসপন্স: ${sendData.message}`);
      }
    } catch (err: any) {
      setSmtpTestStatus(`❌ কানেকশন ত্রুটি: ${err.message || 'সার্ভার রেসপন্স করছে না'}`);
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-kalpurush animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 space-x-reverse mb-1">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                ইউজার ম্যানেজমেন্ট ও সিস্টেম সেটিং
              </h2>
              <p className="text-xs text-slate-400">
                সুপার অ্যাডমিন, হিসাবরক্ষক, প্রধান শিক্ষক ও অন্যান্য সকল ব্যবহারকারীর প্রোফাইল, পাসওয়ার্ড, স্বাক্ষর ও SMTP ইমেইল কনফিগারেশন
              </p>
            </div>
          </div>
        </div>

        {/* Top Tab Controls */}
        <div className="flex items-center space-x-2 space-x-reverse bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ব্যবহারকারী প্রোফাইল</span>
          </button>

          <button
            onClick={() => setActiveTab('smtp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'smtp'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>SMTP API ও ইমেইল সেটিং</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Supabase SQL কোড</span>
          </button>
        </div>
      </div>

      {savedSuccessMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl text-emerald-300 text-sm font-bold flex items-center gap-2 animate-fade-in shadow-lg">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: USER LIST & EDITOR */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: User Selection Cards */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>ব্যবহারকারী তালিকা</span>
                </h3>
                <button
                  onClick={handleCreateNewUser}
                  className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন যোগ</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {users.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-950/80 to-teal-950/60 border-emerald-500/60 shadow-lg shadow-emerald-950/40'
                          : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 space-x-reverse min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow ${
                          u.role === 'ADMIN' ? 'bg-amber-600' : u.role === 'ACCOUNTANT' ? 'bg-emerald-600' : 'bg-teal-600'
                        }`}>
                          {u.full_name ? u.full_name.charAt(0) : 'U'}
                        </div>
                        <div className="truncate">
                          <h4 className="text-sm font-bold text-white truncate">
                            {u.full_name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-mono text-emerald-400">{u.user_id}</span>
                            <span>•</span>
                            <span>{u.role === 'ADMIN' ? 'সুপার অ্যাডমিন' : u.role === 'ACCOUNTANT' ? 'হিসাবরক্ষক' : 'প্রধান শিক্ষক'}</span>
                          </div>
                        </div>
                      </div>

                      {u.signature_url ? (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex-shrink-0">
                          স্বাক্ষর যুক্ত
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Edit Profile Form */}
          <div className="lg:col-span-8">
            {selectedUser ? (
              <form onSubmit={handleSaveUser} className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-6">
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
                      <PenTool className="w-5 h-5 text-emerald-400" />
                      <span>{selectedUser.full_name} — প্রোফাইল ও অ্যাক্সেস কাস্টমাইজেশন</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ইউজার আইডি, নাম, গোপন পাসওয়ার্ড পরিবর্তন ও ডিজিটাল স্বাক্ষর আপলোড করুন
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl transition-all cursor-pointer"
                    title="ইউজার মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      পূর্ণ নাম (Full Name) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="যেমন: শংকর চন্দ্র (সুপার অ্যাডমিন)"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* User ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      ইউজার আইডি (User ID) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="যেমন: ADMIN-01 বা ACC-02"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-300 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Email / Username */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      ইমেইল / লগইন ইউজারনেম <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="যেমন: admin@charbhairabi.edu.bd বা shankar"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Password with change system */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                      <span>গোপন পাসওয়ার্ড (Password)</span>
                      <span className="text-[11px] text-emerald-400 font-normal">ডিফল্ট পরিবর্তনযোগ্য</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="পাসওয়ার্ড দিন (ডিফল্ট: 123456)"
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      সিস্টেম ভূমিকা (User Role)
                    </label>
                    <select
                      value={role}
                      onChange={(e: any) => setRole(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="ADMIN">সুপার অ্যাডমিন (Super Admin - পূর্ণ ক্ষমতা)</option>
                      <option value="ACCOUNTANT">হিসাবরক্ষক (Accountant - ভাউচার তৈরি ও ম্যানেজ)</option>
                      <option value="HEADMASTER">প্রধান শিক্ষক (Headmaster - অনুমোদনকারী)</option>
                      <option value="VIEWER">দর্শক (Viewer - শুধুমাত্র পর্যবেক্ষণ)</option>
                    </select>
                  </div>

                </div>

                {/* Digital Signature Upload Section */}
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-emerald-400" />
                        <span>ডিজিটাল অফিসিয়াল স্বাক্ষর (Digital Signature)</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        প্রিন্ট করা ভাউচারের স্বাক্ষর লাইনে এই ডিজিটাল স্বাক্ষরটি স্বয়ংক্রিয়ভাবে বসবে
                      </p>
                    </div>

                    {signatureUrl && (
                      <button
                        type="button"
                        onClick={() => setSignatureUrl('')}
                        className="px-3 py-1 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        স্বাক্ষর মুছুন
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* Preview Box */}
                    <div className="h-28 bg-white/95 rounded-xl border-2 border-dashed border-slate-300 p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                      {signatureUrl ? (
                        <img
                          src={signatureUrl}
                          alt="Signature Preview"
                          className="max-h-20 object-contain"
                        />
                      ) : (
                        <div className="text-slate-400 space-y-1">
                          <PenTool className="w-6 h-6 mx-auto opacity-50 text-slate-600" />
                          <p className="text-xs text-slate-500 font-semibold">কোনো স্বাক্ষর আপলোড করা নেই</p>
                        </div>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="space-y-2">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all">
                        <Upload className="w-4 h-4" />
                        <span>স্বাক্ষরের ছবি নির্বাচন করুন (PNG/JPG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-slate-400 text-center">
                        স্বচ্ছ (Transparent PNG) ব্যাকগ্রাউন্ডের ছবি ব্যবহার করলে প্রিন্ট আউট সবচেয়ে সুন্দর দেখাবে।
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>ইউজার তথ্য ও স্বাক্ষর সংরক্ষণ করুন</span>
                  </button>
                </div>

              </form>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-400 rounded-3xl border border-slate-800">
                বাম পাশের তালিকা থেকে ইউজার সিলেক্ট করুন।
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: SMTP API & GMAIL EMAIL CONFIGURATION */}
      {activeTab === 'smtp' && (
        <div className="space-y-6 animate-fade-in">
          
          {smtpSuccessMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl text-emerald-300 text-sm font-bold flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{smtpSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Box: Gmail SMTP Configuration Form */}
            <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-6">
              
              <div className="flex items-center space-x-3 space-x-reverse pb-4 border-b border-slate-800">
                <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Gmail SMTP API সার্ভার কনফিগারেশন
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ব্যবহারকারীর ইমেইলে সরাসরি ওটিপি (OTP) ও ভেরিফিকেশন কোড পাঠানোর জন্য
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveSmtpSettings} className="space-y-5">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      SMTP Host (সার্ভার নাম):
                    </label>
                    <input
                      type="text"
                      disabled
                      value="smtp.gmail.com"
                      className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-400 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      SMTP Port (পোর্ট):
                    </label>
                    <input
                      type="text"
                      disabled
                      value="465 (SSL / Secure)"
                      className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-400 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    প্রেরক জিমেইল ইমেইল (SMTP_USER):
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="uttamkumarb247@gmail.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>১৬-ডিজিটের Google App Password (SMTP_PASS):</span>
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-normal"
                    >
                      <span>অ্যাপ পাসওয়ার্ড তৈরি লিংক</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showSmtpPassword ? 'text' : 'password'}
                      required
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    আপনার সাধারণ জিমেইল পাসওয়ার্ড নয়; গুগলের সিকিউরিটি পেজ থেকে প্রাপ্ত ১৬ অক্ষরের অ্যাপ পাসওয়ার্ডটি এখানে লিখুন।
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>SMTP সেটিংস সেভ করুন</span>
                  </button>
                </div>

              </form>

            </div>

            {/* Right Box: Live Connection Test & Tutorial Guide */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Test Email Card */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse pb-3 border-b border-slate-800">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white font-heading">
                    লাইভ SMTP টেস্ট ও ইমেইল পরীক্ষা
                  </h4>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  আপনার ইনপুটকৃত অ্যাপ পাসওয়ার্ড দিয়ে সরাসরি টেস্ট ওটিপি ইমেইল পাঠিয়ে যাচাই করুন:
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      প্রাপক ইমেইল (Test Recipient):
                    </label>
                    <input
                      type="email"
                      value={smtpTestEmail}
                      onChange={(e) => setSmtpTestEmail(e.target.value)}
                      placeholder="uttamkumarb247@gmail.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isTestingSmtp}
                    onClick={handleTestSmtpConnection}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isTestingSmtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>কানেকশন টেস্ট করা হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>টেস্ট ইমেইল ও ওটিপি পাঠান</span>
                      </>
                    )}
                  </button>

                  {smtpTestStatus && (
                    <div className={`p-3 rounded-xl border text-xs leading-relaxed font-medium animate-fade-in ${
                      smtpTestStatus.includes('✅')
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : smtpTestStatus.includes('❌')
                        ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-amber-300'
                    }`}>
                      {smtpTestStatus}
                    </div>
                  )}
                </div>
              </div>

              {/* Step-by-step Tutorial */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-heading">
                  <KeyRound className="w-4 h-4" />
                  <span>Google App Password কিভাবে পাবেন? (গাইড)</span>
                </h4>

                <ol className="text-[11px] text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    ব্রাউজারে <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">myaccount.google.com/security</a> লিংকে যান।
                  </li>
                  <li>
                    Google Account-এ <strong className="text-white">2-Step Verification</strong> চালু করুন (চালু না থাকলে অ্যাপ পাসওয়ার্ড তৈরি করা যায় না)।
                  </li>
                  <li>
                    সার্চবারে <strong className="text-amber-300">"App passwords"</strong> লিখে সার্চ দিন বা <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">myaccount.google.com/apppasswords</a> লিংকে যান।
                  </li>
                  <li>
                    App name বক্সে <strong className="text-white">"School Voucher App"</strong> লিখে <strong className="text-emerald-400 font-bold">Create</strong> চাপুন।
                  </li>
                  <li>
                    প্রদর্শিত <strong className="text-amber-300 font-mono">16-character code</strong> টি কপি করে উপরে <strong className="text-white">SMTP_PASS</strong> ঘরে বসিয়ে সেভ করুন!
                  </li>
                </ol>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 3: SUPABASE SQL QUERY CODE GENERATOR */}
      {activeTab === 'sql' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-heading">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>Supabase SQL ডাটাবেজ স্ক্রিপ্ট (Database Tables Schema)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Supabase Dashboard এর SQL Editor এ এই কোডটি রান করলে সকল ইউজার পাসওয়ার্ড, ভাউচার ও ডিজিটাল স্বাক্ষর ক্লাউডে পার্মানেন্ট সেভ থাকবে।
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                copiedSql
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30'
              }`}
            >
              {copiedSql ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>কপি করা হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>SQL কোড কপি করুন</span>
                </>
              )}
            </button>
          </div>

          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
            <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
              {sqlScript}
            </pre>
          </div>
        </div>
      )}

      {/* POP UP MODAL: USER INFORMATION UPDATE SUCCESS CONFIRMATION */}
      {showSuccessModal && modalUserData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-left space-y-5 relative">
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/40 flex-shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-heading">
                  ইউজার তথ্য আপডেট সম্পন্ন!
                </h3>
                <p className="text-xs text-emerald-400 font-medium mt-0.5">
                  তথ্যসমূহ সফলভাবে সংরক্ষিত হয়েছে
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs font-kalpurush">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">পূর্ণ নাম:</span>
                <span className="text-white font-bold">{modalUserData.full_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">ইউজার আইডি (User ID):</span>
                <span className="text-emerald-400 font-mono font-bold">{modalUserData.user_id}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">লগইন আইডি/ইমেইল:</span>
                <span className="text-slate-200 font-mono">{modalUserData.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">পাসওয়ার্ড (Password):</span>
                <span className="text-amber-300 font-mono font-bold">{modalUserData.password || '123456'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">সিস্টেম ভূমিকা (Role):</span>
                <span className="text-teal-300 font-bold">
                  {modalUserData.role === 'ADMIN' ? 'সুপার অ্যাডমিন' : modalUserData.role === 'ACCOUNTANT' ? 'হিসাবরক্ষক' : modalUserData.role === 'HEADMASTER' ? 'প্রধান শিক্ষক' : 'দর্শক'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">ডিজিটাল স্বাক্ষর:</span>
                <span className={modalUserData.signature_url ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {modalUserData.signature_url ? '✓ আপলোড করা হয়েছে' : 'নেই'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              পরবর্তী লগইনের সময় আপনি এই ইউজার আইডি বা ইমেইল এবং নতুন পাসওয়ার্ড ব্যবহার করে প্রবেশ করতে পারবেন।
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>ঠিক আছে (ধন্যবাদ)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
