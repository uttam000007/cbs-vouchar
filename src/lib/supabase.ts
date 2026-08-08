import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_BRANDING, MOCK_VOUCHERS } from './initialData';
import { SchoolBranding, SupabaseConfig, User, Voucher } from '../types';

const STORAGE_KEY_VOUCHERS = 'cbhs_vouchers_db_v2';
const STORAGE_KEY_BRANDING = 'cbhs_school_branding_v2';
const STORAGE_KEY_CONFIG = 'cbhs_supabase_config_v2';
const STORAGE_KEY_USER = 'cbhs_logged_in_user_v2';

const DEFAULT_SUPABASE_URL = 'https://jnaaflxdjkkmxjlbicmm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_D5D7ky5jkQD41qTK44gSlA_l_AnweS8';

// Retrieve saved config or default
export function getSavedSupabaseConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return { ...parsed, isConnected: true };
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved Supabase config:', e);
  }
  const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  return {
    url,
    anonKey,
    isConnected: true
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  try {
    const config: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      isConnected: Boolean(url.trim() && anonKey.trim())
    };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    supabaseInstance = null; // reset instance
    return true;
  } catch (e) {
    console.error('Error saving Supabase config:', e);
    return false;
  }
}

// Cross-tab real-time sync channel for local fallback
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('cbhs_voucher_realtime_sync');
  } catch (e) {
    console.warn('BroadcastChannel not supported or error:', e);
  }
}

// VOUCHER SERVICE FUNCTIONS
export function getStoredVouchers(): Voucher[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_VOUCHERS);
    if (data) {
      const parsed: Voucher[] = JSON.parse(data);
      let updated = false;
      const sanitized = parsed.map(v => {
        if (v.checked_by && v.checked_by.includes('শাহ আলম')) {
          updated = true;
          return { ...v, checked_by: v.checked_by.replace(/শাহ আলম/g, 'শংকর চন্দ্র') };
        }
        return v;
      });
      if (updated) {
        saveStoredVouchers(sanitized);
      }
      return sanitized;
    }
  } catch (e) {
    console.error('Error reading local vouchers:', e);
  }
  // Initialize with mock vouchers
  safeLocalStorageSet(STORAGE_KEY_VOUCHERS, JSON.stringify(MOCK_VOUCHERS));
  return MOCK_VOUCHERS;
}

// SAFE LOCAL STORAGE WRAPPER TO PREVENT QUOTA EXCEEDED ERRORS
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    console.warn(`localStorage quota exceeded for key "${key}", performing cleanup:`, e);
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k !== key && (!k.startsWith('cbhs_') || k.includes('temp') || k.includes('cache'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      console.error('Retry localStorage setItem failed:', retryErr);
      return false;
    }
  }
}

export function saveStoredVouchers(vouchers: Voucher[]) {
  try {
    safeLocalStorageSet(STORAGE_KEY_VOUCHERS, JSON.stringify(vouchers));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'VOUCHERS_UPDATED', timestamp: Date.now() });
    }
  } catch (e) {
    console.error('Error saving local vouchers:', e);
  }
}

export async function fetchAllVouchers(): Promise<Voucher[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        saveStoredVouchers(data as Voucher[]);
        return data as Voucher[];
      } else if (error) {
        console.error('Supabase fetchAllVouchers error:', error.message, error.details);
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back:', err);
    }
  }

  try {
    const response = await fetch('/api/db/vouchers');
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (Array.isArray(data)) {
          saveStoredVouchers(data);
          return data;
        }
      }
    }
  } catch (err) {
    console.warn('Server fetch error, falling back to local storage:', err);
  }

  return getStoredVouchers();
}

export async function createVoucher(voucher: Omit<Voucher, 'id' | 'created_at' | 'updated_at'>): Promise<Voucher> {
  const now = new Date().toISOString();
  const newVoucher: Voucher = {
    ...voucher,
    id: `vouch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: now,
    updated_at: now
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('vouchers').upsert([newVoucher], { onConflict: 'id' });
      if (error) {
        console.error('Supabase createVoucher error:', error.message, error.details);
      }
    } catch (err) {
      console.warn('Supabase createVoucher exception:', err);
    }
  }

  try {
    const res = await fetch('/api/db/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVoucher)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.vouchers) {
        saveStoredVouchers(data.vouchers);
      }
    }
  } catch (err) {
    console.warn('Server createVoucher error:', err);
  }

  const current = getStoredVouchers();
  if (!current.some(v => v.id === newVoucher.id)) {
    saveStoredVouchers([newVoucher, ...current]);
  }
  return newVoucher;
}

export async function updateVoucher(voucher: Voucher): Promise<Voucher> {
  const updatedVoucher = {
    ...voucher,
    updated_at: new Date().toISOString()
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('vouchers').upsert([updatedVoucher], { onConflict: 'id' });
      if (error) {
        console.error('Supabase updateVoucher error:', error.message, error.details);
      }
    } catch (err) {
      console.warn('Supabase updateVoucher exception:', err);
    }
  }

  try {
    const res = await fetch('/api/db/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedVoucher)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.vouchers) {
        saveStoredVouchers(data.vouchers);
      }
    }
  } catch (err) {
    console.warn('Server updateVoucher error:', err);
  }

  const current = getStoredVouchers();
  const newArr = current.map(v => v.id === voucher.id ? updatedVoucher : v);
  saveStoredVouchers(newArr);
  return updatedVoucher;
}

export async function deleteVoucher(id: string): Promise<boolean> {
  // Update local storage first so UI is snappy
  const current = getStoredVouchers();
  const updated = current.filter(v => v.id !== id);
  saveStoredVouchers(updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('vouchers').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteVoucher error:', error.message, error.details);
      }
    } catch (err) {
      console.warn('Supabase deleteVoucher exception:', err);
    }
  }

  try {
    const res = await fetch(`/api/db/vouchers/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.vouchers) {
        saveStoredVouchers(data.vouchers);
      }
    }
  } catch (err) {
    console.warn('Server deleteVoucher error:', err);
  }

  return true;
}

// Real-time listener setup & periodic server sync
export function subscribeToVouchersChange(callback: (vouchers: Voucher[]) => void): () => void {
  const client = getSupabaseClient();
  
  // Real-time Supabase subscription if connected
  let supabaseSub: any = null;
  if (client) {
    try {
      supabaseSub = client
        .channel('realtime_vouchers')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vouchers' },
          async () => {
            const updated = await fetchAllVouchers();
            callback(updated);
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Supabase channel subscription failed:', e);
    }
  }

  // Periodic server polling every 4 seconds to sync across different browsers
  const pollInterval = setInterval(async () => {
    const fresh = await fetchAllVouchers();
    callback(fresh);
  }, 4000);

  // Cross-tab broadcast channel listener
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'VOUCHERS_UPDATED') {
      callback(getStoredVouchers());
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleBroadcast);
  }

  return () => {
    clearInterval(pollInterval);
    if (supabaseSub && client) {
      client.removeChannel(supabaseSub);
    }
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleBroadcast);
    }
  };
}

// SCHOOL BRANDING MANAGEMENT
export function getStoredBranding(): SchoolBranding {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BRANDING);
    if (saved) {
      return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading branding from storage:', e);
  }
  return DEFAULT_BRANDING;
}

export async function fetchBranding(): Promise<SchoolBranding> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('school_branding')
        .select('*')
        .eq('id', 'primary')
        .maybeSingle();

      if (!error && data && data.school_name) {
        const merged = { ...DEFAULT_BRANDING, ...data };
        safeLocalStorageSet(STORAGE_KEY_BRANDING, JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('Supabase fetchBranding error:', err);
    }
  }

  try {
    const res = await fetch('/api/db/branding');
    if (res.ok) {
      const data = await res.json();
      if (data && data.school_name) {
        safeLocalStorageSet(STORAGE_KEY_BRANDING, JSON.stringify(data));
        return { ...DEFAULT_BRANDING, ...data };
      }
    }
  } catch (err) {
    console.warn('Server fetchBranding error:', err);
  }
  return getStoredBranding();
}

export async function saveStoredBranding(branding: SchoolBranding) {
  safeLocalStorageSet(STORAGE_KEY_BRANDING, JSON.stringify(branding));

  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from('school_branding')
        .upsert([{ id: 'primary', ...branding, updated_at: new Date().toISOString() }], { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase saveStoredBranding error:', err);
    }
  }

  try {
    await fetch('/api/db/branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branding)
    });
  } catch (err) {
    console.warn('Server saveStoredBranding error:', err);
  }
}

// AUTHENTICATION & USERS MANAGEMENT
const STORAGE_KEY_SYSTEM_USERS = 'cbhs_system_users_v2';

export const DEFAULT_SYSTEM_USERS: User[] = [
  {
    id: 'u-admin-1',
    user_id: 'ADMIN-01',
    email: 'admin@charbhairabi.edu.bd',
    full_name: 'শংকর চন্দ্র (সুপার অ্যাডমিন)',
    role: 'ADMIN',
    password: '123456',
    signature_url: ''
  },
  {
    id: 'u-acc-2',
    user_id: 'ACC-02',
    email: 'uttamkumarb247@gmail.com',
    full_name: 'দীলিপ স্যার (হিসাবরক্ষক)',
    role: 'ACCOUNTANT',
    password: '123456',
    signature_url: ''
  },
  {
    id: 'u-hm-3',
    user_id: 'HM-03',
    email: 'headmaster@charbhairabi.edu.bd',
    full_name: 'মোঃ মজিবুর রহমান (প্রধান শিক্ষক)',
    role: 'HEADMASTER',
    password: '123456',
    signature_url: ''
  }
];

export function getStoredSystemUsers(): User[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SYSTEM_USERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading saved system users:', e);
  }
  safeLocalStorageSet(STORAGE_KEY_SYSTEM_USERS, JSON.stringify(DEFAULT_SYSTEM_USERS));
  return DEFAULT_SYSTEM_USERS;
}

export function saveStoredSystemUsers(users: User[]) {
  try {
    safeLocalStorageSet(STORAGE_KEY_SYSTEM_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving system users:', e);
  }
}

export async function fetchSystemUsers(): Promise<User[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('system_users')
        .select('*');

      if (!error && data) {
        if (data.length > 0) {
          saveStoredSystemUsers(data);
          return data;
        } else {
          // Table exists but is empty, seed initial default users to Supabase
          try {
            await client.from('system_users').upsert(DEFAULT_SYSTEM_USERS, { onConflict: 'id' });
          } catch (seedErr) {
            console.warn('Failed to seed default system users into Supabase:', seedErr);
          }
          saveStoredSystemUsers(DEFAULT_SYSTEM_USERS);
          return DEFAULT_SYSTEM_USERS;
        }
      }
    } catch (err) {
      console.warn('Supabase fetchSystemUsers error:', err);
    }
  }

  try {
    const res = await fetch('/api/db/users');
    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          saveStoredSystemUsers(data);
          return data;
        }
      }
    }
  } catch (err) {
    console.warn('Server fetchSystemUsers error:', err);
  }
  return getStoredSystemUsers();
}

export async function saveOrUpdateUser(userToSave: User): Promise<User[]> {
  const currentUsers = getStoredSystemUsers();
  const existingIndex = currentUsers.findIndex(u => u.id === userToSave.id);
  let updatedUsers: User[];
  if (existingIndex >= 0) {
    updatedUsers = currentUsers.map(u => u.id === userToSave.id ? userToSave : u);
  } else {
    updatedUsers = [...currentUsers, userToSave];
  }
  saveStoredSystemUsers(updatedUsers);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from('system_users')
        .upsert([userToSave], { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase saveOrUpdateUser error:', err);
    }
  }

  try {
    const res = await fetch('/api/db/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userToSave)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.users) {
        saveStoredSystemUsers(data.users);
        return data.users;
      }
    }
  } catch (err) {
    console.warn('Server saveOrUpdateUser error:', err);
  }

  return updatedUsers;
}

export async function deleteSystemUser(id: string): Promise<User[]> {
  const currentUsers = getStoredSystemUsers();
  const updatedUsers = currentUsers.filter(u => u.id !== id);
  saveStoredSystemUsers(updatedUsers);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from('system_users')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteSystemUser error:', err);
    }
  }

  try {
    const res = await fetch(`/api/db/users/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.users) {
        saveStoredSystemUsers(data.users);
        return data.users;
      }
    }
  } catch (err) {
    console.warn('Server deleteSystemUser error:', err);
  }

  return updatedUsers;
}

export function getSavedUser(): User | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading saved user:', e);
  }
  return null;
}

export function saveUser(user: User | null) {
  try {
    if (user) {
      safeLocalStorageSet(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  } catch (e) {
    console.error('Error saving user:', e);
  }
}
