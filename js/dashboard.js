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

    document.getElementById(
      'upgradeCard'
    ).style.display = 'none';

  }

}
