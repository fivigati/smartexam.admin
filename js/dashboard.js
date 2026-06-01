async function loadDashboard() {

  // =========================
  // GET USER LOGIN
  // =========================
  const user = JSON.parse(localStorage.getItem('smart_exam_user'));

  // =========================
  // BELUM LOGIN
  // =========================
  if(!user){
    window.location.href = 'index.html';
    return;
  }

  // =========================
  // OPTIMISTIC UI LOAD (INSTAN)
  // =========================
  if(user.school_name) {
    const schoolNameEl = document.getElementById('schoolName');
    if(schoolNameEl) schoolNameEl.innerText = user.school_name;
  }
  
  if(user.plan_type) {
    const planBadgeEl = document.getElementById('planBadge');
    if(planBadgeEl) planBadgeEl.innerText = user.plan_type.toUpperCase() + ' PLAN';

    if(user.plan_type.toLowerCase().trim() === 'premium'){
      document.getElementById('upgradeCard')?.remove();
      document.getElementById('liveLock')?.remove();
      document.getElementById('violationLock')?.remove();

      document.getElementById('liveSessionMenu')?.classList.remove('text-slate-500');
      document.getElementById('liveSessionMenu')?.classList.add('text-slate-700');
      document.getElementById('violationMenu')?.classList.remove('text-slate-500');
      document.getElementById('violationMenu')?.classList.add('text-slate-700');
    }
  }

  try {
    const result = await apiRequest({
        action:'getDashboard',
        school_npsn: user.school_npsn
    });

    console.log(result);

    if(!result.success){
      console.warn(result.message || 'Gagal memuat data statistik terbaru');
      return;
    }

    const school = result?.data?.school || {};
    
    if(school.school_name && school.plan_type) {
        user.school_name = school.school_name;
        user.plan_type = school.plan_type;
        localStorage.setItem('smart_exam_user', JSON.stringify(user));
    }

  } catch(err){
    console.error(err);
  }
}
