import React, { useState } from 'react';
import { Database, Wifi, CheckCircle2, X, Copy, Check, ShieldCheck, Sparkles, Code2 } from 'lucide-react';
import { saveSupabaseConfig, getSavedSupabaseConfig } from '../lib/supabase';
import { SupabaseConfig } from '../types';

interface SupabaseConfigModalProps {
  config: SupabaseConfig;
  onClose: () => void;
  onUpdateConfig: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- 1. Vouchers Table Creation
CREATE TABLE IF NOT EXISTS public.vouchers (
  id TEXT PRIMARY KEY,
  voucher_no TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  voucher_type TEXT NOT NULL,
  payee_name TEXT NOT NULL,
  account_head TEXT NOT NULL,
  amount_number NUMERIC NOT NULL,
  amount_words TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  reference_no TEXT,
  particulars JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'APPROVED',
  created_by TEXT,
  prepared_by TEXT,
  checked_by TEXT,
  approved_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. School Branding Table
CREATE TABLE IF NOT EXISTS public.school_branding (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  school_name TEXT,
  school_name_en TEXT,
  eiin_no TEXT,
  established_year TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  sub_header TEXT,
  logo_url TEXT,
  logo_scale NUMERIC DEFAULT 1.0,
  watermark_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. System Users Table
CREATE TABLE IF NOT EXISTS public.system_users (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  password TEXT NOT NULL,
  signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Real-Time Sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.vouchers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_branding;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_users;

-- 5. Row Level Security Policies (Allow Public Read/Write)
ALTER TABLE public.vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_branding DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users DISABLE ROW LEVEL SECURITY;

-- If you keep RLS enabled, run these policies with WITH CHECK:
DROP POLICY IF EXISTS "Allow public read/write access on vouchers" ON public.vouchers;
CREATE POLICY "Allow public read/write access on vouchers" ON public.vouchers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write access on branding" ON public.school_branding;
CREATE POLICY "Allow public read/write access on branding" ON public.school_branding FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write access on users" ON public.system_users;
CREATE POLICY "Allow public read/write access on users" ON public.system_users FOR ALL USING (true) WITH CHECK (true);
`;

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  config,
  onClose,
  onUpdateConfig,
}) => {
  const [url, setUrl] = useState(config.url);
  const [anonKey, setAnonKey] = useState(config.anonKey);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey);
    setSavedSuccess(true);
    onUpdateConfig();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md font-kalpurush">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white font-heading">
                Supabase রিয়েল-টাইম ডাটাবেজ সেটিংস
              </h3>
              <p className="text-xs text-slate-400">
                সুপাবেস ডাটাবেজ প্রজেক্টের সাথে সরাসরী সংযোগ স্থাপন করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl flex items-center space-x-2 space-x-reverse text-emerald-300 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>সুপাবেস ক্রেনডেনশিয়ালস সফলভাবে সেভ করা হয়েছে!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://your-project-id.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Copy SQL Schema Helper */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Code2 className="w-4 h-4 text-emerald-400" /> সুপাবেস টেবিল স্কিমা কোড (SQL Schema):
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'কপি হয়েছে!' : 'SQL কপি করুন'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              আপনার Supabase Dashboard-এর <b>SQL Editor</b>-এ উপরের কোড রান করলে স্বয়ংক্রিয়ভাবে `vouchers` টেবিল ও রিয়েল-টাইম সিঙ্ক চালু হয়ে যাবে।
            </p>
          </div>

          <div className="flex justify-end space-x-3 space-x-reverse pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all cursor-pointer"
            >
              বন্ধ করুন
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              কানেক্ট করুন
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
