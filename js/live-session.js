async function loadSessions() {

  const user =
    JSON.parse(
      localStorage.getItem(
        'smart_exam_user'
      )
    );

  if(!user){

    window.location.href =
      'index.html';

    return;

  }

  const result =
    await apiRequest({

      action:'getLiveSessions',
      school_npsn:user.school_npsn

    });

  console.log(result);

  if(!result.success) return;

  const table =
    document.getElementById(
      'sessionTable'
    );

  table.innerHTML = '';

  result.data.forEach(session => {

    table.innerHTML += `

      <tr class="border-b border-slate-100 hover:bg-slate-50 transition-all">

        <!-- NAMA -->
        <td class="px-5 py-4">

          <div class="flex flex-col">

            <span class="text-sm font-semibold text-slate-800">
              ${session.student_name}
            </span>

            <span class="text-xs text-slate-400 mt-1">
              ${session.student_class} • ${session.student_room}
            </span>

          </div>

        </td>

        <!-- FULLSCREEN -->
        <td class="px-5 py-4">
          ${renderFullscreen(
            session.fullscreen_status
          )}
        </td>

        <!-- VIOLATION -->
        <td class="px-5 py-4">

          ${renderViolation(
            session.violation_count
          )}

        </td>

        <!-- DEVICE -->
        <td class="px-5 py-4 text-sm text-slate-600">

          ${parseDeviceInfo(
            session.device_info
          )}

        </td>

        <!-- LAST SEEN -->
        <td class="px-5 py-4 text-sm text-slate-500">

          ${formatLastSeen(
            session.last_seen
          )}

        </td>

        <!-- STATUS -->
        <td class="px-5 py-4">

          ${renderStatus(
            session.session_status
          )}

        </td>

        <!-- AKSI -->
        <td class="px-5 py-4">

          <button

            onclick="deleteSession('${session.id}')"

            class="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-all">

            Hapus

          </button>

        </td>

      </tr>

    `;

  });

}
function renderFullscreen(status){

  if(status === 'FULL'){

    return `

      <div class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">

        <div class="h-2 w-2 rounded-full bg-emerald-500"></div>

        Fullscreen Aktif

      </div>

    `;

  }

  return `

    <div class="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">

      <span>⚠️</span>

      Keluar Fullscreen

    </div>

  `;

}
function renderViolation(count){

  count = Number(count);

  if(count >= 5){

    return `
      <div class="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
        ${count} Pelanggaran
      </div>
    `;

  }

  if(count >= 2){

    return `
      <div class="inline-flex rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-600">
        ${count} Pelanggaran
      </div>
    `;

  }

  return `
    <div class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
      Aman
    </div>
  `;

}
function parseDeviceInfo(deviceInfo){

  if(!deviceInfo)
    return 'Unknown Device';

  const info =
    deviceInfo.toLowerCase();

  // WINDOWS
  if(info.includes('win32')){

    return 'Chrome • Windows';

  }

  // ANDROID
  if(info.includes('linux arm')){

    return 'Android • Mobile';

  }

  // IPHONE
  if(info.includes('iphone')){

    return 'Safari • iPhone';

  }

  return deviceInfo;

}
function formatLastSeen(dateString){

  if(!dateString)
    return '-';

  return new Date(
    dateString
  ).toLocaleString('id-ID');

}
function renderStatus(status){

  const s =
    String(status).toLowerCase();

  // ONLINE
  if(s.includes('online')){

    return `
      <div class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
        ONLINE
      </div>
    `;

  }

  // RECONNECT
  if(s.includes('reconnect')){

    return `
      <div class="inline-flex rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-600">
        RECONNECT
      </div>
    `;

  }

  return `
    <div class="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
      DISCONNECTED
    </div>
  `;

}
async function deleteSession(id){

  const confirmDelete =
    confirm(
      'Hapus session ini?'
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

      action:'deleteSession',

      id,

      school_npsn:
        user.school_npsn

    });

  alert(result.message);

  loadSessions();

}
async function deleteAllSessions(){

  const confirmDelete =
    confirm(
      'Hapus semua session?'
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

      action:'deleteAllSessions',

      school_npsn:
        user.school_npsn

    });

  alert(result.message);

  loadSessions();

}
loadSessions();

setInterval(() => {

  loadSessions();

}, 5000);
