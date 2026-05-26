async function loadViolations(){

  const user =
    JSON.parse(
      localStorage.getItem(
        'smart_exam_user'
      )
    );

  const result =
    await apiRequest({

      action:'getViolations',

      school_npsn:
        user.school_npsn

    });

  console.log(result);

  if(!result.success) return;

  const table =
    document.getElementById(
      'violationTable'
    );

  table.innerHTML = '';

  result.data.forEach(item=>{

    table.innerHTML += `

      <tr class="border-b border-slate-100 hover:bg-slate-50 transition-all">

        <!-- WAKTU -->
        <td class="px-5 py-4">

          <div class="flex flex-col">

            <span class="text-sm font-semibold text-slate-800">

              ${formatTime(item.created_at)}

            </span>

            <span class="text-xs text-slate-400 mt-1">

              ${formatDate(item.created_at)}

            </span>

          </div>

        </td>

        <!-- NAMA -->
        <td class="px-5 py-4">

          <div class="flex flex-col">

            <span class="text-sm font-semibold text-slate-800">

              ${item.student_name}

            </span>

            <span class="text-xs text-slate-400 mt-1">

              ${item.student_class}
              •
              ${item.student_room}

            </span>

          </div>

        </td>

        <!-- MAPEL -->
        <td class="px-5 py-4">

          <div class="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">

            ${item.subject}

          </div>

        </td>

        <!-- PELANGGARAN -->
        <td class="px-5 py-4">

          <div class="flex flex-col gap-2">

            <div class="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">

              ${item.violation_type}

            </div>

            <div class="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-600">

              ${item.action_taken}

            </div>

          </div>

        </td>

        <!-- AKSI -->
        <td class="px-5 py-4">

          <button

            onclick="resetStudent('${item.student_nisn}')"

            class="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-all">

            Reset

          </button>

        </td>

      </tr>

    `;

  });

}

function formatDate(dateString){

  return new Date(
    dateString
  ).toLocaleDateString(
    'id-ID'
  );

}

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
loadViolations();

setInterval(()=>{

  loadViolations();

},5000);
