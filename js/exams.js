// Variabel global
let currentExams = [];
let editOldSubject = null;
let targetList = [];
let currentFilter = 'today'; // Default filter: Hari Ini
let searchQuery = '';

// --- 1. INISIALISASI & LOAD DATA ---
async function loadExams() {
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    if (!user || !user.school_npsn) return;

    const container = document.getElementById('exams-container');
    container.innerHTML = `<tr><td colspan="6" class="text-center text-slate-400 p-10">Memuat data ujian...</td></tr>`;

    const result = await apiRequest({
        action: 'getExams',
        school_npsn: user.school_npsn
    });

    if (result && result.success) {
        currentExams = result.data;
        renderExams();
    } else {
        container.innerHTML = `<tr><td colspan="6" class="text-center text-rose-500 p-10">Gagal memuat data.</td></tr>`;
    }
}

// --- 2. RENDER UI TABEL ---
function renderExams() {
    const container = document.getElementById('exams-container');
    
    // 1. Buat salinan data agar data asli (currentExams) tidak rusak saat di-sort
    let filteredData = [...currentExams];

    // 2. Logika Filter Tabs (Hari Ini / Semua)
    if (currentFilter === 'today') {
        const todayStr = new Date().toLocaleDateString('en-CA'); // Format YYYY-MM-DD
        filteredData = filteredData.filter(e => e.exam_date === todayStr);
    }

    // 3. Logika Pencarian (Search)
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(e => 
            e.subject.toLowerCase().includes(query)
        );
    }

    // 4. Logika Sorting (Paling dekat dengan waktu saat ini ditaruh di atas)
    filteredData.sort((a, b) => {
        const dateA = new Date(a.exam_date + 'T' + a.start_time);
        const dateB = new Date(b.exam_date + 'T' + b.start_time);
        return dateA - dateB;
    });

    // --- UPDATE UI TAB FILTER ---
    const tabToday = document.getElementById('tabToday');
    const tabAll = document.getElementById('tabAll');
    if(tabToday && tabAll) {
        tabToday.className = `px-4 py-1.5 text-sm font-bold rounded-lg transition-colors shadow-sm ${currentFilter === 'today' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'}`;
        tabAll.className = `px-4 py-1.5 text-sm font-bold rounded-lg transition-colors shadow-sm ${currentFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'}`;
    }

    // --- RENDER DATA KE TABEL ---
    if (!filteredData || filteredData.length === 0) {
        container.innerHTML = `<tr><td colspan="6" class="text-center text-slate-400 p-10 bg-white">Tidak ada jadwal ujian yang ditemukan.</td></tr>`;
        updateBulkDeleteBtn(); // Sembunyikan tombol hapus jika kosong
        return;
    }

    container.innerHTML = filteredData.map(ex => {
        const isActive = (ex.status === 'active' || ex.exam_status === 'active');
        
        return `
        <tr class="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="p-4">
                <input type="checkbox" class="exam-checkbox w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" value="${ex.subject}" onchange="updateBulkDeleteBtn()">
            </td>
            <td class="p-4">
                <div class="font-bold text-slate-800">${ex.subject}</div>
                <div class="mt-1.5 space-y-1">
                    ${ex.targets.map(t => `
                        <div class="text-[11px] text-slate-500 flex items-center gap-2">
                            <span class="font-bold text-slate-700 w-10">${t.class}</span> 
                            <a href="${t.link}" target="_blank" class="text-indigo-600 font-medium hover:underline flex items-center gap-1">
                                Link Ujian <i data-lucide="external-link" class="w-3 h-3"></i>
                            </a>
                        </div>
                    `).join('')}
                </div>
            </td>
            <td class="p-4">
                <div class="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <i data-lucide="calendar" class="w-4 h-4 text-slate-400"></i> ${ex.exam_date}
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <i data-lucide="clock" class="w-3 h-3"></i> ${ex.start_time} - ${ex.end_time}
                </div>
            </td>
            <td class="p-4">
                <div class="flex flex-col gap-1">
                    <span class="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 rounded">
                        IN: ${ex.entry_token}
                    </span>
                    <span class="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100 rounded">
                        OUT: ${ex.exit_token}
                    </span>
                </div>
            </td>
            <td class="p-4">
                <span class="px-2.5 py-1 text-[10px] font-bold rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
                    ${isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
            </td>
            <td class="p-4">
                <div class="flex items-center gap-2">
                    <button onclick="bukaModalCopy('${ex.subject}')" class="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100" title="Copy (Duplikat Jadwal)">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                    </button>
                    <button onclick="bukaModalEdit('${ex.subject}')" class="p-2 bg-amber-50 text-amber-600 rounded hover:bg-amber-100" title="Edit Ujian">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button onclick="hapusUjianBySubject('${ex.subject}')" class="p-2 bg-rose-50 text-rose-600 rounded hover:bg-rose-100" title="Hapus Ujian">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
    
    lucide.createIcons();
    updateBulkDeleteBtn(); // Reset status tombol hapus massal agar tidak tertinggal aktif
}

function setFilter(type) {
    currentFilter = type;
    renderExams();
}

// --- 3. MANAJEMEN MODAL, COPY, EDIT ---
function bukaModalJadwal() {
    editOldSubject = null;
    targetList = [];
    document.getElementById('targetTags').innerHTML = '';
    
    document.getElementById('examSubject').value = '';
    document.getElementById('examDate').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    document.getElementById('examLink').value = '';
    document.getElementById('entryToken').value = '';
    document.getElementById('exitToken').value = '';

    document.getElementById('modalTitle').innerText = "Tambah Jadwal Baru";
    document.getElementById('modalTambahJadwal').classList.remove('hidden');
}

function bukaModalEdit(subject) {
    const exam = currentExams.find(e => e.subject === subject);
    if (!exam) return;

    editOldSubject = subject;
    document.getElementById('examSubject').value = exam.subject;
    document.getElementById('examDate').value = exam.exam_date;
    document.getElementById('startTime').value = exam.start_time;
    document.getElementById('endTime').value = exam.end_time;
    document.getElementById('entryToken').value = exam.entry_token;
    document.getElementById('exitToken').value = exam.exit_token;
    
    document.getElementById('examLink').value = exam.targets.length > 0 ? exam.targets[0].link : '';
    targetList = exam.targets.map(t => t.class);
    renderTags();

    document.getElementById('modalTitle').innerText = "Edit Jadwal Ujian";
    document.getElementById('modalTambahJadwal').classList.remove('hidden');
}

function bukaModalCopy(subject) {
    const exam = currentExams.find(e => e.subject === subject);
    if (!exam) return;

    bukaModalJadwal(); // Reset form & edit mode
    
    // Isi data duplikat (tambahkan kata Copy agar tidak menimpa jika lupa diubah)
    document.getElementById('examSubject').value = exam.subject + " (Copy)";
    document.getElementById('examDate').value = exam.exam_date;
    document.getElementById('startTime').value = exam.start_time;
    document.getElementById('endTime').value = exam.end_time;
    document.getElementById('entryToken').value = exam.entry_token;
    document.getElementById('exitToken').value = exam.exit_token;
    
    document.getElementById('examLink').value = exam.targets.length > 0 ? exam.targets[0].link : '';
    targetList = [...exam.targets.map(t => t.class)];
    renderTags();

    document.getElementById('modalTitle').innerText = "Duplikat Jadwal Ujian";
}

function tutupModalJadwal() {
    document.getElementById('modalTambahJadwal').classList.add('hidden');
}

function tambahTarget() {
    const input = document.getElementById('inputKelas');
    const val = input.value.trim();
    if(val && !targetList.includes(val)) {
        targetList.push(val);
        renderTags();
        input.value = '';
    }
}

function renderTags() {
    document.getElementById('targetTags').innerHTML = targetList.map(t => `
        <span class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
            ${t} <i data-lucide="x" class="w-3 h-3 cursor-pointer" onclick="hapusTarget('${t}')"></i>
        </span>
    `).join('');
    lucide.createIcons();
}

function hapusTarget(t) {
    targetList = targetList.filter(item => item !== t);
    renderTags();
}

// --- 4. SIMPAN DENGAN EFEK LOADING ---
async function simpanJadwal(e) {
    e.preventDefault();
    if(targetList.length === 0) return alert("Tambahkan minimal satu target kelas!");

    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    
    // Set Loading State (Anti-Spam)
    btnSubmit.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Menyimpan...`;
    btnSubmit.disabled = true;
    lucide.createIcons();

    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const payload = {
        action: editOldSubject ? 'editExam' : 'saveExams',
        school_npsn: user.school_npsn,
        old_subject: editOldSubject,
        subject: document.getElementById('examSubject').value,
        exam_date: document.getElementById('examDate').value,
        start_time: document.getElementById('startTime').value,
        end_time: document.getElementById('endTime').value,
        duration: document.getElementById('examDuration') ? document.getElementById('examDuration').value : '',
        exam_link: document.getElementById('examLink').value,
        entry_token: document.getElementById('entryToken').value,
        exit_token: document.getElementById('exitToken').value,
        targets: targetList
    };

    const res = await apiRequest(payload);
    
    // Kembalikan Tombol
    btnSubmit.innerHTML = originalText;
    btnSubmit.disabled = false;

    if(res.success) {
        tutupModalJadwal();
        loadExams(); // Tarik ulang data agar status ArrayFormula terbaca utuh
    } else {
        alert("Gagal: " + (res.message || 'Terjadi kesalahan'));
    }
}

// --- 5. HAPUS & BULK DELETE DENGAN EFEK LOADING ---
async function hapusUjianBySubject(subject) {
    if(!confirm(`Yakin ingin menghapus seluruh jadwal untuk ${subject}?`)) return;
    
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const res = await apiRequest({ action: 'deleteExam', school_npsn: user.school_npsn, subject: subject });
    if(res.success) loadExams();
    else alert("Gagal menghapus jadwal.");
}

function updateBulkDeleteBtn() {
    const checkboxes = document.querySelectorAll('.exam-checkbox:checked');
    const btn = document.getElementById('btnBulkDelete');
    if (btn) {
        if (checkboxes.length > 0) {
            btn.classList.remove('hidden');
            btn.innerHTML = `<i data-lucide="trash-2" class="w-4 h-4 mr-2"></i> Hapus ${checkboxes.length} Jadwal`;
        } else {
            btn.classList.add('hidden');
        }
        lucide.createIcons();
    }
}

function toggleSelectAll(el) {
    const checkboxes = document.querySelectorAll('.exam-checkbox');
    checkboxes.forEach(cb => cb.checked = el.checked);
    updateBulkDeleteBtn();
}

async function bulkDeleteExams() {
    const checkboxes = document.querySelectorAll('.exam-checkbox:checked');
    const subjectsToDelete = Array.from(checkboxes).map(cb => cb.value);
    
    if(subjectsToDelete.length === 0) return;
    if(!confirm(`Yakin ingin menghapus ${subjectsToDelete.length} jadwal secara permanen?`)) return;

    const btn = document.getElementById('btnBulkDelete');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-2"></i> Menghapus...`;
    btn.disabled = true;

    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const res = await apiRequest({ 
        action: 'deleteBulkExams', 
        school_npsn: user.school_npsn, 
        subjects: subjectsToDelete 
    });

    btn.innerHTML = originalText;
    btn.disabled = false;

    if(res.success) {
        document.getElementById('selectAllCb').checked = false; // Uncheck select all
        loadExams();
    } else {
        alert("Gagal menghapus jadwal massal.");
    }
}

function setSearchFilter() {
    searchQuery = document.getElementById('searchExamInput').value.toLowerCase();
    renderExams();
}

// Inisialisasi awal
loadExams();
