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
    if (!container) return; // Pengaman
    
    container.innerHTML = `<tr><td colspan="7" class="text-center text-slate-400 p-10">Memuat data ujian...</td></tr>`;

    try {
        const result = await apiRequest({ action: 'getExams', school_npsn: user.school_npsn });

        if (result && result.success) {
            // PENGAMAN 1: Pastikan data yang masuk adalah Array, kalau tidak, jadikan array kosong
            currentExams = Array.isArray(result.data) ? result.data : [];
            renderExams();
        } else {
            container.innerHTML = `<tr><td colspan="7" class="text-center text-rose-500 p-10">Gagal memuat data.</td></tr>`;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `<tr><td colspan="7" class="text-center text-rose-500 p-10">Terjadi kesalahan pada sistem.</td></tr>`;
    }
}

// --- 2. RENDER & PAGINATION ---
function renderExams() {
    const container = document.getElementById('exams-container');
    if (!container) return; // Pengaman
    
    let filteredData = [...currentExams];

    // Filter Tabs
    if (currentFilter === 'today') {
        const todayStr = new Date().toLocaleDateString('en-CA');
        filteredData = filteredData.filter(e => e.exam_date === todayStr);
    }

    // Filter Pencarian (Cari berdasarkan Mapel ATAU Kelas) - DENGAN PENGAMAN
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(e => {
            const subjectMatch = e.subject ? String(e.subject).toLowerCase().includes(query) : false;
            const classMatch = e.target_class ? String(e.target_class).toLowerCase().includes(query) : false;
            return subjectMatch || classMatch;
        });
    }

    const now = new Date(); 

    // Fungsi pembantu untuk menentukan status dan bobot urutan
    function getExamStatusDetails(ex) {
        // PENGAMAN WAKTU
        if (!ex.exam_date || !ex.start_time || !ex.end_time) {
             return { text: "Menunggu", weight: 4, class: "bg-slate-50 text-slate-500 border border-slate-200" };
        }

        const start = new Date(`${ex.exam_date}T${ex.start_time}`);
        const end = new Date(`${ex.exam_date}T${ex.end_time}`);
        
        if (now < start) {
            return {
                text: "Akan Datang",
                weight: 2, 
                class: "bg-blue-50 text-blue-600 border border-blue-100"
            };
        } else if (now >= start && now <= end) {
            return {
                text: "Berlangsung",
                weight: 1, 
                class: "bg-emerald-50 text-emerald-700 border border-emerald-100"
            };
        } else {
            return {
                text: "Selesai",
                weight: 3, 
                class: "bg-slate-50 text-slate-500 border border-slate-200"
            };
        }
    }

    // Logika Pengurutan
    filteredData.sort((a, b) => {
        const statusA = getExamStatusDetails(a);
        const statusB = getExamStatusDetails(b);
        
        if (statusA.weight !== statusB.weight) {
            return statusA.weight - statusB.weight;
        }
        return new Date(a.exam_date + 'T' + a.start_time) - new Date(b.exam_date + 'T' + b.start_time);
    });

    // PENGAMAN: Update UI Tabs (Cek dulu elemennya ada atau tidak sebelum diubah)
    const tabToday = document.getElementById('tabToday');
    const tabAll = document.getElementById('tabAll');
    if (tabToday) tabToday.className = `px-4 py-1.5 text-sm font-bold rounded-lg transition-colors shadow-sm ${currentFilter === 'today' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'}`;
    if (tabAll) tabAll.className = `px-4 py-1.5 text-sm font-bold rounded-lg transition-colors shadow-sm ${currentFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'}`;

    // Pagination Logic
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / examItemsPerPage) || 1;
    if (currentExamPage > totalPages) currentExamPage = totalPages;
    
    const startIndex = (currentExamPage - 1) * examItemsPerPage;
    const endIndex = startIndex + examItemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // PENGAMAN: Update Info Pagination
    const infoText = totalItems === 0 ? "Tidak ada jadwal" : `Menampilkan ${startIndex + 1} - ${Math.min(endIndex, totalItems)} dari ${totalItems} jadwal`;
    const pagInfo = document.getElementById('examPaginationInfo');
    if (pagInfo) pagInfo.innerText = infoText;

    if (paginatedData.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="text-center text-slate-400 p-10 bg-white">Tidak ada jadwal ujian yang ditemukan.</td></tr>`;
        updateBulkDeleteBtn();
        return;
    }

    function formatTanggalIndo(dateStr) {
        if (!dateStr || !dateStr.includes('-')) return dateStr;
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
    }

    container.innerHTML = paginatedData.map(ex => {
        const statusDetails = getExamStatusDetails(ex);
        
        return `
        <tr class="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="p-4 text-center">
                <input type="checkbox" class="exam-checkbox w-4 h-4 rounded border-slate-300 text-indigo-600" value="${ex.id}" onchange="updateBulkDeleteBtn()">
            </td>
            <td class="p-4">
                <div class="font-bold text-slate-800 text-sm">${ex.subject}</div>
                <div class="text-[11px] font-bold text-slate-500 mt-1.5 flex items-center gap-2">
                    <span class="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded border border-indigo-100">${ex.target_class}</span>
                    <a href="${ex.exam_link}" target="_blank" class="text-indigo-500 hover:text-indigo-700 hover:underline flex items-center gap-1 transition-colors">
                        <i data-lucide="external-link" class="w-3 h-3"></i> Link Soal
                    </a>
                </div>
            </td>
            <td class="p-4 text-center">
                <div class="text-xs font-bold text-slate-700 flex justify-center items-center gap-1.5">
                    <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i> ${formatTanggalIndo(ex.exam_date)}
                </div>
                <div class="text-xs font-medium text-slate-500 mt-1 flex justify-center items-center gap-1.5">
                    <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i> ${ex.start_time} - ${ex.end_time}
                </div>
            </td>
            <td class="p-4 text-center">
                <div class="flex justify-center items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit mx-auto shadow-sm">
                    <i data-lucide="timer" class="w-3.5 h-3.5 text-slate-400"></i>
                    ${ex.duration}
                </div>
            </td>
            <td class="p-4 text-center">
                <div class="flex flex-col gap-1.5 items-center">
                    <span class="inline-flex justify-center w-24 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 rounded shadow-sm">IN: ${ex.entry_token}</span>
                    <span class="inline-flex justify-center w-24 px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100 rounded shadow-sm">OUT: ${ex.exit_token}</span>
                </div>
            </td>
            <td class="p-4 text-center">
                <span class="px-3 py-1.5 text-[10px] font-bold rounded-full shadow-sm ${statusDetails.class}">
                    ${statusDetails.text}
                </span>
            </td>
            <td class="p-4 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="bukaModalCopy('${ex.id}')" class="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm hover:shadow" title="Copy (Duplikat)"><i data-lucide="copy" class="w-4 h-4"></i></button>
                    <button onclick="bukaModalEdit('${ex.id}')" class="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors shadow-sm hover:shadow" title="Edit Ujian"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button onclick="hapusUjian('${ex.id}')" class="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors shadow-sm hover:shadow" title="Hapus Ujian"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateBulkDeleteBtn();
}

function setFilter(type) { currentFilter = type; currentExamPage = 1; renderExams(); }
function setSearchFilter() { 
    const searchInput = document.getElementById('searchExamInput');
    if(searchInput) {
        searchQuery = searchInput.value; 
        currentExamPage = 1; 
        renderExams(); 
    }
}
function changeExamPage(dir) { currentExamPage += dir; renderExams(); }

// --- 3. MANAJEMEN MODAL ---
function clearForm() {
    ['examSubject', 'targetClass', 'examDate', 'startTime', 'endTime', 'examDuration', 'examLink', 'entryToken', 'exitToken'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
}

function bukaModalJadwal() {
    editExamId = null;
    clearForm();
    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.innerHTML = `<i data-lucide="calendar-plus" class="w-5 h-5 text-indigo-600"></i> Tambah Jadwal Baru`;
    
    const modalEl = document.getElementById('modalTambahJadwal');
    if (modalEl) modalEl.classList.remove('hidden');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function bukaModalEdit(id) {
    const exam = currentExams.find(e => e.id === id);
    if (!exam) return;
    editExamId = id;
    
    if(document.getElementById('examSubject')) document.getElementById('examSubject').value = exam.subject || '';
    if(document.getElementById('targetClass')) document.getElementById('targetClass').value = exam.target_class || '';
    if(document.getElementById('examDate')) document.getElementById('examDate').value = exam.exam_date || '';
    if(document.getElementById('startTime')) document.getElementById('startTime').value = exam.start_time || '';
    if(document.getElementById('endTime')) document.getElementById('endTime').value = exam.end_time || '';
    if(document.getElementById('examDuration')) document.getElementById('examDuration').value = exam.duration || '';
    if(document.getElementById('examLink')) document.getElementById('examLink').value = exam.exam_link || '';
    if(document.getElementById('entryToken')) document.getElementById('entryToken').value = exam.entry_token || '';
    if(document.getElementById('exitToken')) document.getElementById('exitToken').value = exam.exit_token || '';

    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.innerHTML = `<i data-lucide="edit" class="w-5 h-5 text-amber-500"></i> Edit Jadwal`;
    
    const modalEl = document.getElementById('modalTambahJadwal');
    if (modalEl) modalEl.classList.remove('hidden');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function bukaModalCopy(id) {
    const exam = currentExams.find(e => e.id === id);
    if (!exam) return;
    editExamId = null; 
    
    if(document.getElementById('examSubject')) document.getElementById('examSubject').value = exam.subject || '';
    if(document.getElementById('targetClass')) document.getElementById('targetClass').value = (exam.target_class || '') + " (Copy)";
    if(document.getElementById('examDate')) document.getElementById('examDate').value = exam.exam_date || '';
    if(document.getElementById('startTime')) document.getElementById('startTime').value = exam.start_time || '';
    if(document.getElementById('endTime')) document.getElementById('endTime').value = exam.end_time || '';
    if(document.getElementById('examDuration')) document.getElementById('examDuration').value = exam.duration || '';
    if(document.getElementById('examLink')) document.getElementById('examLink').value = ''; 
    if(document.getElementById('entryToken')) document.getElementById('entryToken').value = exam.entry_token || '';
    if(document.getElementById('exitToken')) document.getElementById('exitToken').value = exam.exit_token || '';

    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.innerHTML = `<i data-lucide="copy" class="w-5 h-5 text-indigo-600"></i> Duplikat Jadwal`;
    
    const modalEl = document.getElementById('modalTambahJadwal');
    if (modalEl) modalEl.classList.remove('hidden');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function tutupModalJadwal() {
    const modalEl = document.getElementById('modalTambahJadwal');
    if (modalEl) modalEl.classList.add('hidden');
}

// --- 4. SIMPAN & HAPUS ---
async function simpanJadwal(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btnSubmitJadwal');
    if (!btnSubmit) return;
    
    const originalText = btnSubmit.innerHTML;
    
    btnSubmit.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Menyimpan...`;
    btnSubmit.disabled = true;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const payload = {
        action: editExamId ? 'editExam' : 'saveExams',
        school_npsn: user.school_npsn,
        id: editExamId,
        subject: document.getElementById('examSubject') ? document.getElementById('examSubject').value : '',
        target_class: document.getElementById('targetClass') ? document.getElementById('targetClass').value : '',
        exam_date: document.getElementById('examDate') ? document.getElementById('examDate').value : '',
        start_time: document.getElementById('startTime') ? document.getElementById('startTime').value : '',
        end_time: document.getElementById('endTime') ? document.getElementById('endTime').value : '',
        duration: document.getElementById('examDuration') ? document.getElementById('examDuration').value : '',
        exam_link: document.getElementById('examLink') ? document.getElementById('examLink').value : '',
        entry_token: document.getElementById('entryToken') ? document.getElementById('entryToken').value : '',
        exit_token: document.getElementById('exitToken') ? document.getElementById('exitToken').value : ''
    };

    try {
        const res = await apiRequest(payload);
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;

        if(res && res.success) {
            tutupModalJadwal();
            loadExams();
        } else {
            alert("Gagal: " + (res ? res.message : 'Terjadi kesalahan'));
        }
    } catch(err) {
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
        alert("Gagal terhubung ke server.");
    }
}

async function hapusUjian(id) {
    if(!confirm(`Yakin ingin menghapus jadwal ini?`)) return;
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const res = await apiRequest({ action: 'deleteExam', school_npsn: user.school_npsn, id: id });
    if(res && res.success) loadExams();
    else alert("Gagal menghapus jadwal.");
}

function updateBulkDeleteBtn() {
    const checkboxes = document.querySelectorAll('.exam-checkbox:checked');
    const btn = document.getElementById('btnBulkDelete');
    const txt = document.getElementById('textBulkDelete');
    
    if (btn) {
        if (checkboxes.length > 0) {
            btn.classList.remove('hidden');
            if(txt) txt.innerText = `Hapus (${checkboxes.length})`;
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
    if (!btn) return;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-2"></i> Menghapus...`;
    btn.disabled = true;

    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    const res = await apiRequest({ action: 'deleteBulkExams', school_npsn: user.school_npsn, ids: idsToDelete });

    btn.innerHTML = originalText;
    btn.disabled = false;

    if(res && res.success) {
        const checkAll = document.getElementById('selectAllCb');
        if(checkAll) checkAll.checked = false;
        loadExams();
    } else {
        alert("Gagal menghapus jadwal massal.");
    }
}

loadExams();
