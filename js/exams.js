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
        renderExams(result.data);
    } else {
        container.innerHTML = `<div class="col-span-full text-center text-rose-500 p-10">Gagal memuat data.</div>`;
    }
}

// --- 2. RENDER UI CARDS ---
function renderExams(data) {
    const container = document.getElementById('exams-container');
    if (!data || data.length === 0) return container.innerHTML = `<p class="col-span-full text-center text-slate-400 py-10">Belum ada jadwal.</p>`;

    container.innerHTML = data.map(ex => `
        <div class="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="editUjian('${ex.subject}')" class="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                <button onclick="hapusUjianBySubject('${ex.subject}')" class="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-rose-50 hover:text-rose-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>

            <div class="flex items-center gap-4 mb-6">
                <div class="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 rounded-2xl shadow-inner">
                    <i data-lucide="file-text" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="font-black text-slate-800 text-lg">${ex.subject}</h3>
                    <span class="text-[11px] font-bold tracking-wider ${ex.exam_status === 'active' ? 'text-emerald-500' : 'text-slate-400'}">
                        ● ${ex.exam_status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-slate-50 p-3 rounded-2xl">
                    <p class="text-[9px] text-slate-400 uppercase font-bold">Tanggal</p>
                    <p class="text-xs font-bold text-slate-700">${ex.exam_date}</p>
                </div>
                <div class="bg-slate-50 p-3 rounded-2xl">
                    <p class="text-[9px] text-slate-400 uppercase font-bold">Waktu</p>
                    <p class="text-xs font-bold text-slate-700">${ex.start_time} - ${ex.end_time}</p>
                </div>
            </div>

            <div class="space-y-2">
                ${ex.targets.map(t => `
                    <div class="flex justify-between items-center text-xs bg-white border border-slate-100 px-4 py-3 rounded-xl hover:border-indigo-200 transition-colors">
                        <span class="font-bold text-slate-600">${t.class}</span>
                        <a href="${t.link}" target="_blank" class="text-indigo-600 font-bold hover:underline flex items-center gap-1">Link <i data-lucide="external-link" class="w-3 h-3"></i></a>
                    </div>
                `).join('')}
            </div>
            
            <div class="mt-6 flex gap-2 border-t border-slate-50 pt-4">
                <div class="flex-1 flex gap-2">
                    <span class="flex-1 text-center bg-emerald-50 text-emerald-700 py-2 rounded-xl text-[10px] font-black border border-emerald-100">IN: ${ex.entry_token}</span>
                    <span class="flex-1 text-center bg-rose-50 text-rose-600 py-2 rounded-xl text-[10px] font-black border border-rose-100">OUT: ${ex.exit_token}</span>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

// --- 3. MANAJEMEN TARGET KELAS DI MODAL ---
let targetList = [];

function bukaModalJadwal() {
    targetList = [];
    document.getElementById('targetTags').innerHTML = '';
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
    const payload = {
        action: 'saveExams',
        school_npsn: user.school_npsn,
        subject: document.getElementById('examSubject').value,
        exam_date: document.getElementById('examDate').value,
        start_time: document.getElementById('startTime').value,
        end_time: document.getElementById('endTime').value,
        duration: document.getElementById('examDuration').value,
        exam_link: document.getElementById('examLink').value,
        entry_token: document.getElementById('entryToken').value,
        exit_token: document.getElementById('exitToken').value,
        targets: targetList
    };

    const res = await apiRequest(payload);
    if(res.success) {
        tutupModalJadwal();
        loadExams();
    } else {
        alert("Gagal: " + (res.message || 'Terjadi kesalahan'));
    }
}

async function hapusUjian(id) {
    if(!confirm("Yakin ingin menghapus jadwal ujian ini?")) return;
    
    const res = await apiRequest({ action: 'deleteExam', id: id });
    if(res.success) {
        loadExams();
    } else {
        alert("Gagal menghapus jadwal.");
    }
}
async function hapusUjianBySubject(subject) {
    if(!confirm(`Yakin ingin menghapus seluruh jadwal untuk ${subject}?`)) return;
    
    // Kirim subject ke backend untuk dihapus massal berdasarkan subject
    const res = await apiRequest({ action: 'deleteExamBySubject', subject: subject });
    if(res.success) {
        loadExams(); // Refresh
    } else {
        alert("Gagal menghapus.");
    }
}
// Inisialisasi awal
loadExams();
