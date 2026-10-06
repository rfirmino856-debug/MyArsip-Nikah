window.APP_CONFIG = window.APP_CONFIG || {};

window.APP_CONFIG.supabase = {
  url: 'https://izilvzivmthnltrqmkoi.supabase.co',
  publishableKey: 'sb_publishable_ELyOU0KnvtM7wkKuAFADBA_DsWvNEYI'
};

window.APP_CONFIG.auth = {
  email: 'email-anda@domain.com',
  password: 'password-anda'
};

window.APP_CONFIG.app = {
  name: 'MyArsip Nikah',
  desa: 'Desa Pelang Kidul',
  version: 'FIX23',
  storage: 'supabase',
  storageNote: 'Mode aktif: Supabase untuk database online.'
};

window.APP_CONFIG.supabase = window.APP_CONFIG.supabase || {};
window.APP_CONFIG.supabase.table = 'arsip_nikah';
