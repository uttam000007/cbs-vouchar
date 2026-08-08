import React from 'react';
import { Printer, Download, X, School, CheckCircle, Sparkles, Copy } from 'lucide-react';
import { SchoolBranding, Voucher } from '../types';
import { formatBengaliDate, formatTaka, toBengaliNumber } from '../lib/bengaliUtils';
import { getStoredSystemUsers } from '../lib/supabase';

interface VoucherPreviewModalProps {
  voucher: Voucher;
  branding: SchoolBranding;
  onClose: () => void;
}

export const VoucherPreviewModal: React.FC<VoucherPreviewModalProps> = ({
  voucher,
  branding,
  onClose,
}) => {
  const handlePrint = () => {
    const printElement = document.getElementById('printable-voucher-document');
    if (printElement) {
      const printWindow = window.open('', '_blank', 'width=900,height=900');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="bn">
          <head>
            <meta charset="UTF-8">
            <title>Voucher_${voucher.voucher_no}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @font-face {
                font-family: 'Kalpurush';
                src: url('https://cdn.jsdelivr.net/gh/muralitharan/fonts/kalpurush/kalpurush.ttf') format('truetype');
              }
              body {
                font-family: 'Kalpurush', 'Hind Siliguri', sans-serif;
                background-color: #ffffff;
                color: #000000;
                padding: 20px;
                margin: 0;
              }
              @media print {
                @page { size: A4; margin: 10mm; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="printable-voucher bg-white text-slate-900 rounded-2xl p-6 sm:p-8 w-full max-w-[800px] mx-auto border border-slate-300">
              ${printElement.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 400);
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }
    }
    // Fallback if popup blocker is active
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-kalpurush">
      
      {/* Container Box */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-scale-in">
        
        {/* Top Control Header - Hidden when printing */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                ভাউচার প্রিন্ট ও ফাইনাল প্রিভিউ
              </h3>
              <p className="text-xs text-slate-400">
                ভাউচার নং: <span className="font-mono text-emerald-400">{voucher.voucher_no}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={handlePrint}
              className="py-2 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/30 flex items-center space-x-2 space-x-reverse transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন / PDF সেভ</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Voucher Paper Content */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-800/40 flex justify-center">
          
          {/* Printable Sheet (Standard White Paper Voucher Pad styling) */}
          <div id="printable-voucher-document" className="printable-voucher bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 w-full max-w-[800px] min-h-[600px] relative border border-slate-200">
            
            {/* Watermark Background Logo if enabled */}
            {branding.watermark_enabled && branding.logo_url && (
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
                <img
                  src={branding.logo_url}
                  alt="Watermark"
                  className="w-96 h-96 object-contain grayscale"
                />
              </div>
            )}

            {/* School Header Section */}
            <div className="text-center pb-4 border-b-2 border-slate-900 relative">
              <div className="flex items-center justify-between">
                
                {/* Left EIIN */}
                <div className="text-left text-[11px] font-bold text-slate-700">
                  <p>EIIN: {branding.eiin_no}</p>
                  <p>স্থাপিত: {branding.established_year} খ্রিঃ</p>
                </div>

                {/* Center School Name & Logo */}
                <div className="flex flex-col items-center">
                  {branding.logo_url && (
                    <img
                      src={branding.logo_url}
                      alt={branding.school_name}
                      style={{ transform: `scale(${branding.logo_scale})` }}
                      className="h-16 w-16 object-contain mb-3 sm:mb-4 transition-transform"
                    />
                  )}
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-wide mt-1">
                    {branding.school_name}
                  </h1>
                  <p className="text-xs font-bold text-slate-700 font-mono tracking-wider">
                    {branding.school_name_en}
                  </p>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {branding.address} | মোবাইল: {branding.phone}
                  </p>
                </div>

                {/* Right Form Code */}
                <div className="text-right text-[11px] font-bold text-slate-700">
                  <p className="px-2 py-0.5 border border-slate-400 rounded">হিসাব ফরম-১</p>
                  <p className="mt-1 text-[10px] text-slate-500">মূল কপি</p>
                </div>

              </div>

              {/* Voucher Title Badge */}
              <div className="mt-4 inline-block px-8 py-1.5 bg-slate-900 text-white font-black text-sm rounded-full tracking-widest shadow-md">
                {voucher.voucher_type === 'DEBIT' 
                  ? 'খরচ ভাউচার / ডেবিট মেমো (DEBIT VOUCHER)' 
                  : voucher.voucher_type === 'CREDIT' 
                  ? 'জমা ভাউচার / ক্রেডিট মেমো (CREDIT VOUCHER)' 
                  : 'জার্নাল সমন্বয় ভাউচার'}
              </div>
            </div>

            {/* Meta Row: Voucher No, Date, Payment Mode */}
            <div className="grid grid-cols-2 gap-4 my-5 text-xs font-bold text-slate-800">
              <div className="space-y-1.5">
                <p>
                  <span className="text-slate-500">ভাউচার নম্বর:</span>{' '}
                  <span className="font-mono text-sm font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-300 rounded">
                    {voucher.voucher_no}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">গ্রহীতা / প্রদানকারী:</span>{' '}
                  <span className="text-slate-900 font-extrabold text-sm">{voucher.payee_name}</span>
                </p>
              </div>

              <div className="text-right space-y-1.5">
                <p>
                  <span className="text-slate-500">তারিখ:</span>{' '}
                  <span className="text-slate-900 font-extrabold">{formatBengaliDate(voucher.date)}</span>
                </p>
                <p>
                  <span className="text-slate-500">পরিশোধ মাধ্যম:</span>{' '}
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-800">
                    {voucher.payment_method === 'CASH' 
                      ? 'নগদ (Cash)' 
                      : voucher.payment_method === 'BANK_CHEQUE' 
                      ? 'ব্যাংক চেক' 
                      : voucher.payment_method === 'BKASH' 
                      ? 'বিকাশ' 
                      : 'অনলাইন ট্রান্সফার'}
                  </span>
                </p>
                {voucher.reference_no && (
                  <p className="text-[11px] text-slate-600">
                    রেফারেন্স / মেমো: {voucher.reference_no}
                  </p>
                )}
              </div>
            </div>

            {/* Account Head Line */}
            <div className="mb-4 p-2.5 bg-slate-100 rounded-lg border border-slate-300 text-xs flex items-center justify-between font-bold">
              <span>হিসাব খাতের নাম: <strong className="text-emerald-900 text-sm">{voucher.account_head}</strong></span>
              <span className="text-slate-500">বিদ্যালয় জেনারেল ফান্ড</span>
            </div>

            {/* Items Table */}
            <div className="my-5">
              <table className="w-full border-collapse border border-slate-800 text-xs">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-800">
                    <th className="border border-slate-800 p-2 text-center w-12">ক্র. নং</th>
                    <th className="border border-slate-800 p-2 text-right">খরচ / জমার খাত ও বিবরণী</th>
                    <th className="border border-slate-800 p-2 text-right w-28">পরিমাণ (টাকা)</th>
                    <th className="border border-slate-800 p-2 text-right w-24">মন্তব্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-900">
                  {voucher.particulars.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="border border-slate-800 p-2 text-center font-bold">
                        {toBengaliNumber(idx + 1)}
                      </td>
                      <td className="border border-slate-800 p-2 font-medium">
                        {item.description}
                      </td>
                      <td className="border border-slate-800 p-2 text-right font-extrabold font-kalpurush text-sm">
                        {item.amount.toLocaleString('bn-BD', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border border-slate-800 p-2 text-right text-[11px] text-slate-600">
                        {item.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Empty Spacer Rows to fill standard receipt height */}
                  {voucher.particulars.length < 3 && Array.from({ length: 3 - voucher.particulars.length }).map((_, i) => (
                    <tr key={`spacer-${i}`}>
                      <td className="border border-slate-800 p-2.5 text-center">&nbsp;</td>
                      <td className="border border-slate-800 p-2.5">&nbsp;</td>
                      <td className="border border-slate-800 p-2.5 text-right">&nbsp;</td>
                      <td className="border border-slate-800 p-2.5">&nbsp;</td>
                    </tr>
                  ))}

                  {/* Subtotal Row */}
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                    <td colSpan={2} className="border border-slate-800 p-2.5 text-right text-sm">
                      সর্বমোট টাকার পরিমাণ (Total Amount):
                    </td>
                    <td className="border border-slate-800 p-2.5 text-right text-base text-emerald-900 font-bold font-kalpurush">
                      <span className="inline-flex items-center justify-end gap-1">
                        <span className="text-emerald-900 font-extrabold leading-none">৳</span>
                        <span>{voucher.amount_number.toLocaleString('bn-BD', { minimumFractionDigits: 2 })}</span>
                      </span>
                    </td>
                    <td className="border border-slate-800 p-2.5">&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount in Words Box */}
            <div className="my-5 p-3 border-2 border-dashed border-slate-800 rounded-xl bg-slate-50 text-xs">
              <span className="font-bold text-slate-600 block mb-0.5">কথায় (In Words):</span>
              <p className="font-black text-slate-900 text-sm underline decoration-emerald-600 decoration-2">
                {voucher.amount_words}
              </p>
            </div>

            {notesOrRef(voucher)}

            {/* Official Signatures Row */}
            {(() => {
              const systemUsers = getStoredSystemUsers();
              const findSignature = (nameOrRole: string, fallbackRole?: string) => {
                const matched = systemUsers.find(u => 
                  (u.full_name && u.full_name.trim() === nameOrRole.trim()) ||
                  (fallbackRole && u.role === fallbackRole && u.signature_url) ||
                  (u.full_name && nameOrRole.toLowerCase().includes(u.full_name.split(' ')[0].toLowerCase()))
                );
                return matched?.signature_url;
              };

              const preparedSig = findSignature(voucher.prepared_by, 'ACCOUNTANT');
              const checkedSig = findSignature(voucher.checked_by, 'HEADMASTER');
              const approvedSig = findSignature(voucher.approved_by, 'ADMIN');

              return (
                <div className="mt-12 pt-4 border-t border-slate-300 grid grid-cols-4 gap-2 text-center text-[11px] font-bold text-slate-800">
                  
                  <div className="space-y-1">
                    <div className="h-10 flex items-end justify-center">
                      {preparedSig && (
                        <img src={preparedSig} alt="স্বাক্ষর" className="max-h-10 object-contain mx-auto" />
                      )}
                    </div>
                    <div className="border-t border-slate-800 pt-1">
                      প্রস্তুতকারীর স্বাক্ষর
                      {voucher.prepared_by && (
                        <div className="text-[10px] font-normal text-slate-600 mt-0.5">{voucher.prepared_by}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-10 flex items-end justify-center">
                      {checkedSig && (
                        <img src={checkedSig} alt="স্বাক্ষর" className="max-h-10 object-contain mx-auto" />
                      )}
                    </div>
                    <div className="border-t border-slate-800 pt-1">
                      হিসাবরক্ষকের স্বাক্ষর
                      {voucher.checked_by && (
                        <div className="text-[10px] font-normal text-slate-600 mt-0.5">{voucher.checked_by}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-10 flex items-end justify-center">
                      {/* Empty box for manual recipient/cashier signature */}
                    </div>
                    <div className="border-t border-slate-800 pt-1">
                      গ্রহীতা / ক্যাশিয়ার
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-10 flex items-end justify-center">
                      {approvedSig && (
                        <img src={approvedSig} alt="স্বাক্ষর" className="max-h-10 object-contain mx-auto" />
                      )}
                    </div>
                    <div className="border-t-2 border-slate-900 pt-1 font-extrabold text-slate-900">
                      প্রধান শিক্ষকের অনুমোদন ও সিল
                      {voucher.approved_by && (
                        <div className="text-[10px] font-normal text-slate-600 mt-0.5 font-sans">{voucher.approved_by}</div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* Footer Notice */}
            <div className="mt-8 text-center text-[10px] text-slate-500 border-t border-slate-200 pt-2 flex justify-center items-center">
              <span>চরভৈরবী উচ্চ বিদ্যালয় হিসাব শাখা কর্তৃক কম্পিউটার জেনারেটেড ডিজিটাল ভাউচার</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

function notesOrRef(voucher: Voucher) {
  if (!voucher.notes) return null;
  return (
    <div className="my-2 text-[11px] text-slate-600 italic">
      <span className="font-bold">নোট/রেফারেন্স:</span> {voucher.notes}
    </div>
  );
}
