import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Check, RotateCcw, Sliders, School, Sparkles, CheckCircle2, X } from 'lucide-react';
import { SchoolBranding } from '../types';
import { DEFAULT_BRANDING } from '../lib/initialData';
import { compressImageFile } from '../lib/imageUtils';

interface LogoCustomizerProps {
  branding: SchoolBranding;
  onSaveBranding: (updated: SchoolBranding) => void;
}

const PRESET_LOGOS = [
  {
    name: 'চরভৈরবী হাইস্কুল অফিসিয়াল মনোগ্রাম',
    url: 'https://images.unsplash.com/photo-1594312915251-48db9280c8f1?q=80&w=300&auto=format&fit=crop',
  },
  {
    name: 'জ্ঞান আলো প্রতীক (ক্ল্যাসিক সিগনেট)',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=300&auto=format&fit=crop',
  },
  {
    name: 'গোল্ডেন সিল ক্রেস্ট (গোল্ডেন এমব্লেম)',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=300&auto=format&fit=crop',
  },
];

export const LogoCustomizer: React.FC<LogoCustomizerProps> = ({
  branding,
  onSaveBranding,
}) => {
  const [formData, setFormData] = useState<SchoolBranding>({ ...branding });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 450, 450, 0.85);
        setFormData(prev => ({
          ...prev,
          logo_url: compressed,
        }));
      } catch (err) {
        console.error('Error compressing logo:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBranding(formData);
    setShowSuccessPopup(true);
  };

  const handleReset = () => {
    if (confirm('আপনি কি পূর্বনির্ধারিত ব্র্যান্ডিং সেটিংসে ফিরে যেতে চান?')) {
      setFormData({ ...DEFAULT_BRANDING });
      onSaveBranding(DEFAULT_BRANDING);
      setShowSuccessPopup(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-kalpurush animate-fade-in">
      
      {/* Title Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 space-x-reverse px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-300 text-xs font-semibold mb-2">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>লোগো ও প্রাতিষ্ঠানিক ব্র্যান্ডিং মডিউল</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white font-heading">
            বিদ্যালয়ের লোগো ও হেডার কাস্টমাইজেশন
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            এখানে আপলোডকৃত লোগো ও প্রাতিষ্ঠানিক ঠিকানা সকল প্রিন্টকৃত ভাউচারে ডাইনামিকভাবে প্রদর্শিত হবে।
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <span>রিসেট (ডিফল্ট)</span>
        </button>
      </div>

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/60 text-center space-y-5 transform transition-all scale-100 animate-scale-up">
            
            {/* Close button top right */}
            <button
              type="button"
              onClick={() => setShowSuccessPopup(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Success Icon Badge */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white font-heading">
                তথ্য সফলভাবে আপডেট হয়েছে!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-kalpurush">
                বিদ্যালয়ের লোগো ও প্রাতিষ্ঠানিক তথ্য সফলভাবে সেভ করা হয়েছে। এখন থেকে সকল নতুন ও বিদ্যমান ভাউচারে এই নতুন তথ্য ও লোগো ডাইনামিকভাবে প্রদর্শিত হবে।
              </p>
            </div>

            {/* Summary Preview Box */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center space-x-3 space-x-reverse text-right font-kalpurush">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <School className="w-6 h-6 text-slate-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-emerald-300 truncate font-heading">
                  {formData.school_name || 'প্রতিষ্ঠানের নাম'}
                </h4>
                <p className="text-[11px] text-slate-400 truncate">
                  EIIN: {formData.eiin_no || 'N/A'} | স্থাপিত: {formData.established_year || 'N/A'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSuccessPopup(false)}
              className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition-all cursor-pointer flex items-center justify-center space-x-2 space-x-reverse"
            >
              <Check className="w-4 h-4" />
              <span>ঠিক আছে (বন্ধ করুন)</span>
            </button>

          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 7 Cols: Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Logo Upload Box */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Upload className="w-4 h-4" />
              ১. বিদ্যালয়ের লোগো ফাইল আপলোড
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-28 h-28 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 flex items-center justify-center p-2 relative group overflow-hidden">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <School className="w-10 h-10 text-slate-600" />
                )}
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <p className="text-xs text-slate-300">
                  PNG বা JPEG ফরম্যাটের স্বচ্ছ (Transparent) লোগো ইমেজ নির্বাচন করুন।
                </p>
                <label className="inline-flex items-center space-x-2 space-x-reverse py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>কম্পিউটার থেকে নতুন লোগো নির্বাচন করুন</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Scale Slider */}
            <div className="pt-4 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" /> লোগোর আকার (Logo Scale Ratio):
                </span>
                <span className="text-emerald-400 font-mono">{formData.logo_scale.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={formData.logo_scale}
                onChange={(e) => setFormData({ ...formData, logo_scale: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 bg-slate-900 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>ছোট (০.৫x)</span>
                <span>স্বাভাবিক (১.০x)</span>
                <span>বড় (২.০x)</span>
              </div>
            </div>

            {/* Presets */}
            <div className="pt-3">
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                অথবা প্রস্তাবিত লোগো টেমপ্লেট নির্বাচন করুন:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_LOGOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, logo_url: preset.url })}
                    className="p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-xl text-[11px] text-slate-300 font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center"
                  >
                    <img src={preset.url} alt={preset.name} className="w-8 h-8 object-contain rounded" />
                    <span className="truncate w-full">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* School Details */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <School className="w-4 h-4" />
              ২. প্রতিষ্ঠানের ঠিকানা ও পরিচিতি তথ্য
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  বিদ্যালয়ের নাম (বাংলায়) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.school_name}
                  onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  বিদ্যালয়ের নাম (English)
                </label>
                <input
                  type="text"
                  value={formData.school_name_en}
                  onChange={(e) => setFormData({ ...formData, school_name_en: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  EIIN নম্বর *
                </label>
                <input
                  type="text"
                  value={formData.eiin_no}
                  onChange={(e) => setFormData({ ...formData, eiin_no: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-300 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  প্রতিষ্ঠার সাল
                </label>
                <input
                  type="text"
                  value={formData.established_year}
                  onChange={(e) => setFormData({ ...formData, established_year: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                পূর্ণাঙ্গ ঠিকানা
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  যোগাযোগ ফোন নম্বর
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  অফিসিয়াল ইমেইল
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse pt-2">
              <input
                type="checkbox"
                id="watermark_cb"
                checked={formData.watermark_enabled}
                onChange={(e) => setFormData({ ...formData, watermark_enabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700 focus:ring-emerald-500"
              />
              <label htmlFor="watermark_cb" className="text-xs font-bold text-slate-300 cursor-pointer">
                ভাউচারের ব্যাকগ্রাউন্ডে ঝাপসা ওয়াটারমার্ক লোগো দেখান
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-900/40 flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>পরিবর্তনসমূহ সংরক্ষণ করুন</span>
          </button>
        </div>

        {/* Right 5 Cols: Live Header Preview Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-28">
            <span className="text-xs font-bold text-slate-400 block mb-2">
              ভাউচার হেডার লাইব প্রিভিউ (Live Printed Paper Preview):
            </span>

            <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl border-2 border-slate-300 text-center space-y-2">
              <div className="flex justify-between text-[10px] text-slate-600 font-bold border-b pb-2">
                <span>EIIN: {formData.eiin_no}</span>
                <span>স্থাপিত: {formData.established_year}</span>
              </div>

              <div className="py-2 flex flex-col items-center">
                {formData.logo_url && (
                  <img
                    src={formData.logo_url}
                    alt="Logo"
                    style={{ transform: `scale(${formData.logo_scale})` }}
                    className="h-16 w-16 object-contain mb-3.5 transition-transform"
                  />
                )}
                <h4 className="text-xl font-black text-slate-900 font-heading mt-1">
                  {formData.school_name || 'বিদ্যালয়ের নাম'}
                </h4>
                <p className="text-[11px] font-bold text-slate-700 font-mono">
                  {formData.school_name_en}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">
                  {formData.address}
                </p>
              </div>

              <div className="mt-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-full inline-block px-6">
                ক্যাশ/ডেবিট ভাউচার (নমুনা)
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
