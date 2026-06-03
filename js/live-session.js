// Variable global untuk diffing (mencegah tabel berkedip)
let lastSessionsDataHash = "";
let currentSessionPage = 1;
const sessionItemsPerPage = 30; // 30 siswa per halaman

async function loadSessions(showLoading = false) {
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  if (!user) { window.location.href = 'index.html'; return; }

  const table = document.getElementById('sessionTable');
  if (!table) return;

  if (showLoading) {
    lastSessionsDataHash = ""; 
    table.innerHTML = `<tr><td colspan="6" class="py-16 text-center"><div class="flex flex-col items-center justify-center text-slate-400 animate-pulse"><i data-lucide="loader-circle" class="w-10 h-10 mb-2 animate-spin text-indigo-500"></i><p class="text-sm font-medium">Sedang memantau sesi...</p></div></td></tr>`;
    lucide.createIcons();
  }

  // Cek Plan
  if (user.plan_type && user.plan_type.toLowerCase().trim() !== 'premium') {
    table.innerHTML = `<tr><td colspan="6" class="py-16 text-center">Fitur Premium Terkunci</td></tr>`;
    return; 
  }

  const result = await apiRequest({ action: 'getLiveSessions', school_npsn: user.school_npsn });
  if (!result.success) return;

  // --- 1. OPTIMASI ANTI KEDIP (Pindahkan ke sini, SEBELUM render) ---
  const currentDataHash = JSON.stringify(result.data);
  if (!showLoading && currentDataHash === lastSessionsDataHash) return; 
  lastSessionsDataHash = currentDataHash;

  // --- 2. PAGINATION LOGIC ---
  const allSessions = result.data || [];
  const totalItems = allSessions.length;
  const totalPages = Math.ceil(totalItems / sessionItemsPerPage) || 1;
  
  if (currentSessionPage > totalPages) currentSessionPage = totalPages;
  if (currentSessionPage < 1) currentSessionPage = 1;
  
  const startIndex = (currentSessionPage - 1) * sessionItemsPerPage;
  const paginatedData = allSessions.slice(startIndex, startIndex + sessionItemsPerPage);

  // --- 3. RENDER DATA ---
  if (allSessions.length === 0) {
    table.innerHTML = `<tr><td colspan="6" class="py-16 text-center text-slate-400">Tidak ada sesi aktif</td></tr>`;
    return;
  }

  let tableContent = '';
  paginatedData.forEach(session => {
    tableContent += `
      <tr class="hover:bg-slate-50 transition-all border-b border-slate-100">
        <td class="px-6 py-4">
          <p class="text-sm font-semibold text-slate-800">${session.student_name}</p>
          <p class="text-xs text-slate-400">${session.student_class} • ${session.student_room}</p>
        </td>
        <td class="px-6 py-4 text-sm text-slate-600 font-medium">${session.subject_name || session.exam_id || '-'}</td>
        <td class="px-6 py-4">${renderStatus(session.last_status || session.last_session)}</td>
        <td class="px-6 py-4 text-sm text-slate-600">
          <div class="flex items-center gap-2">
            <i data-lucide="smartphone" class="w-4 h-4 text-slate-400"></i>
            <span>${parseDeviceInfo(session.device_info)}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-xs text-slate-500">${formatLastSeen(session.last_seen)}</td>
        <td class="px-6 py-4 text-center">
          <button onclick="deleteSession('${session.student_nisn}')" class="rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-all">Reset</button>
        </td>
      </tr>
    `;
  });

  // --- 4. TAMBAHKAN KONTROL PAGINATION ---
  tableContent += `
    <tr>
      <td colspan="6" class="px-6 py-4 bg-slate-50 border-t border-slate-100">
        <div class="flex items-center justify-between text-xs text-slate-500">
          <span>Halaman ${currentSessionPage} dari ${totalPages} (${totalItems} total)</span>
          <div class="flex gap-2">
            <button onclick="changeSessionPage(-1)" ${currentSessionPage === 1 ? 'disabled' : ''} class="px-3 py-1 bg-white border rounded shadow-sm disabled:opacity-50">Prev</button>
            <button onclick="changeSessionPage(1)" ${currentSessionPage === totalPages ? 'disabled' : ''} class="px-3 py-1 bg-white border rounded shadow-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      </td>
    </tr>
  `;

  table.innerHTML = tableContent;
  lucide.createIcons();
  universalFilterSession();
}

// ==========================================
// FUNGSI PENDUKUNG UI BADGE
// ==========================================
function parseDeviceInfo(deviceInfo) {
  if (!deviceInfo) return 'Unknown Device';
  const info = deviceInfo.toLowerCase();
  if (info.includes('win32')) return 'Windows PC';
  if (info.includes('linux arm') || info.includes('android')) return 'Android Mobile';
  if (info.includes('iphone') || info.includes('mac')) return 'Apple Device';
  return deviceInfo;
}

function formatLastSeen(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return '<span class="text-emerald-500 font-medium">Baru saja</span>';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds/60)} menit yang lalu`;
  return date.toLocaleString('id-ID', { hour: '2-digit', minute:'2-digit' });
}

function renderStatus(statusValue) {
  // Ambil teks dari Sheets, jadikan huruf kecil untuk pencocokan yang aman
  const s = String(statusValue || '').toLowerCase();
  
  // Font diubah jadi text-[11px] font-semibold (Tanpa tracking-wide / ALL CAPS) agar estetik
  
  // 🟢 Online
  if (s.includes('online')) {
    return `<div class="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">🟢 Online</div>`;
  }
  
  // ✅ Selesai
  if (s.includes('selesai')) {
    return `<div class="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">✅ Selesai</div>`;
  }
  
  // ⛔ Dikeluarkan
  if (s.includes('dikeluarkan')) {
    return `<div class="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600">⛔ Dikeluarkan</div>`;
  }
  
  // ⏳ Waktu Habis
  if (s.includes('waktu habis')) {
    return `<div class="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">⏳ Waktu Habis</div>`;
  }

  // ⚠️ Keluar Laman
  if (s.includes('keluar dari laman')) {
    return `<div class="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">⚠️ Keluar Laman</div>`;
  }

  // 🔴 Offline
  if (s.includes('offline')) {
    return `<div class="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">🔴 Offline</div>`;
  }

  // Fallback (jika datanya "⚪" atau kosong)
  return `<div class="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400">⚪ Belum Mulai</div>`;
}

// ==========================================
// FUNGSI PENCARIAN UNIVERSAL
// ==========================================
function universalFilterSession() {
  const searchInput = document.getElementById('searchUniversalSession');
  if(!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase();
  const table = document.getElementById('sessionTable');
  const rows = table.querySelectorAll('tr');
  let visibleCount = 0;

  rows.forEach(row => {
    if (row.id === 'no-data-session-row') return;

    const rowText = row.innerText.toLowerCase();
    if (rowText.includes(searchTerm)) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  const existingNoData = document.getElementById('no-data-session-row');
  if (existingNoData) existingNoData.remove();

  if (visibleCount === 0) {
    const noDataRow = document.createElement('tr');
    noDataRow.id = 'no-data-session-row';
    noDataRow.innerHTML = `<td colspan="6" class="py-10 text-center text-slate-400 text-sm">Siswa tidak ditemukan</td>`;
    table.appendChild(noDataRow);
  }
}

// ==========================================
// FUNGSI AKSI API
// ==========================================
async function deleteSession(nisn) { 
  if (!confirm(`Yakin ingin mereset sesi siswa NISN: ${nisn}?`)) return;

  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  
  // Mengirim student_nisn agar cocok dengan backend
  const res = await apiRequest({ 
    action: 'deleteSession', 
    student_nisn: nisn, 
    school_npsn: user.school_npsn 
  });

  if (res && res.success) {
    loadSessions(true); 
  } else {
    alert("Gagal mereset: " + (res.message || "Error tidak diketahui"));
  }
}

async function deleteAllSessions() {
  if (!confirm('BAHAYA: Anda yakin ingin menghapus SELURUH sesi aktif? Semua siswa akan ter-logout paksa.')) return;

  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  await apiRequest({ action: 'deleteAllSessions', school_npsn: user.school_npsn });
  loadSessions(true);
}

function changeSessionPage(dir) {
  currentSessionPage += dir;
  loadSessions(false); // Render ulang tanpa loading animasi
}
  
// ==========================================
// INISIALISASI & AUTO-REFRESH
// ==========================================
loadSessions(true);

setInterval(() => {
  const searchInput = document.getElementById('searchUniversalSession');
  // Hanya lakukan refresh otomatis jika kotak pencarian kosong agar tidak mengganggu admin yang sedang mencari
  if (!searchInput || searchInput.value === "") loadSessions(false);
}, 5000);
