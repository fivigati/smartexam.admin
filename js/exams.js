// Variabel global untuk menyimpan data sementara
let currentExams = [];
let editOldSubject = null; // Penanda apakah sedang mode edit atau tambah baru
let targetList = [];

// --- 1. INISIALISASI & LOAD DATA ---
async function loadExams() {
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    if (!user || !user.school_npsn) return;

    const container = document.getElementById('exams-container');
    container.innerHTML = `<div class="col-span-full text-center text-slate-400 p-10">Memuat jadwal ujian...</div>`;

    const result = await apiRequest({
        action: 'getExams',
        school_npsn: user.school_npsn
    });

    if (result && result.success) {
        currentExams = result.data; // Simpan ke variabel global untuk proses edit
        renderExams(result.data);
    } else {
        container.innerHTML = `<div class="col-span-full text-center text-rose-500 p-10">Gagal memuat data.</div>`;
    }
}

// --- 2. RENDER UI CARDS ---
function renderExams(data) {
    const container = document.getElementById('exams-container');
    if (!data || data.length === 0) {
        container.innerHTML = `<div class="col-span-full p-10 text-center text-slate-400">Belum ada jadwal ujian.</div>`;
        return;
    }

    container.innerHTML = data.map(ex => {
        // Status logic (Mendukung properti 'status' dari backend yang baru diperbaiki)
        const isActive = (ex.status === 'active' || ex.exam_status === 'active');
        
        return `
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <div class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><i data-lucide="book-open" class="w-5 h-5"></i></div>
                    <div>
                        <h3 class="font-bold text-slate-900">${ex.subject}</h3>
                        <div class="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                            <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i>${ex.exam_date}</span>
                            <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>${ex.start_time} - ${ex.end_time}</span>
                        </div>
                    </div>
                </div>
                <span class="text-[9px] font-bold px-2 py-1 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">
                    ${isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
            </div>

            <div class="space-y-1.5 mb-5">
                ${ex.targets.map(t => `
                    <div class="flex justify-between items-center text-xs bg-slate-50 px-3 py-2 rounded-lg">
                        <span class="font-bold text-slate-700">${t.class}</span>
                        <a href="${t.link}" target="_blank" class="text-indigo-600 font-bold hover:underline flex items-center gap-1">Link <i data-lucide="external-link" class="w-3 h-3"></i></a>
                    </div>
                `).join('')}
            </div>

            <div class="flex gap-2">
                <div class="flex-1 flex gap-1">
                    <span class="flex-1 text-center bg-emerald-50 text-emerald-700 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold">IN: ${ex.entry_token}</span>
                    <span class="flex-1 text-center bg-rose-50 text-rose-600 py-1.5 rounded-lg border border-rose-100 text-[10px] font-bold">OUT: ${ex.exit_token}</span>
                </div>
                
                <button onclick="bukaModalEdit('${ex.subject}')" class="px-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title="Edit Ujian">
                    <i data-lucide="edit" class="w-4 h-4"></i>
                </button>

                <button onclick="hapusUjianBySubject('${ex.subject}')" class="px-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Hapus Ujian">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
    lucide.createIcons();
}

// --- 3. MANAJEMEN MODAL & TARGET KELAS ---
function bukaModalJadwal() {
    editOldSubject = null; // Reset penanda edit (Berarti mode Tambah Baru)
    targetList = [];
    document.getElementById('targetTags').innerHTML = '';
    
    // Kosongkan semua input form
    document.getElementById('examSubject').value = '';
    document.getElementById('examDate').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    if(document.getElementById('examDuration')) document.getElementById('examDuration').value = '';
    document.getElementById('examLink').value = '';
    document.getElementById('entryToken').value = '';
    document.getElementById('exitToken').value = '';

    document.getElementById('modalTambahJadwal').classList.remove('hidden');
}

// FUNGSI BARU: Buka Modal untuk Edit
function bukaModalEdit(subject) {
    const exam = currentExams.find(e => e.subject === subject);
    if (!exam) return;

    editOldSubject = subject; // Set penanda bahwa kita sedang dalam mode Edit

    // Isi form dengan data ujian saat ini
    document.getElementById('examSubject').value = exam.subject;
    document.getElementById('examDate').value = exam.exam_date;
    document.getElementById('startTime').value = exam.start_time;
    document.getElementById('endTime').value = exam.end_time;
    document.getElementById('entryToken').value = exam.entry_token;
    document.getElementById('exitToken').value = exam.exit_token;

    // Ambil link ujian dari target pertama (karena linknya sama untuk semua target)
    const link = exam.targets.length > 0 ? exam.targets[0].link : '';
    document.getElementById('examLink').value = link;

    // Masukkan target kelas ke array
    targetList = exam.targets.map(t => t.class);
    renderTags();

    // Buka Modal
    document.getElementById('modalTambahJadwal').classList.remove('hidden');
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

// --- 4. SIMPAN & HAPUS UJIAN ---
async function simpanJadwal(e) {
    e.preventDefault();
    if(targetList.length === 0) return alert("Tambahkan minimal satu target kelas!");

    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    
    // Logika Pintar: Jika editOldSubject ada isinya, maka action 'editExam'. Jika kosong, 'saveExams'
    const payload = {
        action: editOldSubject ? 'editExam' : 'saveExams',
        school_npsn: user.school_npsn,
        old_subject: editOldSubject, // Hanya dipakai jika sedang edit
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
    if(res.success) {
        tutupModalJadwal();
        loadExams(); // Refresh tabel setelah simpan/edit berhasil
    } else {
        alert("Gagal: " + (res.message || 'Terjadi kesalahan'));
    }
}

async function hapusUjianBySubject(subject) {
    if(!confirm(`Yakin ingin menghapus seluruh jadwal untuk ${subject}?`)) return;
    
    const user = JSON.parse(localStorage.getItem('smart_exam_user'));
    
    // Perbaikan Action: Menggunakan 'deleteExam' sesuai routing di Code.gs
    const res = await apiRequest({ 
        action: 'deleteExam', 
        school_npsn: user.school_npsn,
        subject: subject 
    });
    
    if(res.success) {
        loadExams(); // Refresh
    } else {
        alert("Gagal menghapus jadwal.");
    }
}

// Inisialisasi awal
loadExams();
