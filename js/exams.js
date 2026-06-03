let currentExams = [];
let editExamId = null; // Menyimpan ID saat mode edit
let currentFilter = 'today';
let searchQuery = '';

// Pagination Config
let currentExamPage = 1;
const examItemsPerPage = 10;

// --- 1. LOAD DATA ---
async function loadExams() {
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    if (!user || !user.school_npsn) return;

    const container = document.getElementById('exams-container');
    container.innerHTML = `<tr><td colspan="7" class="text-center text-slate-400 p-10">Memuat data ujian...</td></tr>`;

    const result = await apiRequest({ action: 'getExams', school_npsn: user.school_npsn });

    if (result && result.success) {
        currentExams = result.data;
        renderExams();
    } else {
        container.innerHTML = `<tr><td colspan="7" class="text-center text-rose-500 p-10">Gagal memuat data.</td></tr>`;
    }
}

// --- 2. RENDER & PAGINATION ---
function renderExams() {
    const container = document.getElementById('exams-container');
    let filteredData = [...currentExams];

    // Filter Tabs
    if (currentFilter === 'today') {
        const todayStr = new Date().toLocaleDateString('en-CA');
        filteredData = filteredData.filter(e => e.exam_date === todayStr);
    }

    // Filter Pencarian (Cari berdasarkan Mapel ATAU Kelas)
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(e => 
            e.subject.toLowerCase().includes(query) || 
            String(e.target_class).toLowerCase().includes(query)
        );
    }

    // Sorting (Paling dekat ditaruh di atas)
    filteredData.sort((a, b) => new Date(a.exam_date + 'T' + a.start_time) - new Date(b.exam_date + 'T' + b.start_time));

    // Update UI Tabs
    document.getElementById('tabToday').className = `px-4 py-1.5 text-sm font-bold rounded-lg transition-colors shadow-sm ${currentFilter === 'today' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'}`;
    document.getElementById('tabAll').className = `px-4 py-1.5 text-sm font-bold rounded-lg transition-colors shadow-sm ${currentFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'}`;

    // Pagination Logic
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / examItemsPerPage) || 1;
    if (currentExamPage > totalPages) currentExamPage = totalPages;
    
    const startIndex = (currentExamPage - 1) * examItemsPerPage;
    const endIndex = startIndex + examItemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Update Info Pagination
    const infoText = totalItems === 0 ? "Tidak ada jadwal" : `Menampilkan ${startIndex + 1} - ${Math.min(endIndex, totalItems)} dari ${totalItems} jadwal`;
    document.getElementById('examPaginationInfo').innerText = infoText;

    if (paginatedData.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="text-center text-slate-400 p-10 bg-white">Tidak ada jadwal ujian yang ditemukan.</td></tr>`;
        updateBulkDeleteBtn();
        return;
    }

    container.innerHTML = paginatedData.map(ex => {
        const isActive = (ex.status === 'active' || ex.exam_status === 'active');
        
        return `
        <tr class="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="p-4 text-center">
                <input type="checkbox" class="exam-checkbox w-4 h-4 rounded border-slate-300 text-indigo-600" value="${ex.id}" onchange="updateBulkDeleteBtn()">
            </td>
            <td class="p-4">
                <div class="font-bold text-slate-800">${ex.subject}</div>
                <div class="text-[11px] font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                    <span class="bg-slate-100 px-2 py-0.5 rounded">${ex.target_class}</span>
                    <a href="${ex.exam_link}" target="_blank" class="text-indigo-600 hover:underline flex items-center gap-1"><i data-lucide="external-link" class="w-3 h-3"></i> Link Soal</a>
                </div>
            </td>
            <td class="p-4 text-center">
                <div class="text-sm font-medium text-slate-700 flex justify-center items-center gap-1.5"><i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i> ${ex.exam_date}</div>
                <div class="text-xs text-slate-500 mt-1 flex justify-center items-center gap-1.5"><i data-lucide="clock" class="w-3 h-3 text-slate-400"></i> ${ex.start_time} - ${ex.end_time}</div>
            </td>
            <td class="p-4 text-center">
                <span class="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">${ex.duration} Mnt</span>
            </td>
            <td class="p-4 text-center">
                <div class="flex flex-col gap-1 items-center">
                    <span class="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 rounded">IN: ${ex.entry_token}</span>
                    <span class="inline-flex items-center px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100 rounded">OUT: ${ex.exit_token}</span>
                </div>
            </td>
            <td class="p-4 text-center">
                <span class="px-2.5 py-1 text-[10px] font-bold rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}">${isActive ? 'ACTIVE' : 'INACTIVE'}</span>
            </td>
            <td class="p-4 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="bukaModalCopy('${ex.id}')" class="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100" title="Copy (Duplikat)"><i data-lucide="copy" class="w-4 h-4"></i></button>
                    <button onclick="bukaModalEdit('${ex.id}')" class="p-1.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-100" title="Edit Ujian"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="hapusUjian('${ex.id}')" class="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100" title="Hapus Ujian"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
    
    lucide.createIcons();
    updateBulkDeleteBtn();
}

function setFilter(type) { currentFilter = type; currentExamPage = 1; renderExams(); }
function setSearchFilter() { searchQuery = document.getElementById('searchExamInput').value; currentExamPage = 1; renderExams(); }
function changeExamPage(dir) { currentExamPage += dir; renderExams(); }

// --- 3. MANAJEMEN MODAL ---
function clearForm() {
    ['examSubject', 'targetClass', 'examDate', 'startTime', 'endTime', 'examDuration', 'examLink', 'entryToken', 'exitToken'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

function bukaModalJadwal() {
    editExamId = null;
    clearForm();
    document.getElementById('modalTitle').innerHTML = `<i data-lucide="calendar-plus" class="w-5 h-5 text-indigo-600"></i> Tambah Jadwal Baru`;
    document.getElementById('modalTambahJadwal').classList.remove('hidden');
    lucide.createIcons();
}

function bukaModalEdit(id) {
    const exam = currentExams.find(e => e.id === id);
    if (!exam) return;
    editExamId = id;
    
    document.getElementById('examSubject').value = exam.subject;
    document.getElementById('targetClass').value = exam.target_class;
    document.getElementById('examDate').value = exam.exam_date;
    document.getElementById('startTime').value = exam.start_time;
    document.getElementById('endTime').value = exam.end_time;
    document.getElementById('examDuration').value = exam.duration;
    document.getElementById('examLink').value = exam.exam_link;
    document.getElementById('entryToken').value = exam.entry_token;
    document.getElementById('exitToken').value = exam.exit_token;

    document.getElementById('modalTitle').innerHTML = `<i data-lucide="edit" class="w-5 h-5 text-amber-500"></i> Edit Jadwal`;
    document.getElementById('modalTambahJadwal').classList.remove('hidden');
    lucide.createIcons();
}

function bukaModalCopy(id) {
    const exam = currentExams.find(e => e.id === id);
    if (!exam) return;
    editExamId = null; // Menjadi mode Tambah Baru (bukan Edit)
    
    document.getElementById('examSubject').value = exam.subject;
    document.getElementById('targetClass').value = exam.target_class + " (Copy)";
    document.getElementById('examDate').value = exam.exam_date;
    document.getElementById('startTime').value = exam.start_time;
    document.getElementById('endTime').value = exam.end_time;
    document.getElementById('examDuration').value = exam.duration;
    document.getElementById('examLink').value = ''; // Link dikosongkan agar diisi yang baru
    document.getElementById('entryToken').value = exam.entry_token;
    document.getElementById('exitToken').value = exam.exit_token;

    document.getElementById('modalTitle').innerHTML = `<i data-lucide="copy" class="w-5 h-5 text-indigo-600"></i> Duplikat Jadwal`;
    document.getElementById('modalTambahJadwal').classList.remove('hidden');
    lucide.createIcons();
}

function tutupModalJadwal() {
    document.getElementById('modalTambahJadwal').classList.add('hidden');
}

// --- 4. SIMPAN & HAPUS ---
async function simpanJadwal(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btnSubmitJadwal');
    const originalText = btnSubmit.innerHTML;
    
    btnSubmit.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Menyimpan...`;
    btnSubmit.disabled = true;
    lucide.createIcons();

    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const payload = {
        action: editExamId ? 'editExam' : 'saveExams',
        school_npsn: user.school_npsn,
        id: editExamId,
        subject: document.getElementById('examSubject').value,
        target_class: document.getElementById('targetClass').value,
        exam_date: document.getElementById('examDate').value,
        start_time: document.getElementById('startTime').value,
        end_time: document.getElementById('endTime').value,
        duration: document.getElementById('examDuration').value,
        exam_link: document.getElementById('examLink').value,
        entry_token: document.getElementById('entryToken').value,
        exit_token: document.getElementById('exitToken').value
    };

    const res = await apiRequest(payload);
    btnSubmit.innerHTML = originalText;
    btnSubmit.disabled = false;

    if(res.success) {
        tutupModalJadwal();
        loadExams();
    } else {
        alert("Gagal: " + (res.message || 'Terjadi kesalahan'));
    }
}

async function hapusUjian(id) {
    if(!confirm(`Yakin ingin menghapus jadwal ini?`)) return;
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const res = await apiRequest({ action: 'deleteExam', school_npsn: user.school_npsn, id: id });
    if(res.success) loadExams();
    else alert("Gagal menghapus jadwal.");
}

function updateBulkDeleteBtn() {
    const checkboxes = document.querySelectorAll('.exam-checkbox:checked');
    const btn = document.getElementById('btnBulkDelete');
    if (btn) {
        if (checkboxes.length > 0) {
            btn.classList.remove('hidden');
            document.getElementById('textBulkDelete').innerText = `Hapus (${checkboxes.length})`;
        } else {
            btn.classList.add('hidden');
        }
    }
}

function toggleSelectAll(el) {
    const checkboxes = document.querySelectorAll('.exam-checkbox');
    checkboxes.forEach(cb => cb.checked = el.checked);
    updateBulkDeleteBtn();
}

async function bulkDeleteExams() {
    const checkboxes = document.querySelectorAll('.exam-checkbox:checked');
    const idsToDelete = Array.from(checkboxes).map(cb => cb.value);
    
    if(idsToDelete.length === 0) return;
    if(!confirm(`Yakin ingin menghapus ${idsToDelete.length} jadwal secara permanen?`)) return;

    const btn = document.getElementById('btnBulkDelete');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-2"></i> Menghapus...`;
    btn.disabled = true;

    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const res = await apiRequest({ action: 'deleteBulkExams', school_npsn: user.school_npsn, ids: idsToDelete });

    btn.innerHTML = originalText;
    btn.disabled = false;

    if(res.success) {
        document.getElementById('selectAllCb').checked = false;
        loadExams();
    } else {
        alert("Gagal menghapus jadwal massal.");
    }
}

loadExams();
