import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Printer,
  CheckCircle2, 
  FileText, 
  User as UserIcon, 
  Calendar, 
  DollarSign, 
  Sparkles,
  Calculator,
  ArrowLeft
} from 'lucide-react';
import { ACCOUNT_HEADS } from '../lib/initialData';
import { takaToBengaliWords, toBengaliNumber } from '../lib/bengaliUtils';
import { User, Voucher, VoucherItem, VoucherType } from '../types';

interface VoucherFormProps {
  currentUser: User;
  onSaveVoucher: (voucher: Omit<Voucher, 'id' | 'created_at' | 'updated_at'>, existingId?: string) => Promise<Voucher>;
  onPreviewVoucher: (voucher: Voucher) => void;
  onCancel: () => void;
  initialType?: VoucherType;
  editingVoucher?: Voucher | null;
}

export const VoucherForm: React.FC<VoucherFormProps> = ({
  currentUser,
  onSaveVoucher,
  onPreviewVoucher,
  onCancel,
  initialType = 'DEBIT',
  editingVoucher = null,
}) => {
  const [currentVoucherId, setCurrentVoucherId] = useState<string | null>(editingVoucher?.id || null);
  const [voucherType, setVoucherType] = useState<VoucherType>(editingVoucher?.voucher_type || initialType);
  const [voucherNo, setVoucherNo] = useState(
    editingVoucher?.voucher_no || `CBHS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [date, setDate] = useState(editingVoucher?.date || new Date().toISOString().split('T')[0]);
  const [payeeName, setPayeeName] = useState(editingVoucher?.payee_name || '');
  const [accountHead, setAccountHead] = useState(editingVoucher?.account_head || ACCOUNT_HEADS[0]);
  const [paymentMethod, setPaymentMethod] = useState<Voucher['payment_method']>(editingVoucher?.payment_method || 'CASH');
  const [referenceNo, setReferenceNo] = useState(editingVoucher?.reference_no || '');
  const [notes, setNotes] = useState(editingVoucher?.notes || '');

  // Signatures
  const [preparedBy, setPreparedBy] = useState(editingVoucher?.prepared_by || '');
  const [checkedBy, setCheckedBy] = useState(editingVoucher?.checked_by || '');
  const [approvedBy, setApprovedBy] = useState(editingVoucher?.approved_by || '');

  // Particulars Items List
  const [items, setItems] = useState<VoucherItem[]>(
    editingVoucher?.particulars && editingVoucher.particulars.length > 0
      ? editingVoucher.particulars
      : [
          { id: '1', description: 'অফিস স্টেশনারি ও খাতা ক্রয়', amount: 5000, remarks: '' },
        ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Compute Total Amount
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const [amountWords, setAmountWords] = useState(editingVoucher?.amount_words || takaToBengaliWords(totalAmount));

  // Update Bengali Amount Words automatically when total amount changes
  useEffect(() => {
    setAmountWords(takaToBengaliWords(totalAmount));
  }, [totalAmount]);

  // Items Operations
  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', amount: 0, remarks: '' }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof VoucherItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: field === 'amount' ? Number(value) || 0 : value };
      }
      return item;
    }));
  };

  // 1. Dedicated Save Function (Only saves to database, avoids duplicates on repeated clicks)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payeeName.trim()) {
      alert('অনুগ্রহ করে গ্রহীতা বা প্রদানকারীর নাম উল্লেখ করুন।');
      return;
    }
    if (totalAmount <= 0) {
      alert('ভাউচারের মোট পরিমাণ ০ টাকার বেশি হতে হবে।');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const voucherData: Omit<Voucher, 'id' | 'created_at' | 'updated_at'> = {
        voucher_no: voucherNo,
        date: date,
        voucher_type: voucherType,
        payee_name: payeeName,
        account_head: accountHead,
        amount_number: totalAmount,
        amount_words: amountWords,
        payment_method: paymentMethod,
        reference_no: referenceNo,
        particulars: items,
        status: 'APPROVED',
        created_by: currentUser.full_name,
        prepared_by: preparedBy,
        checked_by: checkedBy,
        approved_by: approvedBy,
        notes: notes,
      };

      const saved = await onSaveVoucher(voucherData, currentVoucherId || undefined);
      setCurrentVoucherId(saved.id);
      setSuccessMessage(currentVoucherId ? 'ভাউচার সফলভাবে আপডেট করা হয়েছে!' : 'ভাউচার সফলভাবে ডাটাবেজে সংরক্ষণ করা হয়েছে!');
    } catch (err: any) {
      alert('ভাউচার সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Dedicated Print Preview Function (Does NOT create a duplicate database entry!)
  const handlePreviewOnly = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!payeeName.trim()) {
      alert('অনুগ্রহ করে গ্রহীতা বা প্রদানকারীর নাম উল্লেখ করুন।');
      return;
    }
    if (totalAmount <= 0) {
      alert('ভাউচারের মোট পরিমাণ ০ টাকার বেশি হতে হবে।');
      return;
    }

    const tempVoucher: Voucher = {
      id: currentVoucherId || `temp-preview-${Date.now()}`,
      voucher_no: voucherNo,
      date: date,
      voucher_type: voucherType,
      payee_name: payeeName,
      account_head: accountHead,
      amount_number: totalAmount,
      amount_words: amountWords,
      payment_method: paymentMethod,
      reference_no: referenceNo,
      particulars: items,
      status: 'APPROVED',
      created_by: currentUser.full_name,
      prepared_by: preparedBy,
      checked_by: checkedBy,
      approved_by: approvedBy,
      notes: notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onPreviewVoucher(tempVoucher);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-kalpurush animate-fade-in">
      
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ড্যাশবোর্ডে ফিরুন</span>
        </button>

        <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading text-center">
          {editingVoucher ? 'ভাউচার সংশোধন করুন' : 'নতুন ডিজিটাল ভাউচার তৈরি করুন'}
        </h2>

        <div className="w-24 text-left">
          <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full font-bold">
            ফর্ম ৩.০
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl flex items-center space-x-2 space-x-reverse text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Basic Voucher Details */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="w-4 h-4" />
            ১. সাধারণ ও মূল তথ্য
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Voucher Type */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                ভাউচারের ধরণ *
              </label>
              <select
                value={voucherType}
                onChange={(e) => setVoucherType(e.target.value as VoucherType)}
                className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 font-bold"
              >
                <option value="DEBIT">খরচ (ডেবিট / পেমেন্ট ভাউচার)</option>
                <option value="CREDIT">জমা (ক্রেডিট / রসিদ ভাউচার)</option>
                <option value="JOURNAL">জার্নাল / সমন্বয় ভাউচার</option>
              </select>
            </div>

            {/* Voucher No */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                ভাউচার নম্বর (Serial No) *
              </label>
              <input
                type="text"
                required
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 rounded-xl text-emerald-300 font-mono text-sm font-bold"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                তারিখ (Date) *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-bold"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            {/* Payee / Receiver Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                গ্রহীতা / প্রদানকারীর নাম (Payee / Payer Name) *
              </label>
              <input
                type="text"
                required
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="যেমন: আব্দুর রহমান (স্টেশনারি মার্চেন্ট)"
                className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-semibold placeholder-slate-500"
              />
            </div>

            {/* Account Head */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                হিসাব খাত (Account Head) *
              </label>
              <select
                value={accountHead}
                onChange={(e) => setAccountHead(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-semibold"
              >
                {ACCOUNT_HEADS.map((head, idx) => (
                  <option key={idx} value={head}>
                    {head}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                পরিশোধের মাধ্যম (Payment Mode)
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-semibold"
              >
                <option value="CASH">নগদ টাকা (Cash)</option>
                <option value="BANK_CHEQUE">ব্যাংক চেক (Bank Cheque)</option>
                <option value="BKASH">বিকাশ (bKash)</option>
                <option value="NAGAD">নগদ (Nagad App)</option>
                <option value="ONLINE_TRANSFER">অনলাইন ব্যাংক ট্রান্সফার</option>
              </select>
            </div>

            {/* Reference No / Cheque No */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                মেমো / চেক নং / রেফারেন্স আইডি
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="যেমন: চেক নং- সিবি-৯৪৫১০২ বা ক্যাশ মেমো- ৪৫২"
                className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-medium placeholder-slate-500"
              />
            </div>

          </div>
        </div>

        {/* Section 2: Items & Breakdown Particulars Table */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              ২. বিবরণ ও অংকের হিসাব (Itemized Breakdown)
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>আইটেম যোগ করুন</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-slate-900/80 rounded-2xl border border-slate-800 items-center">
                <div className="sm:col-span-1 text-center font-bold text-slate-400 text-xs">
                  #{toBengaliNumber(index + 1)}
                </div>
                
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    required
                    placeholder="বিবরণ (যেমন: কম্পিউটার ল্যাব ফ্যান ও ক্যাবল)"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs font-semibold placeholder-slate-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-emerald-400 text-xs font-bold">
                      ৳
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={item.amount || ''}
                      onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                      placeholder="টাকা"
                      className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-emerald-300 font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center justify-end space-x-2 space-x-reverse">
                  <input
                    type="text"
                    placeholder="মন্তব্য"
                    value={item.remarks || ''}
                    onChange={(e) => handleItemChange(item.id, 'remarks', e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-[11px]"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer"
                      title="আইটেম মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Automatic Total & Bengali Words Box */}
          <div className="mt-6 p-4 bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-0.5">
                কথায় মোট টাকার পরিমাণ (Auto Bengali Words):
              </span>
              <p className="text-sm font-extrabold text-emerald-300">
                {amountWords}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-xs text-slate-400 font-bold block">সর্বমোট পরিমাণ:</span>
              <div className="text-2xl font-black text-emerald-400 font-kalpurush inline-flex items-center justify-end gap-1">
                <span className="leading-none">৳</span>
                <span>{totalAmount.toLocaleString('bn-BD')} /-</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Signatures & Notes */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserIcon className="w-4 h-4" />
            ৩. দায়িত্বপ্রাপ্ত কর্মকর্তাদের স্বাক্ষর নাম
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                প্রস্তুতকারীর নাম (Prepared By)
              </label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="প্রস্তুতকারীর নাম..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                যাচাইকারীর নাম (Checked By)
              </label>
              <input
                type="text"
                value={checkedBy}
                onChange={(e) => setCheckedBy(e.target.value)}
                placeholder="যাচাইকারীর নাম..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                অনুমোদনকারী (Approved By - Headmaster)
              </label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                placeholder="অনুমোদনকারীর নাম..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              অতিরিক্ত মন্তব্য বা ফাইল রেফারেন্স (Notes)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="বিদ্যালয় ব্যবস্থাপনা কমিটির মিটিং রেজুলেশন অথবা অতিরিক্ত প্রাসঙ্গিক তথ্য..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition-all cursor-pointer"
          >
            বাতিল করুন
          </button>

          <button
            type="button"
            onClick={handlePreviewOnly}
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট প্রিভিউ দেখুন</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-900/40 flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{currentVoucherId ? 'ডাটাবেজে আপডেট করুন' : 'ডাটাবেজে সেভ করুন'}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
