import React, { useState, useEffect } from 'react';
import { LogOut, AlertTriangle, X, Check } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { VoucherForm } from './components/VoucherForm';
import { VoucherPreviewModal } from './components/VoucherPreviewModal';
import { LogoCustomizer } from './components/LogoCustomizer';
import { VoucherList } from './components/VoucherList';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { UserManager } from './components/UserManager';

import { 
  getSavedUser, 
  saveUser, 
  getStoredBranding, 
  fetchBranding,
  saveStoredBranding, 
  getSavedSupabaseConfig, 
  fetchAllVouchers, 
  createVoucher, 
  updateVoucher, 
  deleteVoucher, 
  subscribeToVouchersChange 
} from './lib/supabase';
import { SchoolBranding, SupabaseConfig, User, Voucher, VoucherType } from './types';

export default function App() {
  // Authentication State
  const [user, setUser] = useState<User | null>(() => getSavedUser());
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'list' | 'branding' | 'database' | 'users'>('dashboard');
  
  // Data State
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [branding, setBranding] = useState<SchoolBranding>(() => getStoredBranding());
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => getSavedSupabaseConfig());

  // Modal / Selection State
  const [previewVoucher, setPreviewVoucher] = useState<Voucher | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [initialVoucherType, setInitialVoucherType] = useState<VoucherType>('DEBIT');
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load Vouchers & Setup Real-time Sync
  useEffect(() => {
    // Initial Fetch Branding for all users
    fetchBranding().then((b) => setBranding(b));

    if (!user) return;

    // Initial Fetch Vouchers
    fetchAllVouchers().then((data) => setVouchers(data));

    // Real-time subscription
    const unsubscribe = subscribeToVouchersChange((updatedList) => {
      setVouchers(updatedList);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Handle Login / Logout
  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    saveUser(null);
    setUser(null);
    setShowLogoutModal(false);
  };

  // Handle Voucher Operations
  const handleSaveVoucher = async (
    voucherData: Omit<Voucher, 'id' | 'created_at' | 'updated_at'>,
    existingId?: string
  ): Promise<Voucher> => {
    let saved: Voucher;
    const targetId = existingId || editingVoucher?.id;
    if (targetId) {
      const existing = vouchers.find(v => v.id === targetId) || editingVoucher;
      saved = await updateVoucher({
        ...(existing || {}),
        ...voucherData,
        id: targetId,
        updated_at: new Date().toISOString()
      } as Voucher);
      setEditingVoucher(null);
    } else {
      saved = await createVoucher(voucherData);
    }

    const fresh = await fetchAllVouchers();
    setVouchers(fresh);
    return saved;
  };

  const handleDeleteVoucher = async (id: string) => {
    setVouchers(prev => prev.filter(v => v.id !== id));
    await deleteVoucher(id);
    const fresh = await fetchAllVouchers();
    setVouchers(fresh);
  };

  // Handle Branding Save
  const handleSaveBranding = (updatedBranding: SchoolBranding) => {
    setBranding(updatedBranding);
    saveStoredBranding(updatedBranding);
  };

  // Handle Create Action Trigger
  const handleTriggerCreate = (type: VoucherType = 'DEBIT') => {
    setEditingVoucher(null);
    setInitialVoucherType(type);
    setActiveTab('create');
  };

  // Handle Edit Action Trigger
  const handleTriggerEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setActiveTab('create');
  };

  // 1. If not authenticated, force Login Screen
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} branding={branding} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-kalpurush flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Sticky Main Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        branding={branding}
        supabaseConfig={supabaseConfig}
        onLogout={handleLogout}
        onOpenDatabaseSettings={() => setShowDatabaseModal(true)}
      />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardStats
            vouchers={vouchers}
            onCreateNew={handleTriggerCreate}
            onViewVoucher={(v) => setPreviewVoucher(v)}
            onGoToList={() => setActiveTab('list')}
          />
        )}

        {/* TAB 2: Voucher Creator / Edit Form */}
        {activeTab === 'create' && (
          <VoucherForm
            currentUser={user}
            onSaveVoucher={handleSaveVoucher}
            onPreviewVoucher={(v) => setPreviewVoucher(v)}
            onCancel={() => {
              setEditingVoucher(null);
              setActiveTab('dashboard');
            }}
            initialType={initialVoucherType}
            editingVoucher={editingVoucher}
          />
        )}

        {/* TAB 3: Voucher List & Search */}
        {activeTab === 'list' && (
          <VoucherList
            vouchers={vouchers}
            onViewVoucher={(v) => setPreviewVoucher(v)}
            onEditVoucher={handleTriggerEdit}
            onDeleteVoucher={handleDeleteVoucher}
            onCreateNew={() => handleTriggerCreate('DEBIT')}
          />
        )}

        {/* TAB 4: School Logo & Branding Customizer */}
        {activeTab === 'branding' && (
          <LogoCustomizer
            branding={branding}
            onSaveBranding={handleSaveBranding}
          />
        )}

        {/* TAB 5: User Profiles, Passwords & Digital Signatures */}
        {activeTab === 'users' && user && (
          <UserManager
            currentUser={user}
            onUpdateCurrentUser={(updated) => setUser(updated)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-kalpurush">
        <p>
          {branding.school_name} — ভাউচার ও হিসাব সংক্রান্ত সফ্টওয়্যার | EIIN: {branding.eiin_no}
        </p>
        <p className="mt-1 text-slate-600">
          রিয়েল-টাইম ডাটাবেজ সমন্বয় ভার্সন ২.০ | সর্বস্বত্ব সংরক্ষিত ২০২৬
        </p>
        <p className="mt-2 text-emerald-400 font-bold text-xs tracking-wide">
          সফটওয়্যারটি তৈরি করেছেন উত্তম কুমার বিশ্বাস
        </p>
      </footer>

      {/* Modal 1: Printable Cash Voucher Preview */}
      {previewVoucher && (
        <VoucherPreviewModal
          voucher={previewVoucher}
          branding={branding}
          onClose={() => setPreviewVoucher(null)}
        />
      )}

      {/* Modal 2: Supabase Credentials Settings */}
      {showDatabaseModal && (
        <SupabaseConfigModal
          config={supabaseConfig}
          onClose={() => setShowDatabaseModal(false)}
          onUpdateConfig={() => setSupabaseConfig(getSavedSupabaseConfig())}
        />
      )}

      {/* Modal 3: Logout Confirmation Popup */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-left space-y-5 relative">
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/30 flex-shrink-0">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  লগআউট নিশ্চিতকরণ
                </h3>
                <p className="text-xs text-rose-300 font-medium mt-0.5">
                  সফটওয়্যার সেশন সমাপ্তি
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-kalpurush">
              আপনি কি নিশ্চিত যে <span className="text-white font-bold">{user.full_name}</span> আইডি থেকে সফটওয়্যার লগআউট করতে চান?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 font-kalpurush">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                বাতিল করুন
              </button>

              <button
                type="button"
                onClick={confirmLogout}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/50 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>হ্যাঁ, লগআউট করুন</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
