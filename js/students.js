// Konfigurasi Paginasi & State
let currentPage = 1;
const itemsPerPage = 32;
let selectedSiswa = new Set(); // Menyimpan NISN yang dicentang

// Ambil Data
async function loadDataSiswa() {
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    if (!user || !user.school_npsn) return;

    const result = await apiRequest({
        action: 'getStudents',
        school_npsn: user.school_npsn
    });

    if (result && result.success) {
        window.allStudentsData = result.data; // <--- Master Data Permanen
        window.currentFilteredData = [...result.data]; 
        currentPage = 1;
        selectedSiswa.clear();
        updateTabelDanPaginasi();
    }
}

// Render Tabel Siswa (dengan Paginasi)
function updateTabelDanPaginasi() {
    const dataList = window.currentFilteredData || [];
    const tbody = document.getElementById('siswa-tbody');
    const pageInfo = document.getElementById('paginationInfo');
    
    // Hitung Paginasi
    const totalItems = dataList.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, totalItems);
    const paginatedData = dataList.slice(start, end);

    // Update Teks Info
    pageInfo.innerText = totalItems === 0 
        ? `Menampilkan 0 data` 
        : `Menampilkan ${start + 1} - ${end} dari ${totalItems} siswa (Hal ${currentPage}/${totalPages})`;

    // Reset Master Checkbox di Halaman Ini
    document.getElementById('checkAllSiswa').checked = false;
    updateTombolHapusBulk();

    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-400 text-sm">Data siswa tidak ditemukan.</td></tr>`;
        return;
    }

    tbody.innerHTML = paginatedData.map(s => {
        const isActive = s.account_status?.toString().toLowerCase() === 'active';
        const isChecked = selectedSiswa.has(s.nisn.toString()) ? 'checked' : '';
        
        let statusHtml = isActive 
            ? `<div class="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs text-emerald-600 border border-emerald-100"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Aktif</div>`
            : `<button onclick="bukaBlokir('${s.nisn}', '${s.full_name}')" class="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-xs text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors shadow-sm"><i data-lucide="lock" class="w-3.5 h-3.5"></i> Terblokir</button>`;

        return `
        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 ${isChecked ? 'bg-indigo-50/30' : ''}">
            <td class="px-4 py-3 text-center">
                <input type="checkbox" value="${s.nisn}" onchange="toggleCheckRow(this)" ${isChecked} class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 checkbox-siswa">
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                        ${s.pic_url ? `<img src="${s.pic_url}" class="w-full h-full object-cover">` : `<i data-lucide="user" class="w-5 h-5 text-slate-400"></i>`}
                    </div>
                    <span class="text-sm text-slate-700">${s.nisn}</span>
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="text-sm text-slate-700">${s.full_name}</div>
                <div class="text-xs text-slate-400 mt-0.5">${s.class_name || '-'} • ${s.room_name || '-'}</div>
            </td>
            <td class="px-4 py-3 text-xs text-slate-500">${s.description || '-'}</td>
            <td class="px-4 py-3 text-center">${statusHtml}</td>
            <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                    <button onclick='bukaModalEdit(${JSON.stringify(s)})' class="p-1.5 rounded-md text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Edit"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button onclick="hapusSiswa('${s.nisn}')" class="p-1.5 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
    lucide.createIcons();
}

function changePage(delta) {
    currentPage += delta;
    updateTabelDanPaginasi();
}

// --- LOGIKA CHECKBOX & BULK DELETE ---
function toggleCheckAll(el) {
    const checkboxes = document.querySelectorAll('.checkbox-siswa');
    checkboxes.forEach(cb => {
        cb.checked = el.checked;
        if(el.checked) selectedSiswa.add(cb.value);
        else selectedSiswa.delete(cb.value);
        cb.closest('tr').classList.toggle('bg-indigo-50/30', el.checked);
    });
    updateTombolHapusBulk();
}

function toggleCheckRow(el) {
    if(el.checked) selectedSiswa.add(el.value);
    else selectedSiswa.delete(el.value);
    el.closest('tr').classList.toggle('bg-indigo-50/30', el.checked);
    updateTombolHapusBulk();
}

function updateTombolHapusBulk() {
    const btn = document.getElementById('btnHapusTerpilih');
    const txt = document.getElementById('textHapusTerpilih');
    if (selectedSiswa.size > 0) {
        btn.classList.remove('hidden');
        btn.classList.add('flex');
        txt.innerText = `Hapus (${selectedSiswa.size})`;
    } else {
        btn.classList.add('hidden');
        btn.classList.remove('flex');
    }
}

async function hapusTerpilih() {
    if(selectedSiswa.size === 0) return;
    if(!confirm(`Yakin ingin menghapus ${selectedSiswa.size} siswa terpilih?`)) return;

    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const btn = document.getElementById('btnHapusTerpilih');
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Menghapus...`;
    
    const result = await apiRequest({
        action: 'deleteBulkStudents',
        school_npsn: user.school_npsn,
        nisn_list: Array.from(selectedSiswa)
    });

    if (result && result.success) {
        loadDataSiswa();
    } else {
        alert("Gagal menghapus: " + (result?.message || 'Error server'));
        updateTombolHapusBulk();
    }
}

// --- FUNGSI EDIT & UPLOAD FOTO ---
let base64FotoBaru = null;

function bukaModalEdit(siswa) {
    document.getElementById('editOldNisn').value = siswa.nisn;
    document.getElementById('editOldPicUrl').value = siswa.pic_url || '';
    document.getElementById('editNisn').value = siswa.nisn;
    document.getElementById('editTingkat').value = siswa.grade_level || '';
    document.getElementById('editNama').value = siswa.full_name;
    document.getElementById('editKelas').value = siswa.class_name || '';
    document.getElementById('editRuang').value = siswa.room_name || '';
    document.getElementById('editKeterangan').value = siswa.description || '';
    
    const preview = document.getElementById('previewFotoEdit');
    if(siswa.pic_url) preview.innerHTML = `<img src="${siswa.pic_url}" class="w-full h-full object-cover">`;
    else preview.innerHTML = `<i data-lucide="image" class="w-6 h-6 text-slate-400"></i>`;
    lucide.createIcons();

    base64FotoBaru = null;
    document.getElementById('editFotoFile').value = '';
    document.getElementById('modalEditSiswa').classList.remove('hidden');
}

function tutupModalEdit() {
    document.getElementById('modalEditSiswa').classList.add('hidden');
}

function previewUploadFoto(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            base64FotoBaru = e.target.result;
            document.getElementById('previewFotoEdit').innerHTML = `<img src="${base64FotoBaru}" class="w-full h-full object-cover">`;
        }
        reader.readAsDataURL(file);
    }
}

async function simpanEditSiswa(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSimpanEdit');
    const oriText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Menyimpan...`;
    btn.disabled = true;

    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    
    const payload = {
        action: 'editStudent',
        school_npsn: user.school_npsn,
        old_nisn: document.getElementById('editOldNisn').value,
        old_pic_url: document.getElementById('editOldPicUrl').value,
        nisn: document.getElementById('editNisn').value,
        grade_level: document.getElementById('editTingkat').value,
        full_name: document.getElementById('editNama').value,
        class_name: document.getElementById('editKelas').value,
        room_name: document.getElementById('editRuang').value,
        description: document.getElementById('editKeterangan').value,
        new_photo_base64: base64FotoBaru // Dikirim ke backend jika ada
    };

    const result = await apiRequest(payload);

    if (result && result.success) {
        tutupModalEdit();
        loadDataSiswa();
    } else {
        alert("Gagal menyimpan data: " + (result?.message || 'Error server'));
    }
    
    btn.innerHTML = oriText;
    btn.disabled = false;
}

// Fitur Pencarian & Buka Blokir
function filterStudents() {
    const keyword = document.getElementById('searchUniversalStudents').value.toLowerCase();
    
    window.currentFilteredData = window.allStudentsData.filter(s => 
        (s.nisn || '').toString().toLowerCase().includes(keyword) ||
        (s.full_name || '').toLowerCase().includes(keyword) ||
        (s.class_name || '').toLowerCase().includes(keyword) ||
        (s.room_name || '').toLowerCase().includes(keyword)
    );
    currentPage = 1; 
    updateTabelDanPaginasi();
}

async function hapusSiswa(nisn) {
    if(!confirm(`Yakin ingin menghapus siswa dengan NISN ${nisn}?`)) return;
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const result = await apiRequest({ action: 'deleteBulkStudents', school_npsn: user.school_npsn, nisn_list: [nisn] });
    if (result && result.success) loadDataSiswa();
}

async function bukaBlokir(nisn, namaSiswa) {
    if (!confirm(`Aktifkan akun dan hapus seluruh sesi pelanggaran untuk ${namaSiswa}?`)) return;
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const result = await apiRequest({ action: 'resetViolationStudent', student_nisn: nisn, school_npsn: user.school_npsn });
    if (result && result.success) loadDataSiswa(); 
}

// Hapus filter/semua yang tertampil (fungsi bawaan lama)
async function hapusTampilan() {
    if(!confirm("Yakin ingin menghapus seluruh data siswa yang sedang tertampil?")) return;
    const nisnListTertampil = window.currentFilteredData.map(s => s.nisn);
    if(nisnListTertampil.length === 0) return;
    
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const result = await apiRequest({ action: 'deleteBulkStudents', school_npsn: user.school_npsn, nisn_list: nisnListTertampil });
    if (result && result.success) loadDataSiswa();
}

function bukaModalImport() {
    document.getElementById('importTingkat').value = '';
    document.getElementById('importDataArea').value = '';
    document.getElementById('modalImportSiswa').classList.remove('hidden');
}

function tutupModalImport() {
    document.getElementById('modalImportSiswa').classList.add('hidden');
}

async function simpanImportSiswa(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSimpanImport');
    const oriText = btn.innerHTML;
    
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const rawData = document.getElementById('importDataArea').value;
    const gradeLevel = document.getElementById('importTingkat').value;

    // Parsing data dari Excel/Sheets
    // Baris dipisah dengan \n, dan Kolom dipisah dengan \t (Tab)
    const rows = rawData.split('\n').map(row => row.trim()).filter(row => row !== '');
    
    const studentsToImport = rows.map(row => {
        const cols = row.split('\t');
        return {
            nisn: cols[0] ? cols[0].trim() : '',
            full_name: cols[1] ? cols[1].trim() : '',
            class_name: cols[2] ? cols[2].trim() : '',
            room_name: cols[3] ? cols[3].trim() : '',
            description: cols[4] ? cols[4].trim() : ''
        };
    }).filter(s => s.nisn !== '' && s.full_name !== ''); // Tolak jika format kacau

    if(studentsToImport.length === 0) {
        alert("Data kosong atau format salah! Pastikan kamu copy langsung dari Excel.");
        return;
    }

    if(!confirm(`Ditemukan ${studentsToImport.length} data siswa yang siap di-import. Lanjutkan?`)) return;

    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Mengimpor...`;
    btn.disabled = true;

    const payload = {
        action: 'importStudents',
        school_npsn: user.school_npsn,
        grade_level: gradeLevel,
        students: studentsToImport
    };

    const result = await apiRequest(payload);

    if (result && result.success) {
        tutupModalImport();
        loadDataSiswa(); // Muat ulang tabel 
    } else {
        alert("Gagal mengimpor data: " + (result?.message || 'Error server'));
    }
    
    btn.innerHTML = oriText;
    btn.disabled = false;
    lucide.createIcons();
}
// Inisialisasi awal
loadDataSiswa();
