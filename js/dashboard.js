async function loadDashboard() {

  const user =
    JSON.parse(
      localStorage.getItem(
        'smart_exam_user'
      )
    );

  // BELUM LOGIN
  if(!user){

    window.location.href =
      'index.html';

    return;

  }

  // REQUEST API
  const result =
    await apiRequest({

      action:'getDashboard',

      school_npsn:
        user.school_npsn

    });

  console.log(result);

  // ERROR
  if(!result.success){

    alert('Gagal memuat dashboard');

    return;

  }

  const school =
    result.data.school;

  // NAMA SEKOLAH
  document.getElementById(
    'schoolName'
  ).innerText =
    school.school_name;

  // PLAN
  document.getElementById(
    'planBadge'
  ).innerText =
    school.plan_type.toUpperCase() + ' PLAN';

  // PREMIUM
  if(
    school.plan_type === 'premium'
  ){

    // HAPUS CARD UPGRADE
    document.getElementById(
      'upgradeCard'
    )?.remove();

    // HAPUS ICON GEMBOK
    document.getElementById(
      'liveLock'
    )?.remove();

    document.getElementById(
      'violationLock'
    )?.remove();

    // AKTIFKAN MENU
    document.getElementById(
      'liveSessionMenu'
    )?.classList.remove(
      'text-slate-500'
    );

    document.getElementById(
      'liveSessionMenu'
    )?.classList.add(
      'text-slate-700'
    );

  }

}
