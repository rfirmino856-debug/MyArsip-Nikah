const APP_CONFIG = window.APP_CONFIG || {};
const STORAGE_MODE = (APP_CONFIG.app && APP_CONFIG.app.storage) || 'local';
const SUPABASE_URL = (APP_CONFIG.supabase && APP_CONFIG.supabase.url) || 'https://izilvzivmthnltrqmkoi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = (APP_CONFIG.supabase && APP_CONFIG.supabase.publishableKey) || 'sb_publishable_ELyOU0KnvtM7wkKuAFADBA_DsWvNEYI';
const SUPABASE_TABLE = (APP_CONFIG.supabase && APP_CONFIG.supabase.table) || 'arsip_nikah';
const supabaseClient = (window.supabase && window.supabase.createClient && STORAGE_MODE === 'supabase')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

const KEY='si_arsip_nikah_pelang_kidul_v1';
const APP_VERSION=20;
const BUILD_VERSION='FIX20';
const AUTH_KEY='si_arsip_nikah_auth_v1';
const APP_LOGIN={
  email:(APP_CONFIG.auth && APP_CONFIG.auth.email) || 'email-anda@domain.com',
  password:(APP_CONFIG.auth && APP_CONFIG.auth.password) || 'password-anda'
};
let editingIndex=-1;

function getAuthSession(){
  try {
    const raw=localStorage.getItem(AUTH_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function saveAuthSession(email){
  localStorage.setItem(AUTH_KEY, JSON.stringify({ email, loggedIn: true, loginAt: new Date().toISOString() }));
}

function clearAuthSession(){
  localStorage.removeItem(AUTH_KEY);
}

function isValidAuthSession(session){
  if(!session || session.loggedIn !== true) return false;
  const savedEmail = String(session.email || '').trim().toLowerCase();
  const expectedEmail = String(APP_LOGIN.email || '').trim().toLowerCase();
  return savedEmail && savedEmail === expectedEmail;
}

function setAuthLockState(locked){
  const app=document.querySelector('.app');
  if(app){
    app.style.pointerEvents = locked ? 'none' : '';
    app.style.opacity = locked ? '0.35' : '';
  }
}

function requireAuth(){
  const session=getAuthSession();
  if(isValidAuthSession(session)){
    setAuthLockState(false);
    return true;
  }

  clearAuthSession();
  showAuthScreen();
  setAuthLockState(true);
  return false;
}

function showAuthError(message){
  const errorBox=document.getElementById('authError');
  if(errorBox){
    errorBox.textContent=message;
    errorBox.style.display='block';
  }
}

function hideAuthScreen(){
  const authScreen=document.getElementById('authScreen');
  const app=document.querySelector('.app');
  if(authScreen) authScreen.style.display='none';
  if(app) app.style.display='block';
  setAuthLockState(false);
}

function showAuthScreen(){
  const authScreen=document.getElementById('authScreen');
  const app=document.querySelector('.app');
  if(authScreen) authScreen.style.display='flex';
  if(app) app.style.display='none';
  setAuthLockState(true);
  const emailInput=document.getElementById('loginEmail');
  if(emailInput) emailInput.focus();
}

function login(event){
  if(event && typeof event.preventDefault==='function') event.preventDefault();
  const emailInput=document.getElementById('loginEmail');
  const passwordInput=document.getElementById('loginPassword');
  const email=(emailInput?.value||'').trim().toLowerCase();
  const password=passwordInput?.value||'';
  const errorBox=document.getElementById('authError');

  if(!email || !password){
    showAuthError('Email dan password wajib diisi.');
    return;
  }

  if(email !== APP_LOGIN.email.toLowerCase() || password !== APP_LOGIN.password){
    showAuthError('Email atau password salah. Silakan cek kembali data login Anda.');
    return;
  }

  saveAuthSession(email);
  if(errorBox) errorBox.textContent='';
  hideAuthScreen();
  if(typeof toast==='function') toast('Login berhasil. Selamat datang!');
}

function logout(){
  const confirmed=window.confirm('Apakah Anda yakin ingin keluar dari aplikasi?');
  if(!confirmed) return;
  clearAuthSession();
  const passwordInput=document.getElementById('loginPassword');
  if(passwordInput) passwordInput.value='';
  showAuthScreen();
}

function initAuth(){
  const session=getAuthSession();
  if(isValidAuthSession(session)){
    hideAuthScreen();
    return;
  }
  clearAuthSession();
  showAuthScreen();
}

function makeId(){
  if(window.crypto?.randomUUID)return window.crypto.randomUUID();
  return 'rec-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
}
function normalizeRecord(x,i){
  const r=(x&&typeof x==='object')?{...x}:{};
  if(r.jenis==='Rekomendasi Nikah')r.jenis='N Keluar';
  r.id=r.id||makeId();
  r.createdAt=r.createdAt||'';
  r.updatedAt=r.updatedAt||'';
  r.sumberId=r.sumberId||''; r.sumberJenis=r.sumberJenis||''; r.sumberNomor=r.sumberNomor||'';
  return r;
}
let data=[];
try{
  data=JSON.parse(localStorage.getItem(KEY)||'[]').map(normalizeRecord);
}catch(_error){
  data=[];
}
if(!data.length){
 data=[normalizeRecord({jenis:'N Masuk',suami:'Contoh Nama',istri:'Contoh Pasangan',nikSuami:'',nikIstri:'',namaWali:'Contoh Wali',tanggal:'2026-01-15',nomor:'CONTOH/001',alamat:'Desa Pelang Kidul',status:'Lengkap',createdAt:''},0)];
}

async function loadFromSupabase(){
  if(STORAGE_MODE !== 'supabase' || !supabaseClient) return;
  try{
    const { data: rows, error } = await supabaseClient
      .from(SUPABASE_TABLE)
      .select('id, data')
      .eq('id', 'app_data')
      .maybeSingle();

    if(error) throw new Error(error.message);
    const payload = Array.isArray(rows?.data) ? rows.data : [];
    if(payload.length){
      data = payload.map(normalizeRecord);
      localStorage.setItem(KEY, JSON.stringify(data));
    }
  }catch(error){
    console.warn('Supabase load fallback to localStorage:', error);
  }
}

async function syncToSupabase(){
  if(STORAGE_MODE !== 'supabase' || !supabaseClient){
    save();
    return;
  }

  try{
    const rows=data.map(record => ({ ...record, id: record.id || makeId() }));
    const payload = { id: 'app_data', data: rows, updated_at: new Date().toISOString() };
    const { error } = await supabaseClient.from(SUPABASE_TABLE).upsert(payload, { onConflict: 'id' });
    if(error) throw new Error(error.message);
    localStorage.setItem(KEY, JSON.stringify(rows));
  }catch(error){
    console.error('Supabase sync failed, fallback to localStorage:', error);
    save();
  }
}

function save(){
  localStorage.setItem(KEY, JSON.stringify(data));
  if(STORAGE_MODE === 'supabase' && supabaseClient){
    syncToSupabase();
  }
}

if(STORAGE_MODE === 'supabase' && supabaseClient){
  loadFromSupabase();
}

save();
initAuth();

function downloadBackup(){
  const payload={
    app:'MyArsip Nikah',
    desa:'Pelang Kidul',
    version:APP_VERSION,
    schema:'myarsip-nikah-v2',
    exportedAt:new Date().toISOString(),
    data:data
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const d=new Date();
  const stamp=d.toISOString().slice(0,10);
  a.href=url; a.download=`Backup-MyArsip-Nikah-${stamp}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast('Backup data berhasil dibuat');
}

function restoreBackup(input){
  const file=input.files?.[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const payload=JSON.parse(reader.result);
      const restored=Array.isArray(payload)?payload:payload?.data;
      if(!Array.isArray(restored))throw new Error('File backup tidak memiliki struktur data yang sesuai.');
      const allowed=['N Masuk','N Keluar','Rekomendasi Nikah','Isbat Nikah','Surat Wali','Pembatalan Nikah'];
      const valid=restored.every(x=>x&&typeof x==='object'&&typeof x.jenis==='string'&&allowed.includes(x.jenis));
      if(!valid)throw new Error('Data backup tidak valid, rusak, atau berisi jenis data yang tidak dikenal.');
      if(!confirm(`Restore akan mengganti data aplikasi saat ini dengan ${restored.length} data dari file backup. Lanjutkan?`)){input.value='';return;}
      // Buat backup otomatis dari kondisi saat ini sebelum data diganti.
      downloadBackup();
      data=restored.map(normalizeRecord);
      save();
      renderAll(); renderData(); renderRecommendations(); renderIsbat(); renderWali(); renderPembatalan(); renderArchiveYearLists();
      toast(`Restore berhasil: ${data.length} data dimuat`);
    }catch(err){
      alert(err.message||'File backup tidak dapat dipulihkan.');
    }finally{input.value='';}
  };
  reader.onerror=()=>{alert('File backup gagal dibaca.');input.value='';};
  reader.readAsText(file);
}

// Simpan hasil migrasi tipe data lama agar konsisten dengan struktur baru.
localStorage.setItem(KEY,JSON.stringify(data));
function fmtDate(s){
  if(!s)return '—';
  const raw=String(s).trim();
  const m=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m){
    const months=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const day=Number(m[3]), month=Number(m[2]), year=Number(m[1]);
    if(month>=1&&month<=12&&day>=1&&day<=31)return `${String(day).padStart(2,'0')} ${months[month-1]} ${year}`;
  }
  const d=new Date(raw);
  if(Number.isNaN(d.getTime()))return '—';
  return d.toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
}
function fmtDateTime(s){
  if(!s)return '—';
  const d=new Date(s);
  if(Number.isNaN(d.getTime()))return '—';
  return d.toLocaleString('id-ID',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
function openAllArchiveCabinets(btn){
  const menu=document.getElementById('archiveSubmenu');
  if(menu && menu.classList.contains('open')){
    menu.classList.remove('open');
    return;
  }
  if(menu)menu.classList.add('open');
  document.querySelectorAll('.archive-sub-btn').forEach(x=>x.classList.remove('active'));
  showPage('arsip',btn||document.getElementById('archiveNavBtn'));
  const yearLists=document.getElementById('archiveYearLists');
  if(yearLists)yearLists.style.display='block';
  renderArchiveYearLists();
  document.getElementById('pageTitle').textContent='Arsip Dokumen';
  window.scrollTo({top:0,behavior:'smooth'});
}

function toggleArchiveMenu(btn){
  openAllArchiveCabinets(btn);
}

function archiveDateOf(x){
  // Tahun arsip selalu mengikuti tanggal dokumen/peristiwa yang dicatat,
  // bukan tanggal saat data dimasukkan ke aplikasi.
  return x?.tanggal||x?.tanggalSurat||x?.tanggalInput||x?.tanggalAkad||'';
}
function archiveYearOf(x){
  const raw=archiveDateOf(x);
  const m=String(raw).match(/^(\d{4})/);
  if(m)return m[1];
  return 'Tanpa Tahun';
}

function archiveTypes(){
  return [
    {type:'N Masuk',label:'Arsip N Masuk',icon:'<svg class="archive-card-svg archive-folder archive-nmasuk" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 9a3 3 0 0 1 3-3h6l3 3h9a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9Z"/><path d="M16 13v9m-4-4 4 4 4-4"/></svg>'},
    {type:'N Keluar',label:'Arsip N Keluar',icon:'<svg class="archive-card-svg archive-folder archive-nkeluar" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 9a3 3 0 0 1 3-3h6l3 3h9a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9Z"/><path d="M16 19v-9m-4 4 4-4 4 4"/></svg>'},
    {type:'Isbat Nikah',label:'Arsip Isbat Nikah',icon:'<svg class="archive-card-svg archive-file archive-isbat" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4h11l5 5v19H8V4Z"/><path d="M19 4v6h5M12 16h8m-8 5h8"/></svg>'},
    {type:'Surat Wali',label:'Arsip Surat Wali',icon:'<svg class="archive-card-svg archive-person archive-wali" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="10" r="4"/><path d="M8 27c.7-5.3 3.4-8 8-8s7.3 2.7 8 8"/></svg>'},
    {type:'Pembatalan Nikah',label:'Arsip Pembatalan Nikah',icon:'<svg class="archive-card-svg archive-file archive-cancel" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4h11l5 5v19H8V4Z"/><path d="M19 4v6h5M12 16h8"/><path class="cancel-mark" d="m20 20 7 7m0-7-7 7"/></svg>'}
  ];
}

function archiveYearsForType(type){
  const years={};
  data.filter(x=>x.jenis===type).forEach(x=>{
    const y=archiveYearOf(x);
    if(!years[y])years[y]=0;
    years[y]++;
  });
  return Object.keys(years).sort((a,b)=>{
    if(a==='Tanpa Tahun')return 1;
    if(b==='Tanpa Tahun')return -1;
    return b.localeCompare(a);
  }).map(y=>({year:y,count:years[y]}));
}

function renderArchiveYearLists(selectedType=''){
  const el=document.getElementById('archiveYearLists');
  if(!el)return;
  const types=selectedType
    ? archiveTypes().filter(item=>item.type===selectedType)
    : archiveTypes();
  const backButton=selectedType
    ? `<button class="btn light archive-back" type="button" onclick="backToAllArchiveCabinets()">← Kembali ke semua lemari arsip</button>`
    : '';
  el.innerHTML=backButton+types.map(item=>{
    const years=archiveYearsForType(item.type);
    const yearsHtml=years.length
      ? years.map(y=>`<button class="archive-year-btn" type="button" onclick="event.stopPropagation();openArchiveYear('${esc(item.type)}','${esc(y.year)}')">${esc(y.year)} <span style="opacity:.7">(${y.count})</span></button>`).join('')
      : '<div class="archive-year-empty">Belum ada data untuk jenis arsip ini.</div>';
    return `<div class="archive-year-group" role="button" tabindex="0" style="cursor:pointer" onclick="openArchiveCategory('${esc(item.type)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openArchiveCategory('${esc(item.type)}')}">
      <div class="archive-year-head">${item.icon}<span>${esc(item.label)}</span><span class="archive-cabinet-badge">LEMARI ARSIP</span></div>
      <div class="archive-year-list">${yearsHtml}</div>
    </div>`;
  }).join('');
}


function openArchiveCategory(type,btn){
  const menu=document.getElementById('archiveSubmenu');
  if(menu)menu.classList.add('open');
  document.querySelectorAll('.archive-sub-btn').forEach(x=>x.classList.remove('active'));
  if(btn)btn.classList.add('active');
  showPage('arsip',document.getElementById('archiveNavBtn'));
  const result=document.getElementById('archiveCategoryResult');
  if(result)result.style.display='none';
  const yearLists=document.getElementById('archiveYearLists');
  if(yearLists)yearLists.style.display='block';
  // Klik akar arsip sekarang membuka SATU lemari yang dipilih saja.
  // Lemari lain tidak ikut ditampilkan di layar utama.
  renderArchiveYearLists(type);
  const group=archiveTypes().find(x=>x.type===type);
  const title=group?group.label:type;
  document.getElementById('pageTitle').textContent=title;
  window.scrollTo({top:0,behavior:'smooth'});
}

function backToAllArchiveCabinets(){
  document.querySelectorAll('.archive-sub-btn').forEach(x=>x.classList.remove('active'));
  const yearLists=document.getElementById('archiveYearLists');
  if(yearLists)yearLists.style.display='block';
  renderArchiveYearLists();
  document.getElementById('pageTitle').textContent='Arsip Dokumen';
  window.scrollTo({top:0,behavior:'smooth'});
}

function openArchiveYear(type,year){
  const rows=sortByNomorSurat(
    data.filter(x=>x.jenis===type && archiveYearOf(x)===year)
  );
  const result=document.getElementById('archiveCategoryResult');
  const yearLists=document.getElementById('archiveYearLists');
  if(!result)return;
  // Saat tahun dipilih, daftar folder tahun benar-benar dilepas dari layar.
  // Hasil tahun terpilih menjadi satu-satunya isi area Arsip Dokumen.
  if(yearLists){yearLists.style.display='none';yearLists.innerHTML='';}
  result.style.display='block';
  result.innerHTML=
    `<div class="panel-head">
      <div>
        <h3>Arsip ${esc(type)} — Tahun ${esc(year)}</h3>
        <p class="page-intro">${rows.length} data ditemukan pada tahun yang dipilih.</p>
      </div>
      <button class="btn light archive-back" type="button" onclick="backToArchiveYears('${esc(type)}')">← Kembali ke daftar tahun</button>
    </div>`+
    categoryTableHTML(rows,`Belum ada arsip ${esc(type)} pada tahun ${esc(year)}.`);
  document.getElementById('pageTitle').textContent=`${type} — ${year}`;
  document.querySelectorAll('.page').forEach(x=>x.style.display='none');
  document.getElementById('arsip').style.display='block';
  document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
  const archiveBtn=document.getElementById('archiveNavBtn');
  if(archiveBtn)archiveBtn.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

function backToArchiveYears(type=''){
  const result=document.getElementById('archiveCategoryResult');
  const yearLists=document.getElementById('archiveYearLists');
  if(result){result.style.display='none';result.innerHTML='';}
  if(yearLists)yearLists.style.display='block';
  renderArchiveYearLists(type);
  const group=archiveTypes().find(x=>x.type===type);
  document.getElementById('pageTitle').textContent=group?group.label:'Arsip Dokumen';
  window.scrollTo({top:0,behavior:'smooth'});
}

function showPage(id,btn){
 if(!requireAuth()) return;
 document.querySelectorAll('.page').forEach(x=>x.style.display='none');
 document.getElementById(id).style.display='block';
 document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
 if(btn)btn.classList.add('active');
 document.getElementById('pageTitle').textContent={dashboard:'Dashboard',data:'Data Pernikahan',rekomendasi:'Rekomendasi Nikah',isbat:'Isbat Nikah',wali:'Surat Wali',pembatalan:'Pembatalan Nikah',arsip:'Arsip Dokumen',laporan:'Laporan',tentang:'Tentang',pengaturan:'Pengaturan'}[id];
 if(id==='dashboard')renderAll();
 if(id==='data')renderData();
 if(id==='rekomendasi')renderRecommendations();
 if(id==='isbat')renderIsbat();
 if(id==='wali')renderWali();
 if(id==='pembatalan')renderPembatalan();
 if(id==='laporan')renderReport();
 if(id==='pengaturan')loadSettings();
}
function renderAll(){
 const q=(document.getElementById('dashboardSearch')?.value||'').trim().toLowerCase();
 // Dashboard selalu mengikuti satu tahun kerja: tahun berjalan.
 // Data tahun lama tetap tersimpan dan ditampilkan melalui Arsip Dokumen.
 const currentYear=String(new Date().getFullYear());
 const y=currentYear;
 const matches=x=>{
   const year=archiveYearOf(x);
   const text=[x.jenis,x.suami,x.istri,x.nama,x.nik,x.nikSuami,x.nikIstri,x.nomor,x.nomorSurat,x.namaWali,x.alasan,x.asal,x.tujuan,x.alamat,x.alamatSuami,x.alamatIstri,x.alamatWali,x.tanggalAkad,x.nomorPutusanPA].join(' ').toLowerCase();
   // Tanpa pencarian: Dashboard hanya menampilkan tahun berjalan.
   // Saat pengguna mengetik pencarian: cari ke seluruh tahun agar arsip lama tetap mudah ditemukan.
   const yearMatch=q ? true : (year===y && year!=='Tanpa Tahun');
   return yearMatch && (!q||text.includes(q));
 };
 const filtered=data.filter(matches);
 const all=sortByNomorSurat(filtered);
 document.getElementById('statTotal').textContent=data.filter(x=>archiveYearOf(x)===y && x.jenis==='N Masuk').length;
 document.getElementById('statDocs').textContent=filtered.filter(x=>x.status==='Lengkap').length;
 document.getElementById('statYear').textContent=y;
 const statR=document.getElementById('statRekomendasi'); if(statR) statR.textContent=filtered.filter(x=>x.jenis==='N Keluar').length;
 const yf=document.getElementById('dashboardYearFilter');
 if(yf){
   yf.innerHTML=`<option value="${esc(y)}">${esc(y)}</option>`;
   yf.value=y;
   yf.disabled=true;
   yf.title='Dashboard mengikuti tahun berjalan';
 }
 document.getElementById('recent').innerHTML=dashboardTableHTML(all);
}

function suratOrder(x){
 const raw=String(x.nomorSurat||x.nomor||'');
 const nums=raw.match(/\d+/g);
 return nums?parseInt(nums[nums.length-1],10):Number.MAX_SAFE_INTEGER;
}
function compareUnifiedRecords(a,b){
 const ao=suratOrder(a),bo=suratOrder(b);
 if(ao!==bo)return ao-bo;
 const ad=String(a.tanggalSurat||a.tanggal||'');
 const bd=String(b.tanggalSurat||b.tanggal||'');
 if(ad!==bd)return ad.localeCompare(bd);
 return String(a.createdAt||'').localeCompare(String(b.createdAt||''));
}
function sortByNomorSurat(rows){return rows.slice().sort(compareUnifiedRecords);}
function typeLabel(type){return ({'N Masuk':'N Masuk','N Keluar':'N Keluar','Isbat Nikah':'Isbat Nikah','Surat Wali':'Surat Wali','Pembatalan Nikah':'Pembatalan Nikah','Rekomendasi Nikah':'N Keluar'})[type]||type||'—';}
function personLabel(x){
 if(x.istri)return `${x.suami||x.nama||'—'} & ${x.istri}`;
 return x.suami||x.nama||'—';
}
function thumbnailHTML(x){
 const p1=x.fotoSuami?`<img class="data-thumb" src="${esc(x.fotoSuami)}" alt="Foto calon pengantin laki-laki">`:'';
 const p2=x.fotoIstri?`<img class="data-thumb" src="${esc(x.fotoIstri)}" alt="Foto calon pengantin wanita">`:'';
 return (p1||p2)?`<div class="thumb-stack">${p1}${p2}</div>`:'<span class="thumb-empty">Belum ada foto</span>';
}
function dashboardTableHTML(rows){
 if(!rows.length)return '<div class="empty">Belum ada data yang sesuai pencarian.</div>';
 let h='<table><thead><tr><th>No Urut</th><th>Nomor Surat</th><th>Jenis</th><th>Pasangan / Pemohon</th><th>Tanggal</th><th>Foto</th></tr></thead><tbody>';
 rows.forEach((x,i)=>{
   h+=`<tr><td><b>${i+1}</b></td><td><b>${esc(x.nomorSurat||x.nomor||'—')}</b></td><td><span class="badge">${esc(typeLabel(x.jenis))}</span></td><td>${clickableName(data.indexOf(x),personLabel(x))}</td><td>${fmtDate(x.tanggalSurat||x.tanggal)}</td><td>${thumbnailHTML(x)}</td></tr>`;
 });
 return h+'</tbody></table>';
}

function fmtDateTime(s){
  if(!s)return 'Belum tercatat (data lama)';
  const d=new Date(s);
  if(Number.isNaN(d.getTime()))return 'Belum tercatat (data lama)';
  return d.toLocaleString('id-ID',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
function openRecordDetail(index){
  const x=data[index]; if(!x)return;
  const rows=[
    ['Jenis Data',x.jenis],
    ['Nomor Surat / Dokumen',x.nomorSurat||x.nomor],
    ['Tanggal Dokumen / Data',fmtDate(x.tanggalSurat||x.tanggal)],
    ['Tanggal Akad Nikah',fmtDate(x.tanggalAkad)],
    ['Nomor Putusan PA',x.nomorPutusanPA],
    ['Waktu Input',fmtDateTime(x.createdAt)],
    ['Terakhir Diubah',fmtDateTime(x.updatedAt)],
    ['Calon Pengantin Laki-laki',x.suami||x.nama],
    ['NIK Laki-laki',x.nikSuami],
    ['Status Laki-laki',x.statusSuami],
    ['Alamat Laki-laki',x.alamatSuami],
    ['Calon Pengantin Wanita',x.istri],
    ['NIK Wanita',x.nikIstri],
    ['Status Wanita',x.statusIstri],
    ['Alamat Wanita',x.alamatIstri],
    ['Alamat Wali',x.alamatWali],
    ['NIK',x.nik],
    ['Alamat',x.alamat],
    ['Nama Wali',x.namaWali],
    ['Hubungan Wali',x.hubunganWali],
    ['Jenis Wali',x.waliHakim||x.jenisWali],
    ['Sebab Wali Hakim',x.sebabWaliHakim],
    ['Asal KUA',x.asal],
    ['Tujuan KUA',x.tujuan],
    ['Status Arsip',x.status],
    ['Alasan Pembatalan',x.alasan],
    ['Keterangan Isbat',x.keterangan]
  ].filter(r=>r[1]!==undefined&&r[1]!=='');
  const pasangan=x.istri?`${x.suami||x.nama||'—'} & ${x.istri}`:(x.suami||x.nama||'—');
  const photos=(x.fotoSuami||x.fotoIstri)?`<div class="detail-photos">${x.fotoSuami?`<img src="${esc(x.fotoSuami)}" alt="Foto calon pengantin laki-laki">`:''}${x.fotoIstri?`<img src="${esc(x.fotoIstri)}" alt="Foto calon pengantin wanita">`:''}</div>`:'';
  showDetailModal(`<h2 class="detail-title">Detail Data</h2><p class="detail-subtitle">${esc(pasangan)}</p><p class="detail-meta">ID internal: ${esc(x.id||'—')} · Waktu input: ${esc(fmtDateTime(x.createdAt))}${x.updatedAt?` · Terakhir diubah: ${esc(fmtDateTime(x.updatedAt))}`:''}</p>${photos}<div class="detail-grid">${rows.map(r=>`<div class="detail-item"><small>${r[0]}</small><b>${esc(r[1]||'—')}</b></div>`).join('')}</div><div class="detail-actions"><button class="btn edit" type="button" onclick="editRecord(${index})">✎ Ubah Data</button><button class="btn light" type="button" onclick="window.print()">🖨 Cetak</button><button class="btn light" type="button" onclick="closeDetailModal()">Tutup</button></div>`);
}
function showDetailModal(content){
  let m=document.getElementById('detailModal');
  if(!m){
    m=document.createElement('div');
    m.id='detailModal';
    m.className='modal';
    m.innerHTML='<div class="modal-box detail-modal-box" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><button class="modal-close" type="button" aria-label="Tutup" onclick="closeDetailModal()">×</button><div id="detailContent"></div></div>';
    m.addEventListener('click',function(e){
      if(e.target===m) closeDetailModal();
    });
    document.body.appendChild(m);
  }
  document.getElementById('detailContent').innerHTML=content;
  m.classList.add('open');
}
function closeDetailModal(){
  const m=document.getElementById('detailModal');
  if(m) m.classList.remove('open');
}
document.addEventListener('keydown',function(e){
  if(e.key==='Escape') closeDetailModal();
});
function clickableName(index,name){ return `<button class="link-name" onclick="openRecordDetail(${index})">${esc(name||'—')}</button>`; }
function categoryTableHTML(rows,emptyText){
 if(!rows.length)return `<div class="empty">${emptyText}</div>`;
 let h='<table><thead><tr><th>No</th><th>Nomor Surat</th><th>Jenis</th><th>Pasangan / Pemohon</th><th>Tanggal</th><th>Foto</th><th>Aksi</th></tr></thead><tbody>';
 rows.forEach((x,i)=>{
   const idx=data.indexOf(x);
   h+=`<tr><td>${i+1}</td><td><b>${esc(x.nomorSurat||x.nomor||'—')}</b></td><td><span class="badge">${esc(typeLabel(x.jenis))}</span></td><td>${clickableName(idx,personLabel(x))}</td><td>${fmtDate(x.tanggalSurat||x.tanggal)}</td><td>${thumbnailHTML(x)}</td><td><div class="data-tools"><button class="btn edit" onclick="editRecord(${idx})">Ubah</button><button class="btn light" onclick="delData(${idx})">Hapus</button></div></td></tr>`;
 });
 return h+'</tbody></table>';
}
function recommendationTableHTML(rows){return categoryTableHTML(rows,'Belum ada data N Keluar untuk rekomendasi nikah.');}
function renderRecommendations(){
 const rows=filterRows('N Keluar','recommendation');
 const el=document.getElementById('recommendationTable'); if(el)el.innerHTML=recommendationTableHTML(rows);
}
function renderIsbat(){
 const rows=filterRows('Isbat Nikah','isbat');
 const el=document.getElementById('isbatTable'); if(el)el.innerHTML=categoryTableHTML(rows,'Belum ada data Isbat Nikah yang sesuai filter.');
}
function renderWali(){
 const rows=filterRows('Surat Wali','wali');
 const el=document.getElementById('waliTable'); if(el)el.innerHTML=categoryTableHTML(rows,'Belum ada data Surat Wali yang sesuai filter.');
}
function renderPembatalan(){
 const rows=filterRows('Pembatalan Nikah','cancellation');
 const el=document.getElementById('cancellationTable'); if(el)el.innerHTML=categoryTableHTML(rows,'Belum ada data Pembatalan Nikah yang sesuai filter.');
}
function toggleWaliFields(){
  const jenis=document.getElementById('waliHakim')?.value||'Wali Nasab';
  const namaWali=document.getElementById('namaWali');
  const hubunganWali=document.getElementById('hubunganWali');
  const sebab=document.getElementById('sebabWaliHakim');
  const namaWrap=namaWali?.parentElement;
  const hubunganWrap=hubunganWali?.parentElement;
  const sebabWrap=sebab?.parentElement;
  const hakim=jenis==='Wali Hakim';
  if(namaWali){namaWali.disabled=hakim;namaWali.required=false; if(hakim && editingIndex<0)namaWali.value='';}
  if(hubunganWali){hubunganWali.disabled=hakim;hubunganWali.required=false; if(hakim && editingIndex<0)hubunganWali.value='';}
  if(sebab){sebab.disabled=false;sebab.required=hakim;}
  if(namaWrap)namaWrap.style.display='';
  if(hubunganWrap)hubunganWrap.style.display='';
  if(sebabWrap)sebabWrap.style.display='';
}

function tableHTML(rows,actions=true){
 if(!rows.length)return '<div class="empty">Belum ada data N Masuk.</div>';
 let h='<table><thead><tr><th>No</th><th>Nomor Surat</th><th>Jenis</th><th>Pasangan</th><th>Wali</th><th>Tanggal Surat</th><th>Akad Nikah</th><th>Foto</th>'+(actions?'<th>Aksi</th>':'')+'</tr></thead><tbody>';
 rows.forEach((x,i)=>{
   const idx=data.indexOf(x);
   h+=`<tr><td>${i+1}</td><td><b>${esc(x.nomorSurat||x.nomor||'—')}</b></td><td><span class="badge">${esc(typeLabel(x.jenis))}</span></td><td>${clickableName(idx,personLabel(x))}</td><td>${esc(x.namaWali)||'—'}</td><td>${fmtDate(x.tanggalSurat||x.tanggal)}</td><td>${fmtDate(x.tanggalAkad)}</td><td>${thumbnailHTML(x)}</td>${actions?`<td><div class="data-tools"><button class="btn edit" onclick="editRecord(${idx})">Ubah</button><button class="btn light" onclick="delData(${idx})">Hapus</button></div></td>`:''}</tr>`;
 });
 return h+'</tbody></table>';
}
function filterRows(type,prefix){
 const q=(document.getElementById(prefix+'Search')?.value||'').trim().toLowerCase();
 const y=document.getElementById(prefix+'YearFilter')?.value||'';
 const st=document.getElementById(prefix+'StatusFilter')?.value||'';
 const rows=data.filter(x=>{
   if(x.jenis!==type)return false;
   const year=archiveYearOf(x);
   const text=[x.jenis,x.suami,x.istri,x.nama,x.nik,x.nikSuami,x.nikIstri,x.nomor,x.nomorSurat,x.namaWali,x.hubunganWali,x.alasan,x.nomorPutusanPA,x.keterangan,x.alamat,x.alamatSuami,x.alamatIstri,x.alamatWali,x.asal,x.tujuan,x.status].join(' ').toLowerCase();
   return (!q||text.includes(q)) && (!y||year===y) && (!st||String(x.status||'')===st);
 });
 updateFilterYear(prefix,type,y);
 const count=document.getElementById(prefix+'FilterCount');
 if(count)count.textContent=`Menampilkan ${rows.length} dari ${data.filter(x=>x.jenis===type).length} data.`;
 return sortByNomorSurat(rows);
}
function updateFilterYear(prefix,type,current){
 const el=document.getElementById(prefix+'YearFilter'); if(!el)return;
 const ys=[...new Set(data.filter(x=>x.jenis===type).map(archiveYearOf).filter(y=>y!=='Tanpa Tahun'))].sort().reverse();
 const keep=current||el.value;
 el.innerHTML='<option value="">Semua tahun</option>'+ys.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
 el.value=ys.includes(keep)?keep:'';
}
function resetFilters(prefix){
 ['Search','YearFilter','StatusFilter'].forEach(s=>{const el=document.getElementById(prefix+s);if(el)el.value='';});
 ({data:renderData,recommendation:renderRecommendations,isbat:renderIsbat,wali:renderWali,cancellation:renderPembatalan}[prefix]||renderAll)();
}
function renderData(){
 const rows=filterRows('N Masuk','data');
 document.getElementById('dataTable').innerHTML=tableHTML(rows,true);
}

function renderReport(){
 const types=['N Masuk','N Keluar','Isbat Nikah','Surat Wali','Pembatalan Nikah'];
 const labels={'N Masuk':'N Masuk','N Keluar':'N Keluar / Rekomendasi','Isbat Nikah':'Isbat Nikah','Surat Wali':'Surat Wali','Pembatalan Nikah':'Pembatalan Nikah'};
 const currentYear=String(new Date().getFullYear());
 const years=[...new Set(data.map(archiveYearOf).filter(y=>y!=='Tanpa Tahun'))].sort((a,b)=>Number(b)-Number(a));
 if(!years.includes(currentYear))years.unshift(currentYear);
 const yf=document.getElementById('reportYearFilter');
 const selected=(yf?.value&&years.includes(yf.value))?yf.value:currentYear;
 if(yf){
   yf.innerHTML=years.map(y=>`<option value="${esc(y)}">Laporan Tahun ${esc(y)}</option>`).join('');
   yf.value=selected;
 }
 const rows=data.filter(x=>archiveYearOf(x)===selected);
 const complete=rows.filter(x=>x.status==='Lengkap').length;
 const incomplete=rows.filter(x=>x.status==='Belum Lengkap').length;
 const cards=`<div class="report-grid"><div class="report-card"><small>Total arsip tahun ${esc(selected)}</small><b>${rows.length}</b></div><div class="report-card"><small>Lengkap</small><b>${complete}</b></div><div class="report-card"><small>Belum lengkap</small><b>${incomplete}</b></div><div class="report-card"><small>Tahun laporan</small><b>${esc(selected)}</b></div></div>`;
 const typeRows=types.map(t=>`<tr><td>${labels[t]}</td><td>${rows.filter(x=>x.jenis===t).length}</td><td>${rows.filter(x=>x.jenis===t&&x.status==='Lengkap').length}</td><td>${rows.filter(x=>x.jenis===t&&x.status==='Belum Lengkap').length}</td></tr>`).join('');
 document.getElementById('report').innerHTML=cards+`<h4>Laporan Tahun ${esc(selected)}</h4><table class="report-table"><thead><tr><th>Jenis</th><th>Total</th><th>Lengkap</th><th>Belum Lengkap</th></tr></thead><tbody>${typeRows}</tbody></table>`;
}

function openModal(presetType=''){
  if(!requireAuth()) return;
  document.getElementById('modal').classList.add('open');
  backToTypeChooser();
  if(presetType) chooseType(presetType);
}
function closeModal(){document.getElementById('modal').classList.remove('open');editingIndex=-1}
function backToTypeChooser(){
  document.getElementById('typeChooser').style.display='block';
  document.getElementById('dataForm').style.display='none';
  document.getElementById('modalTitle').textContent='Tambah Data';
}
async function findPersonForAutofill(prefix,value){
  const q=String(value||'').trim();
  if(!q)return null;
  const norm=v=>String(v||'').trim().replace(/\s+/g,' ').toLowerCase();
  const qName=norm(q);

  // Pastikan data bersama sudah dimuat sebelum mencari.
  if(!Array.isArray(data)||!data.length){
    try{ await loadSharedData(); }catch(e){ console.error('Load data untuk autofill:',e); }
  }

  let found=data.find(x=>
    (prefix==='Suami'
      ? [x.suami,x.nama]
      : [x.istri,x.nama]
    ).some(n=>norm(n)===qName)
  );
  if(found)return found;

  if(typeof supabaseClient==='undefined')return null;
  try{
    const field=prefix==='Suami'?'suami':'istri';
    // Cari nama yang mengandung teks yang diketik, lalu cocokkan kembali secara normal.
    const {data:rows,error}=await supabaseClient
      .from('arsip_nikah')
      .select('*')
      .ilike(field,'%'+q.replace(/%/g,'')+'%')
      .limit(20);
    if(error)throw error;
    const mapped=(Array.isArray(rows)?rows:[]).map(r=>mapSupabaseRowForApp(r));
    found=mapped.find(x=>
      [prefix==='Suami'?x.suami:x.istri,x.nama].some(n=>norm(n)===qName)
    ) || mapped.find(x=>
      [prefix==='Suami'?x.suami:x.istri,x.nama].some(n=>norm(n).includes(qName))
    );
    if(found && !data.some(x=>String(x.id||'')===String(found.id||'')))data.push(found);
    return found||null;
  }catch(err){
    console.error('Autofill nama:',err);
    return null;
  }
}
async function fillPersonFromExisting(prefix,value){
  const found=await findPersonForAutofill(prefix,value);
  if(!found)return;
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v??'';};
  set(prefix==='Suami'?'nikSuami':'nikIstri',prefix==='Suami'?found.nikSuami:found.nikIstri);
  set(prefix==='Suami'?'statusSuami':'statusIstri',prefix==='Suami'?found.statusSuami:found.statusIstri);
  set('alamat'+prefix,prefix==='Suami'?(found.alamatSuami||found.alamat):(found.alamatIstri||found.alamat));
}
async function fillPersonFromNik(prefix,value){
  const q=String(value||'').replace(/\D/g,'');if(!q)return;
  if(!Array.isArray(data)||!data.length){
    try{ await loadSharedData(); }catch(e){ console.error('Load data untuk autofill NIK:',e); }
  }
  let found=data.find(x=>String(prefix==='Suami'?x.nikSuami:(x.nikIstri||'')).replace(/\D/g,'')===q);
  if(!found && typeof supabaseClient!=='undefined'){
    try{
      const field=prefix==='Suami'?'nik_suami':'nik_istri';
      const {data:rows,error}=await supabaseClient.from('arsip_nikah').select('*').eq(field,q).limit(1);
      if(!error && rows && rows[0]){
        found=mapSupabaseRowForApp(rows[0]);
        if(!data.some(x=>String(x.id||'')===String(found.id||'')))data.push(found);
      }
    }catch(err){ console.error('Autofill NIK:',err); }
  }
  if(!found)return;
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v??'';};
  set(prefix==='Suami'?'suami':'istri',prefix==='Suami'?found.suami:found.istri);
  set(prefix==='Suami'?'nikSuami':'nikIstri',prefix==='Suami'?found.nikSuami:found.nikIstri);
  set(prefix==='Suami'?'statusSuami':'statusIstri',prefix==='Suami'?found.statusSuami:found.statusIstri);
  set('alamat'+prefix,prefix==='Suami'?(found.alamatSuami||found.alamat):(found.alamatIstri||found.alamat));
}

function resetDynamicFormForNew(){
  const form=document.getElementById('dataForm');
  if(!form)return;
  form.reset();
  form.querySelectorAll('input,textarea,select').forEach(el=>{
    if(el.type==='file')el.value='';
    else if(el.tagName==='SELECT')el.selectedIndex=0;
    else if(el.type!=='hidden')el.value='';
    el.removeAttribute('aria-invalid');
  });
  form.querySelectorAll('.photo-preview').forEach(img=>{img.removeAttribute('src');img.style.display='none';});
}

function chooseType(type,btn){
 document.querySelectorAll('#typeChooser .type-choice').forEach(x=>x.classList.remove('selected'));
 if(btn)btn.classList.add('selected');
 document.getElementById('typeChooser').style.display='none';document.getElementById('dataForm').style.display='block';document.getElementById('modalTitle').textContent=(type==='Pembatalan Nikah'?'Input Pembatalan Nikah / Batal Nikah Sebelum Akad':'Input '+type);document.getElementById('jenis').value=type;
 const f=document.getElementById('dynamicFields');
 const common='<div><label>Nomor Surat / Dokumen</label><input id="nomor"></div><div><label>Tanggal Dokumen / Data</label><input id="tanggal" type="date" required></div>';
 let html='';
if(type==='N Masuk') html='<div><label>Nama Calon Pengantin Laki-laki</label><input id="suami" required list="namaSuamiList" onchange="fillPersonFromExisting(\'Suami\',this.value)" onblur="fillPersonFromExisting(\'Suami\',this.value)"></div><div><label>NIK Laki-laki</label><input id="nikSuami" inputmode="numeric" onblur="fillPersonFromNik(\'Suami\',this.value)"></div><div><label>Status Calon Pengantin Laki-laki</label><select id="statusSuami"><option value="">Pilih status</option><option value="Jejaka">Jejaka</option><option value="Duda Cerai Hidup">Duda Cerai Hidup</option><option value="Duda Cerai Mati">Duda Cerai Mati</option></select></div><div><label>Nama Calon Pengantin Wanita</label><input id="istri" required list="namaIstriList" onchange="fillPersonFromExisting(\'Istri\',this.value)" onblur="fillPersonFromExisting(\'Istri\',this.value)"></div><div><label>NIK Wanita</label><input id="nikIstri" inputmode="numeric" onblur="fillPersonFromNik(\'Istri\',this.value)"></div><div><label>Status Calon Pengantin Wanita</label><select id="statusIstri"><option value="">Pilih status</option><option value="Perawan">Perawan</option><option value="Janda Cerai Hidup">Janda Cerai Hidup</option><option value="Janda Cerai Mati">Janda Cerai Mati</option></select></div><div class="address-pair"><div><label>Alamat Calon Pengantin Laki-laki</label><input id="alamatSuami" autocomplete="off" placeholder="Dusun, RT/RW, Desa/Kelurahan, Kecamatan, Kabupaten"></div><div><label>Alamat Calon Pengantin Wanita</label><input id="alamatIstri" autocomplete="off" placeholder="Dusun, RT/RW, Desa/Kelurahan, Kecamatan, Kabupaten"></div></div><div><label>Nama Wali</label><input id="namaWali"></div><div><label>Hubungan Wali</label><input id="hubunganWali"></div><div><label>Jenis Wali</label><select id="waliHakim" onchange="toggleWaliFields()"><option value="Wali Nasab">Wali Nasab</option><option value="Wali Hakim">Wali Hakim</option></select></div>'+common+'<div><label>Tanggal Akad Nikah</label><input id="tanggalAkad" type="date" required></div><div><label>Asal KUA</label><input id="asal"></div><div class="photo-pair"><div class="full" style="font-size:12px;color:var(--muted)">Format foto yang didukung: <b>JPG, JPEG, PNG, atau WebP</b>. Foto akan otomatis diperkecil dan dikompresi menjadi WebP sebelum disimpan ke Supabase Storage.</div><div class="photo-field"><label>Foto Calon Pengantin Laki-laki</label><div class="photo-upload"><input id="fotoSuami" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewPhoto(this,\'previewSuami\')"><div class="photo-placeholder"><strong>📷 Foto 2 × 3</strong><span>Klik untuk upload • JPG / PNG / WebP</span></div><img id="previewSuami" class="photo-preview" alt="Preview foto laki-laki"></div><p class="photo-note">Bingkai 2 × 3 • Format: JPG / PNG / WebP</p></div><div class="photo-field"><label>Foto Calon Pengantin Wanita</label><div class="photo-upload"><input id="fotoIstri" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewPhoto(this,\'previewIstri\')"><div class="photo-placeholder"><strong>📷 Foto 2 × 3</strong><span>Klik untuk upload • JPG / PNG / WebP</span></div><img id="previewIstri" class="photo-preview" alt="Preview foto wanita"></div><p class="photo-note">Bingkai 2 × 3 • Format: JPG / PNG / WebP</p></div></div>'; 
  if(type==='N Keluar') html='<div><label>Nama Calon Pengantin Laki-laki</label><input id="suami" required list="namaSuamiList" onchange="fillPersonFromExisting(\'Suami\',this.value)" onblur="fillPersonFromExisting(\'Suami\',this.value)"></div><div><label>NIK Laki-laki</label><input id="nikSuami" inputmode="numeric" onblur="fillPersonFromNik(\'Suami\',this.value)"></div><div><label>Status Calon Pengantin Laki-laki</label><select id="statusSuami"><option value="">Pilih status</option><option value="Jejaka">Jejaka</option><option value="Duda Cerai Hidup">Duda Cerai Hidup</option><option value="Duda Cerai Mati">Duda Cerai Mati</option></select></div><div><label>Nama Calon Pengantin Wanita</label><input id="istri" required list="namaIstriList" onchange="fillPersonFromExisting(\'Istri\',this.value)" onblur="fillPersonFromExisting(\'Istri\',this.value)"></div><div><label>NIK Wanita</label><input id="nikIstri" inputmode="numeric" onblur="fillPersonFromNik(\'Istri\',this.value)"></div><div><label>Status Calon Pengantin Wanita</label><select id="statusIstri"><option value="">Pilih status</option><option value="Perawan">Perawan</option><option value="Janda Cerai Hidup">Janda Cerai Hidup</option><option value="Janda Cerai Mati">Janda Cerai Mati</option></select></div><div class="address-pair"><div><label>Alamat Calon Pengantin Laki-laki</label><input id="alamatSuami" autocomplete="off" placeholder="Dusun, RT/RW, Desa/Kelurahan, Kecamatan, Kabupaten"></div><div><label>Alamat Calon Pengantin Wanita</label><input id="alamatIstri" autocomplete="off" placeholder="Dusun, RT/RW, Desa/Kelurahan, Kecamatan, Kabupaten"></div></div>'+common+'<div><label>Tujuan KUA</label><input id="tujuan"></div><div class="photo-pair"><div class="full" style="font-size:12px;color:var(--muted)">Format foto yang didukung: <b>JPG, JPEG, PNG, atau WebP</b>. Foto akan otomatis diperkecil dan dikompresi menjadi WebP sebelum disimpan ke Supabase Storage.</div><div class="photo-field"><label>Foto Calon Pengantin Laki-laki</label><div class="photo-upload"><input id="fotoSuami" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewPhoto(this,\'previewSuami\')"><div class="photo-placeholder"><strong>📷 Foto 2 × 3</strong><span>Klik untuk upload • JPG / PNG / WebP</span></div><img id="previewSuami" class="photo-preview" alt="Preview foto laki-laki"></div><p class="photo-note">Bingkai 2 × 3 • Format: JPG / PNG / WebP</p></div><div class="photo-field"><label>Foto Calon Pengantin Wanita</label><div class="photo-upload"><input id="fotoIstri" type="file" accept="image/jpeg,image/png,image/webp" onchange="previewPhoto(this,\'previewIstri\')"><div class="photo-placeholder"><strong>📷 Foto 2 × 3</strong><span>Klik untuk upload • JPG / PNG / WebP</span></div><img id="previewIstri" class="photo-preview" alt="Preview foto wanita"></div><p class="photo-note">Bingkai 2 × 3 • Format: JPG / PNG / WebP</p></div></div>'; 
 if(type==='Isbat Nikah') html='<div><label>Nama Suami / Pemohon</label><input id="suami" required></div><div><label>Nama Istri / Termohon</label><input id="istri" required></div><div><label>NIK Pemohon</label><input id="nikSuami" inputmode="numeric"></div><div><label>NIK Termohon</label><input id="nikIstri" inputmode="numeric"></div>'+common+'<div><label>Nomor Putusan PA</label><input id="nomorPutusanPA" placeholder="Contoh: 123/Pdt.P/2026/PA.Ngw"></div><div class="full"><label>Alamat</label><input id="alamat"></div><div class="full"><label>Keterangan Isbat</label><input id="keterangan"></div>';
 if(type==='Surat Wali') html='<div><label>Nama Calon Pengantin Wanita</label><input id="nama" required></div><div><label>NIK Wanita</label><input id="nik" inputmode="numeric"></div><div class="full"><label>Alamat Calon Pengantin Wanita</label><input id="alamatIstri" autocomplete="off"></div>'+common+'<div><label>Jenis Wali</label><select id="waliHakim" onchange="toggleWaliFields()"><option value="Wali Nasab">Wali Nasab</option><option value="Wali Hakim">Wali Hakim</option></select></div><div><label>Nama Wali</label><input id="namaWali"></div><div><label>Hubungan Wali</label><input id="hubunganWali"></div><div class="full"><label>Alamat Wali</label><input id="alamatWali" autocomplete="off"></div><div class="full"><label>Sebab Wali Hakim</label><textarea id="sebabWaliHakim" rows="3" placeholder="Diisi jika menggunakan Wali Hakim"></textarea></div>';
 if(type==='Pembatalan Nikah') {
   const usedSourceIds=new Set(data.filter(x=>x.jenis==='Pembatalan Nikah' && x.sumberId && x!==data[editingIndex]).map(x=>String(x.sumberId)));
   const sources=data.filter(x=>(x.jenis==='N Masuk'||x.jenis==='N Keluar') && (!usedSourceIds.has(String(x.id)) || String(x.id)===String(data[editingIndex]?.sumberId||'')));
   const sourceOptions=sources.length?'<option value="">Pilih data N Masuk / N Keluar</option>'+sources.map(x=>`<option value="${esc(x.id)}">${esc(typeLabel(x.jenis))} — ${esc(x.nomor||'Tanpa Nomor')} — ${esc(personLabel(x))} — ${esc(fmtDate(x.tanggal||''))}</option>`).join(''):'<option value="">Tidak ada data N Masuk / N Keluar yang belum digunakan</option>';
   html='<div class="full"><label>Data Sumber N Masuk / N Keluar</label><select id="sumberId" onchange="fillPembatalanSource(this.value)" required>'+sourceOptions+'</select><small class="field-note">Pilih data asal. Nama, NIK, nomor, dan tanggal sumber akan terisi otomatis.</small></div><div><label>Nama Suami / Pemohon</label><input id="suami" readonly required></div><div><label>Nama Istri / Termohon</label><input id="istri" readonly required></div><div><label>NIK Pemohon</label><input id="nikSuami" inputmode="numeric" readonly></div><div><label>NIK Termohon</label><input id="nikIstri" inputmode="numeric" readonly></div><div><label>Nomor N Masuk / N Keluar Asal</label><input id="sumberNomor" readonly></div><div><label>Tanggal Data Sumber</label><input id="sumberTanggal" readonly></div>'+common+'<div class="full"><label>Alasan Pembatalan</label><input id="alasan" required></div><div class="full"><label>Alamat</label><input id="alamat" readonly></div>';
  }
 html+='<datalist id="namaSuamiList">'+data.filter(x=>x.suami).map(x=>`<option value="${esc(x.suami)}"></option>`).join('')+'</datalist><datalist id="namaIstriList">'+data.filter(x=>x.istri).map(x=>`<option value="${esc(x.istri)}"></option>`).join('')+'</datalist><div class="full"><label>Status Arsip</label><select id="status"><option>Lengkap</option><option>Belum Lengkap</option></select></div>'; f.innerHTML=html;
  if(editingIndex<0) resetDynamicFormForNew();
 if(type==='N Masuk'||type==='Surat Wali') toggleWaliFields();
}
function fillPembatalanSource(sourceId){
  const src=data.find(x=>String(x.id)===String(sourceId));
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||'';};
  if(!src){['suami','istri','nikSuami','nikIstri','sumberNomor','sumberTanggal','alamat'].forEach(id=>set(id,''));return;}
  set('suami',src.suami); set('istri',src.istri); set('nikSuami',src.nikSuami); set('nikIstri',src.nikIstri);
  set('sumberNomor',src.nomor); set('sumberTanggal',fmtDate(src.tanggal)); set('alamat',src.alamat||src.alamatSuami||src.alamatIstri);
}

async function fileToDataURL(id){
  const file=document.getElementById(id)?.files?.[0];
  if(!file)return '';
  if(!/^image\/(jpeg|png|webp)$/i.test(file.type)){
    throw new Error('Format foto harus JPG, JPEG, PNG, atau WebP.');
  }
  return await compressWebP(file);
}

async function uploadPhotoToStorage(dataUrl,recordId,role){
  if(!dataUrl)return '';
  if(typeof supabaseClient==='undefined')throw new Error('Koneksi database bersama belum siap.');
  const response=await fetch(dataUrl);
  const blob=await response.blob();
  const path=`foto/${recordId}/${role}.webp`;
  const {error}=await supabaseClient.storage.from('arsip-nikah').upload(path,blob,{contentType:'image/webp',upsert:true,cacheControl:'3600'});
  if(error)throw error;
  const {data}=supabaseClient.storage.from('arsip-nikah').getPublicUrl(path);
  if(!data?.publicUrl)throw new Error('Alamat foto dari Supabase Storage tidak tersedia.');
  return data.publicUrl;
}

async function compressWebP(file){
  const bitmap=await createImageBitmap(file);
  const maxW=600, maxH=900;
  const scale=Math.min(1,maxW/bitmap.width,maxH/bitmap.height);
  const w=Math.max(1,Math.round(bitmap.width*scale));
  const h=Math.max(1,Math.round(bitmap.height*scale));
  const canvas=document.createElement('canvas');
  canvas.width=w; canvas.height=h;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(bitmap,0,0,w,h);
  bitmap.close();
  return await new Promise((resolve,reject)=>{
    canvas.toBlob(blob=>{
      if(!blob){reject(new Error('Gagal memproses foto WebP.'));return;}
      const r=new FileReader();
      r.onload=()=>resolve(r.result);
      r.onerror=reject;
      r.readAsDataURL(blob);
    },'image/webp',0.82);
  });
}

async function previewPhoto(input,previewId){
  const img=document.getElementById(previewId);
  if(!img)return;
  const file=input.files?.[0];
  if(!file){img.removeAttribute('src');img.style.display='none';return;}
  if(!/^image\/(jpeg|png|webp)$/i.test(file.type)){
    input.value='';
    alert('Format foto yang didukung: JPG, JPEG, PNG, atau WebP. Foto akan otomatis dikompresi menjadi WebP.');
    img.removeAttribute('src');img.style.display='none';
    return;
  }
  try{
    const compressed=await compressWebP(file);
    img.src=compressed;
    img.style.display='block';
  }catch(err){
    input.value='';
    alert(err.message||'Foto gagal diproses.');
    img.removeAttribute('src');img.style.display='none';
  }
}

function mapSupabaseRowForApp(r,fallback={}){
  return normalizeRecord({
    ...fallback,
    id:r?.id ?? fallback.id,
    jenis:r?.jenis ?? fallback.jenis ?? '',
    suami:r?.suami ?? fallback.suami ?? '', istri:r?.istri ?? fallback.istri ?? '',
    nama:r?.nama ?? fallback.nama ?? '', nik:r?.nik ?? fallback.nik ?? '',
    nikSuami:r?.nik_suami ?? fallback.nikSuami ?? '', nikIstri:r?.nik_istri ?? fallback.nikIstri ?? '',
    nomor:r?.nomor ?? fallback.nomor ?? '', tanggal:r?.tanggal ?? fallback.tanggal ?? '',
    tanggalAkad:r?.tanggal_akad ?? fallback.tanggalAkad ?? '', alamat:r?.alamat ?? fallback.alamat ?? '',
    alamatSuami:r?.alamat_suami ?? fallback.alamatSuami ?? '', alamatIstri:r?.alamat_istri ?? fallback.alamatIstri ?? '',
    jenisWali:r?.jenis_wali ?? fallback.jenisWali ?? '', namaWali:r?.nama_wali ?? fallback.namaWali ?? '',
    hubunganWali:r?.hubungan_wali ?? fallback.hubunganWali ?? '',
    waliHakim:r?.wali_hakim ?? r?.jenis_wali ?? fallback.waliHakim ?? fallback.jenisWali ?? '',
    sebabWaliHakim:r?.sebab_wali_hakim ?? fallback.sebabWaliHakim ?? '',
    status:r?.status ?? fallback.status ?? 'Belum Lengkap', statusSuami:r?.status_suami ?? fallback.statusSuami ?? '',
    statusIstri:r?.status_istri ?? fallback.statusIstri ?? '', asal:r?.asal ?? fallback.asal ?? '',
    tujuan:r?.tujuan ?? fallback.tujuan ?? '', nomorPutusan:r?.nomor_putusan ?? fallback.nomorPutusan ?? '',
    tanggalPutusan:r?.tanggal_putusan ?? fallback.tanggalPutusan ?? '', nomorPutusanPA:r?.nomor_putusan_pa ?? fallback.nomorPutusanPA ?? '',
    fotoSuami:r?.foto_suami ?? fallback.fotoSuami ?? '', fotoIstri:r?.foto_istri ?? fallback.fotoIstri ?? '',
    alasan:r?.alasan_pembatalan ?? fallback.alasan ?? '', keterangan:r?.keterangan ?? fallback.keterangan ?? '',
    sumberId:r?.sumber_id ?? fallback.sumberId ?? '', sumberJenis:r?.sumber_jenis ?? fallback.sumberJenis ?? '', sumberNomor:r?.sumber_nomor ?? fallback.sumberNomor ?? '',
    createdAt:r?.created_at ?? fallback.createdAt ?? '', updatedAt:r?.updated_at ?? fallback.updatedAt ?? ''
  },0);
}

async function loadSharedData(){
  try{
    const {data:rows,error}=await supabaseClient.from('arsip_nikah').select('*').order('created_at',{ascending:true});
    if(error){console.error('Supabase load:',error); return false;}
    if(Array.isArray(rows)){
      data=rows.map(r=>mapSupabaseRowForApp(r));
      save();
      renderAll();renderData();renderRecommendations();renderIsbat();renderWali();renderPembatalan();renderArchiveYearLists();renderReport();
      toast(`Data bersama dimuat: ${data.length} arsip`);
    }
    return true;
  }catch(e){console.error('Supabase load exception:',e);return false;}
}

async function saveSharedRecord(r,isEdit){
  const now=new Date().toISOString();
  const id=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(r.id||''))?r.id:crypto.randomUUID();
  const rec={id,jenis:r.jenis==='Rekomendasi Nikah'?'N Keluar':r.jenis==='Surat Wali'?'Surat Wali':r.jenis,suami:r.suami||null,istri:r.istri||null,nama:r.nama||null,nik:r.nik||null,nik_suami:r.nikSuami||null,nik_istri:r.nikIstri||null,nomor:r.nomor||null,tanggal:r.tanggal||null,tanggal_akad:r.tanggalAkad||null,alamat:r.alamat||null,alamat_suami:r.alamatSuami||null,alamat_istri:r.alamatIstri||null,alamat_wali:r.alamatWali||null,jenis_wali:r.jenisWali||r.waliHakim||null,nama_wali:r.namaWali||null,hubungan_wali:r.hubunganWali||null,wali_hakim:r.waliHakim||r.jenisWali||null,sebab_wali_hakim:r.sebabWaliHakim||null,status:r.status||'Belum Lengkap',status_suami:r.statusSuami||null,status_istri:r.statusIstri||null,asal:r.asal||null,tujuan:r.tujuan||null,nomor_putusan:r.nomorPutusan||null,tanggal_putusan:r.tanggalPutusan||null,nomor_putusan_pa:r.nomorPutusanPA||null,foto_suami:r.fotoSuami||null,foto_istri:r.fotoIstri||null,alasan_pembatalan:r.alasan||null,keterangan:r.keterangan||null,sumber_id:r.sumberId||null,sumber_jenis:r.sumberJenis||null,sumber_nomor:r.sumberNomor||null,created_at:r.createdAt||now,updated_at:now};
  const q=isEdit?supabaseClient.from('arsip_nikah').update(rec).eq('id',id).select('*').single():supabaseClient.from('arsip_nikah').insert(rec).select('*').single();
  const {data:out,error}=await q;
  if(error)throw error;
  if(!out)throw new Error('Database tidak mengembalikan data yang disimpan.');
  const canonical=mapSupabaseRowForApp(out,r);
  Object.keys(r).forEach(k=>delete r[k]);
  Object.assign(r,canonical);
  return r;
}

async function deleteSharedRecord(id){
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id||''))) return;
  const {error}=await supabaseClient.from('arsip_nikah').delete().eq('id',id); if(error) throw error;
}

async function saveData(e){
 e.preventDefault();
 const type=document.getElementById('jenis').value; const get=id=>document.getElementById(id)?.value||'';
 try{
   const nomor=get('nomor').trim();
   // Saat edit, sebab Wali Hakim yang sudah tersimpan tidak boleh hilang hanya karena form kosong.
   if(type==='Surat Wali' && editingIndex>=0 && !get('sebabWaliHakim')){ const oldWali=data[editingIndex]; if(oldWali?.sebabWaliHakim) { const el=document.getElementById('sebabWaliHakim'); if(el) el.value=oldWali.sebabWaliHakim; } }
   if(nomor){
     const duplicate=data.findIndex((x,i)=>i!==editingIndex&&String(x.nomorSurat||x.nomor||'').trim().toLowerCase()===nomor.toLowerCase());
     if(duplicate>=0){ alert(`Nomor surat/dokumen "${nomor}" sudah digunakan pada data lain. Gunakan nomor yang berbeda.`); return; }
   }
   const old=editingIndex>=0?data[editingIndex]:null;
   if(type==='Pembatalan Nikah'){
     const sumberId=get('sumberId');
     const duplicateSource=data.findIndex((x,i)=>i!==editingIndex && x.jenis==='Pembatalan Nikah' && sumberId && String(x.sumberId)===String(sumberId));
     if(duplicateSource>=0){ alert('Data sumber tersebut sudah digunakan untuk Pembatalan Nikah. Satu referensi hanya dapat digunakan satu kali.'); return; }
   }
   const newFotoSuami=await fileToDataURL('fotoSuami');
   const newFotoIstri=await fileToDataURL('fotoIstri');
   const now=new Date().toISOString();
   const recordId=old?.id||makeId();
   let fotoSuami=old?.fotoSuami||'';
   let fotoIstri=old?.fotoIstri||'';
   if(newFotoSuami) fotoSuami=await uploadPhotoToStorage(newFotoSuami,recordId,'suami');
   if(newFotoIstri) fotoIstri=await uploadPhotoToStorage(newFotoIstri,recordId,'istri');
   const obj={
     id:recordId,jenis:type,
     suami:get('suami')||old?.suami||'',istri:get('istri')||old?.istri||'',nama:get('nama')||old?.nama||'',nik:get('nik')||old?.nik||'',
     nikSuami:get('nikSuami')||old?.nikSuami||'',nikIstri:get('nikIstri')||old?.nikIstri||'',
     namaWali:get('namaWali')||old?.namaWali||'',hubunganWali:get('hubunganWali')||old?.hubunganWali||'',
     waliHakim:get('waliHakim')||old?.waliHakim||'',sebabWaliHakim:get('sebabWaliHakim')||old?.sebabWaliHakim||'',statusSuami:get('statusSuami')||old?.statusSuami||'',statusIstri:get('statusIstri')||old?.statusIstri||'',
     tanggal:get('tanggal')||old?.tanggal||'',nomor:nomor||old?.nomor||'',
     alamat:get('alamat')||old?.alamat||'',alamatSuami:get('alamatSuami')||old?.alamatSuami||'',alamatIstri:get('alamatIstri')||old?.alamatIstri||'',alamatWali:get('alamatWali')||old?.alamatWali||'',
     status:get('status')||old?.status||'Belum Lengkap',asal:get('asal')||old?.asal||'',tujuan:get('tujuan')||old?.tujuan||'',
     tanggalAkad:get('tanggalAkad')||old?.tanggalAkad||'',nomorPutusan:get('nomorPutusan')||old?.nomorPutusan||'',tanggalPutusan:get('tanggalPutusan')||old?.tanggalPutusan||'',
     jenisWali:get('jenisWali')||get('waliHakim')||old?.jenisWali||old?.waliHakim||'',nomorPutusanPA:get('nomorPutusanPA')||old?.nomorPutusanPA||'',
     fotoSuami,fotoIstri,
     alasan:get('alasan')||old?.alasan||'',keterangan:get('keterangan')||old?.keterangan||'',
     sumberId:type==='Pembatalan Nikah'?(get('sumberId')||old?.sumberId||''):old?.sumberId||'',
     sumberJenis:type==='Pembatalan Nikah'?(data.find(x=>String(x.id)===String(get('sumberId')))?.jenis||old?.sumberJenis||''):old?.sumberJenis||'',
     sumberNomor:type==='Pembatalan Nikah'?(get('sumberNomor')||old?.sumberNomor||''):old?.sumberNomor||'',
     createdAt:old?.createdAt||now,updatedAt:old?now:''
   };
   try{ await saveSharedRecord(obj,editingIndex>=0); }catch(remoteErr){ console.error(remoteErr); alert('Data belum tersimpan di database bersama.\n\n'+(remoteErr.message||remoteErr.code||remoteErr)); return; }
   if(editingIndex>=0){ data[editingIndex]=obj; toast('Data '+type+' berhasil diperbarui'); }
   else { data.push(obj); toast('Data '+type+' berhasil disimpan'); }
   save(); editingIndex=-1; e.target.reset(); closeModal();
   renderAll();renderData();renderRecommendations();renderIsbat();renderWali();renderPembatalan();renderArchiveYearLists();renderReport();
 }catch(err){ alert(err.message||'Data gagal disimpan.'); }
}
function fillEditForm(x){
  const ids=['suami','istri','nama','nik','nikSuami','nikIstri','sumberId','sumberNomor','namaWali','hubunganWali','waliHakim','sebabWaliHakim','statusSuami','statusIstri','tanggal','nomor','alamat','alamatSuami','alamatIstri','alamatWali','status','asal','tujuan','tanggalAkad','nomorPutusanPA','alasan','keterangan'];
  ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=x[id]??'';});
  const wali=document.getElementById('waliHakim');
  if(wali)wali.value=x.waliHakim||x.jenisWali||'Wali Nasab';
  const sebab=document.getElementById('sebabWaliHakim');
  if(sebab)sebab.value=x.sebabWaliHakim??'';
  ['fotoSuami','fotoIstri'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const p1=document.getElementById('previewSuami'),p2=document.getElementById('previewIstri');
  if(p1){if(x.fotoSuami){p1.src=x.fotoSuami;p1.style.display='block';}else{p1.removeAttribute('src');p1.style.display='none';}}
  if(p2){if(x.fotoIstri){p2.src=x.fotoIstri;p2.style.display='block';}else{p2.removeAttribute('src');p2.style.display='none';}}
  if(x.jenis==='Pembatalan Nikah'){ const src=document.getElementById('sumberId'); if(src)src.value=x.sumberId||''; fillPembatalanSource(x.sumberId||''); }
  if(x.jenis==='N Masuk'||x.jenis==='N Keluar'){ const a=document.getElementById('alamatSuami'); const b=document.getElementById('alamatIstri'); if(a)a.value=x.alamatSuami||x.alamat||''; if(b)b.value=x.alamatIstri||x.alamat||''; }
  if(x.jenis==='N Masuk'||x.jenis==='Surat Wali')toggleWaliFields();
  if(x.jenis==='Surat Wali' && sebab)sebab.value=x.sebabWaliHakim??'';
}

async function editRecord(index){
  let x=data[index];
  if(!x)return;
  closeDetailModal();

  // Selalu ambil record lengkap terbaru dari Supabase sebelum membuka form edit.
  // Field kosong di database juga harus dianggap sebagai nilai resmi, bukan diganti
  // dengan nilai lama dari localStorage.
  if(x.id && typeof supabaseClient!=='undefined'){
    try{
      const {data:remote,error}=await supabaseClient.from('arsip_nikah').select('*').eq('id',x.id).maybeSingle();
      if(error)throw error;
      if(!remote)throw new Error('Data tidak ditemukan di database bersama.');
      x=mapSupabaseRowForApp(remote,x);
      data[index]=x;
      save();
    }catch(err){
      console.error('Gagal mengambil data edit dari Supabase:',err);
      alert('Data terbaru dari database bersama tidak dapat dibaca. Form edit dibatalkan agar data tidak tertimpa.');
      return;
    }
  }

  editingIndex=index;
  openModal(x.jenis);
  document.getElementById('modalTitle').textContent='Ubah '+typeLabel(x.jenis);
  fillEditForm(x);
}

async function delData(i){
 if(!data[i])return;
 const record=data[i];
 const nama=personLabel(record);
 if(!confirm(`Hapus data "${nama}"? Data yang dihapus tidak dapat dipulihkan kecuali tersedia backup.`))return;
 try{
   if(record.id && typeof supabaseClient!=='undefined'){
     await deleteSharedRecord(record.id);
     // Pastikan baris benar-benar sudah tidak terbaca dari database bersama.
     const {data:check,error:checkError}=await supabaseClient.from('arsip_nikah').select('id').eq('id',record.id).maybeSingle();
     if(checkError)throw checkError;
     if(check)throw new Error('Database belum mengonfirmasi penghapusan data.');
   }
   data.splice(i,1);
   save();
   renderAll();renderData();renderRecommendations();renderIsbat();renderWali();renderPembatalan();renderArchiveYearLists();renderReport();
   toast('Data berhasil dihapus dari database bersama');
 }catch(err){
   console.error('Gagal menghapus data dari Supabase:',err);
   alert('Data TIDAK dihapus dari aplikasi karena penghapusan di database bersama gagal.\n\n'+(err.message||err.code||err));
 }
}
function toast(t){const x=document.getElementById('toast');x.textContent=t;x.style.display='block';setTimeout(()=>x.style.display='none',2200)}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

const AUTH_KEY='myarsip_nikah_auth_v1';
const DEMO_EMAIL='admin@myarsipnikah.id';
const DEMO_PASSWORD='admin123';
// Login hanya berlaku selama sesi tab/browser. Menutup tab/browser akan mengharuskan login kembali.
function isAuthenticated(){return sessionStorage.getItem(AUTH_KEY)==='1';}
function showAuth(){document.getElementById('authScreen').classList.add('show');document.querySelector('.app').style.display='none';}
function hideAuth(){document.getElementById('authScreen').classList.remove('show');document.querySelector('.app').style.display='flex';}
function login(e){
  e.preventDefault();
  const email=document.getElementById('loginEmail').value.trim();
  const password=document.getElementById('loginPassword').value;
  const err=document.getElementById('authError');
  const validConfig = APP_LOGIN && APP_LOGIN.email && APP_LOGIN.password && email.toLowerCase() === APP_LOGIN.email.toLowerCase() && password === APP_LOGIN.password;
  const validDemo = (email === DEMO_EMAIL || email === 'admin') && password === DEMO_PASSWORD;
  if(validConfig || validDemo){
    sessionStorage.setItem(AUTH_KEY,'1');
    err.textContent='';
    hideAuth();
    if(typeof toast==='function') toast('Login berhasil. Selamat datang!');
  }else{
    err.textContent='Email/username atau password salah.';
  }
}
const SETTINGS_KEY='myarsip_nikah_settings_v1';
function getSettings(){
  try{return {...{fontSize:'normal',theme:'white'},...(JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')||{})};}
  catch{return {fontSize:'normal'};}
}
function applySettings(){
  const fontSize=document.getElementById('fontSizeSetting')?.value||'normal';
  const theme=document.getElementById('themeSetting')?.value||'white';
  const confirmLogout=!!document.getElementById('confirmLogoutSetting')?.checked;
  localStorage.setItem(SETTINGS_KEY,JSON.stringify({fontSize,theme,confirmLogout}));
  document.documentElement.classList.toggle('settings-large-text',fontSize==='large');
  document.documentElement.dataset.theme=theme;
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=theme==='dark'?'#121716':(theme==='vintage'?'#5b402a':(theme==='matcha'?'#466044':(theme==='mega-mendung'?'#164978':'#0f6b5f')));
  updateSettingsStatus();
}
function loadSettings(){
  const st=getSettings();
  document.documentElement.classList.toggle('settings-large-text',st.fontSize==='large');
  document.documentElement.dataset.theme=st.theme||'white';
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=st.theme==='dark'?'#121716':(st.theme==='vintage'?'#5b402a':(st.theme==='matcha'?'#466044':(st.theme==='mega-mendung'?'#164978':'#0f6b5f')));
  const f=document.getElementById('fontSizeSetting'); if(f)f.value=st.fontSize;
  const t=document.getElementById('themeSetting'); if(t)t.value=st.theme||'white';
  const c=document.getElementById('confirmLogoutSetting'); if(c)c.checked=st.confirmLogout;
  updateSettingsStatus();
}
function updateSettingsStatus(){
  const el=document.getElementById('settingsDataStatus');
  if(!el)return;
  const bytes=new Blob([localStorage.getItem(KEY)||'[]']).size;
  const kb=(bytes/1024).toFixed(1);
  el.textContent=`${data.length} data tersimpan • sekitar ${kb} KB • penyimpanan lokal perangkat`;
}
function openLogoutModal(){
  const modal=document.getElementById('logoutModal');
  if(!modal)return;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}
function closeLogoutModal(){
  const modal=document.getElementById('logoutModal');
  if(!modal)return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
}
function confirmLogout(){
  closeLogoutModal();
  sessionStorage.removeItem(AUTH_KEY);
  document.getElementById('loginEmail').value='';
  document.getElementById('loginPassword').value='';
  document.getElementById('authError').textContent='';
  showAuth();
}
function openP3NProfile(){
  const modal=document.getElementById('p3nProfileModal');
  if(!modal)return;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}
function closeP3NProfile(){
  const modal=document.getElementById('p3nProfileModal');
  if(!modal)return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
}
function logout(){openLogoutModal();}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeP3NProfile();
});
if(isAuthenticated())hideAuth();else showAuth();

renderAll();
renderData();
renderRecommendations();
renderIsbat();
renderWali();
renderPembatalan();
renderArchiveYearLists();
renderReport();
loadSettings();
loadSharedData();