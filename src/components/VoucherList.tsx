import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  Download, 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  Layers,
  Calendar
} from 'lucide-react';
import { Voucher, VoucherType } from '../types';
import { formatBengaliDate, formatTaka, toBengaliNumber } from '../lib/bengaliUtils';

interface VoucherListProps {
  vouchers: Voucher[];
  onViewVoucher: (voucher: Voucher) => void;
  onEditVoucher: (voucher: Voucher) => void;
  onDeleteVoucher: (id: string) => void;
  onCreateNew: () => void;
}

export const VoucherList: React.FC<VoucherListProps> = ({
  vouchers,
  onViewVoucher,
  onEditVoucher,
  onDeleteVoucher,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | VoucherType>('ALL');
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);

  // Filter Vouchers
  const filteredVouchers = vouchers.filter((v) => {
    const matchesQuery = 
      v.voucher_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.payee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.account_head.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.reference_no && v.reference_no.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedTypeFilter === 'ALL' || v.voucher_type === selectedTypeFilter;

    return matchesQuery && matchesType;
  });

  // Calculate totals for filtered list
  const filteredDebitTotal = filteredVouchers
    .filter(v => v.voucher_type === 'DEBIT')
    .reduce((sum, v) => sum + v.amount_number, 0);

  const filteredCreditTotal = filteredVouchers
    .filter(v => v.voucher_type === 'CREDIT')
    .reduce((sum, v) => sum + v.amount_number, 0);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredVouchers.length === 0) {
      alert('এক্সপোর্ট করার মতো কোনো ভাউচার নেই।');
      return;
    }

    const headers = ['Voucher No', 'Date', 'Type', 'Payee Name', 'Account Head', 'Amount', 'Payment Method', 'Reference'];
    const rows = filteredVouchers.map(v => [
      `"${v.voucher_no}"`,
      `"${v.date}"`,
      `"${v.voucher_type}"`,
      `"${v.payee_name.replace(/"/g, '""')}"`,
      `"${v.account_head.replace(/"/g, '""')}"`,
      v.amount_number,
      `"${v.payment_method}"`,
      `"${v.reference_no || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Charbhairabi_High_School_Vouchers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-kalpurush animate-fade-in">
      
      {/* Header bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            সকল ডিজিটাল ভাউচারের তালিকা
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            মোট <span className="text-emerald-400 font-bold">{toBengaliNumber(filteredVouchers.length)}টি</span> ভাউচার প্রদর্শিত হচ্ছে
          </p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={handleExportCSV}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center space-x-2 space-x-reverse transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>CSV এক্সপোর্ট করুন</span>
          </button>

          <button
            onClick={onCreateNew}
            className="py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center space-x-2 space-x-reverse transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন ভাউচার যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Search input */}
        <div className="md:col-span-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ভাউচার নম্বর, গ্রহীতার নাম, মেমো বা খাতের নাম লিখে অনুসন্ধান করুন..."
            className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Type Filter */}
        <div className="md:col-span-4">
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
            className="w-full px-3.5 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-slate-100 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">সকল ভাউচার (সব ধরনের)</option>
            <option value="DEBIT">শুধুমাত্র খরচ (ডেবিট ভাউচার)</option>
            <option value="CREDIT">শুধুমাত্র জমা (ক্রেডিট ভাউচার)</option>
            <option value="JOURNAL">জার্নাল সমন্বয় ভাউচার</option>
          </select>
        </div>

      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 text-right">ভাউচার নং</th>
                <th className="py-3.5 px-4 text-right">তারিখ</th>
                <th className="py-3.5 px-4 text-right">টাইপ</th>
                <th className="py-3.5 px-4 text-right">গ্রহীতা / প্রদানকারী</th>
                <th className="py-3.5 px-4 text-right">হিসাব খাত</th>
                <th className="py-3.5 px-4 text-right">পরিমাণ (টাকা)</th>
                <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    কোনো ভাউচার পাওয়া যায়নি!
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                      {v.voucher_no}
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-medium whitespace-nowrap">
                      {formatBengaliDate(v.date)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        v.voucher_type === 'DEBIT'
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {v.voucher_type === 'DEBIT' ? 'ডেবিট (খরচ)' : 'ক্রেডিট (জমা)'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-white max-w-xs truncate">
                      {v.payee_name}
                      {v.reference_no && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {v.reference_no}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-medium">
                      {v.account_head}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-white text-sm whitespace-nowrap font-kalpurush">
                      {formatTaka(v.amount_number)}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                        <button
                          onClick={() => onViewVoucher(v)}
                          className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                          title="প্রিন্ট ও ভিউ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditVoucher(v)}
                          className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 rounded-lg border border-indigo-500/30 transition-all cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setVoucherToDelete(v)}
                          className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 rounded-lg border border-rose-500/30 transition-all cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Row */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-400">
            ফিল্টার করা মোট খরচ (ডেবিট): <strong className="text-rose-400">{formatTaka(filteredDebitTotal)}</strong> | 
            ফিল্টার করা মোট জমা (ক্রেডিট): <strong className="text-emerald-400">{formatTaka(filteredCreditTotal)}</strong>
          </div>
          <div className="text-slate-500 text-[11px]">
            © চরভৈরবী উচ্চ বিদ্যালয় ডিজিটাল রেকর্ড ব্যাংক
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {voucherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                ভাউচার মুছে ফেলার নিশ্চিতকরণ
              </h3>
              <p className="text-xs text-slate-300 mt-2">
                আপনি কি নিশ্চিত যে ভাউচার নম্বর <strong className="text-emerald-400 font-mono">{voucherToDelete.voucher_no}</strong> (<span className="text-white font-bold">{voucherToDelete.payee_name}</span>) স্থায়ীভাবে মুছে ফেলতে চান?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setVoucherToDelete(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteVoucher(voucherToDelete.id);
                  setVoucherToDelete(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/40 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>হ্যাঁ, মুছে ফেলুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
