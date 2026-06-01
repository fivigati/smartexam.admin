// Variable global untuk diffing (mencegah tabel berkedip)
let lastSessionsDataHash = "";

async function loadSessions(showLoading = false) {
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  if (!user) { window.location.href = 'index.html'; return; }

  const table = document.getElementById('sessionTable');
  if (!table) return;

  // Tampilkan loading HANYA saat pertama kali / dipaksa
  if (showLoading) {
    lastSessionsDataHash = ""; 
    table.innerHTML = `<tr><td colspan="6" class="py-16 text-center"><div class="flex flex-col items-center justify-center text-slate-400 animate-pulse"><i data-lucide="loader-circle" class="w-10 h-10 mb-2 animate-spin text-indigo-500"></i><p class="text-sm font-medium">Sedang memantau sesi...</p></div></td></tr>`;
    lucide.createIcons();
  }

  // --- CEK PLAN: TAMPILKAN BANNER JIKA BUKAN PREMIUM ---
  if (user.plan_type && user.plan_type.toLowerCase().trim() !== 'premium') {
    table.innerHTML = `
      <tr>
        <td colspan="6" class="py-16 text-center">
          <div class="flex flex-col items-center justify-center p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl mx-4">
            <div class="text-5xl mb-3">🔒</div>
            <h3 class="text-lg font-bold text-slate-800">Fitur Premium Terkunci</h3>
            <p class="text-sm text-slate-500 max-w-sm mt-2">Data sesi langsung secara real-time hanya tersedia untuk akun Pro. Silakan upgrade untuk membuka akses.</p>
          </div>
        </td>
      </tr>
    `;
    return; 
  }

  // Ambil Data dari API
  const result = await apiRequest({
    action: 'getLiveSessions',
    school_npsn: user.school_npsn
  });

  if (!result.success) return;

  // --- OPTIMASI ANTI KEDIP (DATA DIFFING) ---
  const currentDataHash = JSON.stringify(result.data);
  if (!showLoading && currentDataHash === lastSessionsDataHash) {
    return; // Berhenti jika data masih sama (tidak ada perubahan dari server)
  }
  lastSessionsDataHash = currentDataHash;

  // Jika Data Kosong
  if (!result.data || result.data.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="6" class="py-16 text-center text-slate-400">
          <i data-lucide="monitor-off" class="w-12 h-12 mx-auto mb-3 text-slate-300"></i>
          <p class="text-sm font-semibold text-slate-600">Tidak ada sesi ujian aktif</p>
          <p class="text-xs mt-1">Belum ada siswa yang login ke dalam ujian.</p>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  // --- RENDER DATA DENGAN BUFFER ---
  let tableContent = '';
  result.data.forEach(session => {
    tableContent += `
      <tr class="hover:bg-slate-50 transition-all border-b border-slate-100">
        <td class="px-6 py-4">
          <p class="text-sm font-semibold text-slate-800">${session.student_name}</p>
          <p class="text-xs text-slate-400">${session.student_class} • ${session.student_room}</p>
        </td>
        
        <td class="px-6 py-4 text-sm text-slate-600 font-medium">
          ${session.subject_name || session.exam_id || '-'}
        </td>

        <td class="px-6 py-4">
          <!-- HANYA MENAMPILKAN LAST STATUS SESUAI PERMINTAAN -->
          ${renderStatus(session.last_status || session.last_session)}
        </td>

        <td class="px-6 py-4 text-sm text-slate-600">
          <div class="flex items-center gap-2">
            <i data-lucide="smartphone" class="w-4 h-4 text-slate-400"></i>
            <span>${parseDeviceInfo(session.device_info)}</span>
          </div>
        </td>

        <td class="px-6 py-4 text-xs text-slate-500">
          ${formatLastSeen(session.last_seen)}
        </td>

        <td class="px-6 py-4 text-center">
          <button onclick="deleteSession('${session.id}')" class="rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-all">
            Reset
          </button>
        </td>
      </tr>
    `;
  });

  table.innerHTML = tableContent;
  lucide.createIcons();
  universalFilterSession(); // Jalankan filter jika sedang ada pencarian
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
async function deleteSession(nisn, name) {
  // Tambahkan konfirmasi nama agar admin yakin tidak salah klik
  if (!confirm(`Peringatan: Mereset sesi akan membuat ${name} (NISN: ${nisn}) ter-logout dan harus login kembali. Lanjutkan?`)) return;

  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  // Kirim student_nisn ke backend (pastikan backend menangkap parameter ini)
  await apiRequest({ action: 'deleteSession', student_nisn: nisn, school_npsn: user.school_npsn });
  loadSessions(true);
}

async function deleteAllSessions() {
  if (!confirm('BAHAYA: Anda yakin ingin menghapus SELURUH sesi aktif? Semua siswa akan ter-logout paksa.')) return;

  const user = JSON.parse(localStorage.getItem('smart_exam_user'));
  await apiRequest({ action: 'deleteAllSessions', school_npsn: user.school_npsn });
  loadSessions(true);
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
