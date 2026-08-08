import React from 'react';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  Printer, 
  Eye, 
  ArrowUpRight, 
  ArrowDownLeft, 
  BarChart3, 
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { Voucher } from '../types';
import { formatBengaliDate, formatTaka, toBengaliNumber } from '../lib/bengaliUtils';

interface DashboardStatsProps {
  vouchers: Voucher[];
  onCreateNew: (type?: 'DEBIT' | 'CREDIT') => void;
  onViewVoucher: (voucher: Voucher) => void;
  onGoToList: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  vouchers,
  onCreateNew,
  onViewVoucher,
  onGoToList,
}) => {
  // Compute Stats
  const totalCount = vouchers.length;

  const totalDebitAmount = vouchers
    .filter(v => v.voucher_type === 'DEBIT')
    .reduce((sum, v) => sum + (v.amount_number || 0), 0);

  const totalCreditAmount = vouchers
    .filter(v => v.voucher_type === 'CREDIT')
    .reduce((sum, v) => sum + (v.amount_number || 0), 0);

  const pendingCount = vouchers.filter(v => v.status === 'PENDING').length;

  // Breakdown by Account Head
  const accountHeadSummary: Record<string, number> = {};
  vouchers.forEach(v => {
    if (v.voucher_type === 'DEBIT') {
      accountHeadSummary[v.account_head] = (accountHeadSummary[v.account_head] || 0) + v.amount_number;
    }
  });

  const topAccountHeads = Object.entries(accountHeadSummary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentVouchers = vouchers.slice(0, 5);

  return (
    <div className="space-y-8 font-kalpurush animate-fade-in">
      
      {/* Top Banner & Quick Action Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 space-x-reverse px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>চরভৈরবী উচ্চ বিদ্যালয় ডিজিটালাইজেশন পোর্টাল</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              ভাউচার ম্যানেজমেন্ট ড্যাশবোর্ড
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              রিয়েল-টাইম ডাটাবেজ সমন্বয়সহ বিদ্যালয়ের যাবতীয় জমা, খরচ ও ফান্ড বিতরণের আধুনিক ডিজিটাল রূপ।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onCreateNew('DEBIT')}
              className="py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-900/40 flex items-center space-x-2 space-x-reverse transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন খরচ (ডেবিট) ভাউচার</span>
            </button>

            <button
              onClick={() => onCreateNew('CREDIT')}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-sm rounded-2xl flex items-center space-x-2 space-x-reverse transition-all cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>নতুন জমা (ক্রেডিট)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Total Expense */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              মোট ব্যয় / বিতরণ (ডেবিট)
            </span>
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              {formatTaka(totalDebitAmount)}
            </h3>
            <p className="text-xs text-rose-400/90 flex items-center gap-1 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> খরচ হিসাব খাত থেকে অনুমোদিত
            </p>
          </div>
        </div>

        {/* Card 2: Total Receipts */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              মোট জমা / আয় (ক্রেডিট)
            </span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              {formatTaka(totalCreditAmount)}
            </h3>
            <p className="text-xs text-emerald-400/90 flex items-center gap-1 mt-1 font-medium">
              <ArrowDownLeft className="w-3.5 h-3.5" /> অনুদান ও বিদ্যালয় আয় ফান্ড
            </p>
          </div>
        </div>

        {/* Card 3: Total Vouchers Count */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              মোট নিবন্ধিত ভাউচার
            </span>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              {toBengaliNumber(totalCount)} টি
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
              <Calendar className="w-3.5 h-3.5" /> ডিজিটাল ভাউচার সংরক্ষিত
            </p>
          </div>
        </div>

        {/* Card 4: Pending Approvals */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              অনুমোদনের অপেক্ষায়
            </span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-heading">
              {toBengaliNumber(pendingCount)} টি
            </h3>
            <p className="text-xs text-amber-400/80 flex items-center gap-1 mt-1 font-medium">
              যাচাইকারী বা প্রধান শিক্ষকের স্বাক্ষর বাকি
            </p>
          </div>
        </div>

      </div>

      {/* Main Grid: Recent Vouchers + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Recent Vouchers Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                সর্বশেষ তৈরি করা ভাউচারসমূহ
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                সাম্প্রতিক অর্থ প্রদান ও জমা সংক্রান্ত ডিজিটাল রশিদ
              </p>
            </div>
            <button
              onClick={onGoToList}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
            >
              সব ভাউচার দেখুন ({toBengaliNumber(totalCount)}) →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-3 text-right">ভাউচার নং</th>
                  <th className="py-3 px-3 text-right">তারিখ</th>
                  <th className="py-3 px-3 text-right">ধরণ</th>
                  <th className="py-3 px-3 text-right">গ্রহীতা / বিবরণ</th>
                  <th className="py-3 px-3 text-right">পরিমাণ (টাকা)</th>
                  <th className="py-3 px-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {recentVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3 font-mono text-emerald-300 font-bold">
                      {v.voucher_no}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 whitespace-nowrap">
                      {formatBengaliDate(v.date)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        v.voucher_type === 'DEBIT'
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}>
                        {v.voucher_type === 'DEBIT' ? 'খরচ (ডেবিট)' : 'জমা (ক্রেডিট)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-200 font-medium max-w-xs truncate">
                      {v.payee_name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {v.account_head}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white text-sm whitespace-nowrap">
                      {formatTaka(v.amount_number)}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onViewVoucher(v)}
                        className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 rounded-lg border border-emerald-500/30 transition-all cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                        title="প্রিন্ট প্রিভিউ ও ডাউনলোড"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>প্রিন্ট</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Top Account Heads Expense Distribution */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div className="pb-4 mb-5 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              খাতভিত্তিক খরচের হিসাব
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              বিদ্যালয়ের সর্বোচ্চ ব্যয়িত খাতসমূহের বিবরণী
            </p>
          </div>

          <div className="space-y-4">
            {topAccountHeads.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-500">
                এখনো কোনো খরচের ডেটা যুক্ত করা হয়নি।
              </p>
            ) : (
              topAccountHeads.map(([head, amount], idx) => {
                const percentage = totalDebitAmount > 0 ? Math.round((amount / totalDebitAmount) * 100) : 0;
                return (
                  <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-200 truncate max-w-[180px]">
                        {head}
                      </span>
                      <span className="font-extrabold text-emerald-400">
                        {formatTaka(amount)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                      <span>মোট ব্যয়ের {toBengaliNumber(percentage)}%</span>
                      <span>{toBengaliNumber(idx + 1)}ম সর্বোচ্চ</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
