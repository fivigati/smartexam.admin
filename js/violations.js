async function loadViolations(){

  try{

    // =========================
    // GET USER
    // =========================
    const user =
      JSON.parse(
        localStorage.getItem(
          'smart_exam_user'
        )
      );

    // =========================
    // REQUEST API
    // =========================
    const result =
      await apiRequest({

        action:'getViolations',

        school_npsn:
          user.school_npsn

      });

    console.log(result);

    // =========================
    // ERROR API
    // =========================
    if(!result.success){

      console.error(
        result.message
      );

      return;

    }

    // =========================
    // TABLE
    // =========================
    const table =
      document.getElementById(
        'violationsTable'
      );

    table.innerHTML = '';

    // =========================
    // EMPTY STATE
    // =========================
    if(
      !result.data ||
      result.data.length === 0
    ){

      table.innerHTML = `
      <div class="flex flex-col items-center justify-center py-24 text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
      <i
        data-lucide="shield-check"
        class="h-8 w-8 text-emerald-500">
      </i>

    </div>

    <h3 class="text-sm font-bold text-slate-700">

      Belum ada pelanggaran hari ini

    </h3>

    <p class="mt-1 text-xs text-slate-400">

      Sistem tidak menemukan aktivitas pelanggaran siswa.

    </p>

  </div>

`;
      lucide.createIcons();

      return;

    }

    // =========================
    // RENDER DATA
    // =========================
    result.data.forEach(item=>{

      table.innerHTML += `

      <div class="grid grid-cols-6 gap-4 items-center border-t border-slate-100 px-6 py-4 hover:bg-slate-50 transition-all">

        <!-- WAKTU -->
        <div>

          <div class="text-sm font-semibold text-slate-800">

            ${formatTime(item.created_at)}

          </div>

          <div class="mt-1 text-xs text-slate-400">

            ${formatDate(item.created_at)}

          </div>

        </div>

        <!-- NAMA -->
        <div>

          <div class="text-sm font-semibold text-slate-800">

            ${item.student_name}

          </div>

          <div class="mt-1 text-xs text-slate-400">

            ${item.student_class}
            •
            ${item.student_room}

          </div>

        </div>

        <!-- MAPEL -->
        <div>

          <div class="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">

            ${item.subject || '-'}

          </div>

        </div>

        <!-- PELANGGARAN -->
        <div class="flex flex-col gap-2">

          <div class="inline-flex w-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">

            ${item.violation_type}

          </div>

          <div class="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-600">

            ${item.action_taken}

          </div>

        </div>

        <!-- STATUS -->
        <div>

          <div class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">

            Terdeteksi

          </div>

        </div>

        <!-- AKSI -->
        <div class="text-center">

          <button

            onclick="resetStudent('${item.student_nisn}')"

            class="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-all">

            Reset

          </button>

        </div>

      </div>

      `;

    });

    // =========================
    // REFRESH ICON
    // =========================
    lucide.createIcons();

  }catch(err){

    console.error(err);

  }

}

// =========================
// FORMAT DATE
// =========================
function formatDate(dateString){

  return new Date(
    dateString
  ).toLocaleDateString(
    'id-ID'
  );

}

// =========================
// FORMAT TIME
// =========================
function formatTime(dateString){

  return new Date(
    dateString
  ).toLocaleTimeString(
    'id-ID',
    {
      hour:'2-digit',
      minute:'2-digit'
    }
  );

}

// =========================
// RESET SISWA
// =========================
async function resetStudent(nisn){

  const confirmDelete =
    confirm(
      'Reset semua pelanggaran siswa ini?'
    );

  if(!confirmDelete) return;

  const user =
    JSON.parse(
      localStorage.getItem(
        'smart_exam_user'
      )
    );

  const result =
    await apiRequest({

      action:'resetViolationStudent',

      student_nisn:nisn,

      school_npsn:
        user.school_npsn

    });

  alert(result.message);

  loadViolations();

}

// =========================
// DELETE ALL
// =========================
async function deleteAllViolations(){

  const confirmDelete =
    confirm(
      'Hapus semua log pelanggaran?'
    );

  if(!confirmDelete) return;

  const user =
    JSON.parse(
      localStorage.getItem(
        'smart_exam_user'
      )
    );

  const result =
    await apiRequest({

      action:'deleteAllViolations',

      school_npsn:
        user.school_npsn

    });

  alert(result.message);

  loadViolations();

}

// =========================
// AUTO LOAD
// =========================
loadViolations();

// =========================
// AUTO REFRESH
// =========================
setInterval(async ()=>{

  if(
    document.visibilityState
    ===
    'visible'
  ){

    await loadViolations();

  }

},5000);
