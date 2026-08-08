export type VoucherType = 'DEBIT' | 'CREDIT' | 'JOURNAL';
export type VoucherStatus = 'APPROVED' | 'PENDING' | 'CANCELLED';

export interface VoucherItem {
  id: string;
  description: string;
  amount: number;
  remarks?: string;
}

export interface Voucher {
  id: string;
  voucher_no: string;
  date: string;
  voucher_type: VoucherType;
  payee_name: string;
  account_head: string;
  amount_number: number;
  amount_words: string;
  payment_method: 'CASH' | 'BANK_CHEQUE' | 'BKASH' | 'NAGAD' | 'ONLINE_TRANSFER';
  reference_no?: string;
  particulars: VoucherItem[];
  status: VoucherStatus;
  created_by: string;
  prepared_by: string;
  checked_by: string;
  approved_by: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolBranding {
  school_name: string;
  school_name_en: string;
  sub_header: string;
  address: string;
  phone: string;
  email: string;
  eiin_no: string;
  established_year: string;
  logo_url: string;
  logo_scale: number; // 0.5 to 2.0
  logo_position: 'left' | 'center' | 'right';
  primary_color: string;
  watermark_enabled: boolean;
  seal_title: string;
}

export interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'HEADMASTER' | 'VIEWER';
  avatar_url?: string;
  password?: string;
  signature_url?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
