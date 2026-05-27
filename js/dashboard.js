async function loadDashboard() {

  // =========================
  // GET USER LOGIN
  // =========================
  const user = JSON.parse(localStorage.getItem('smart_exam_user')); //

  // =========================
  // BELUM LOGIN
  // =========================
  if(!user){
    window.location.href = 'index.html'; //
    return;
  }

  // =========================
  // OPTIMISTIC UI LOAD (INSTAN)
  // Memuat data dari localStorage terlebih dahulu
  // =========================
  if(user.school_name) {
    const schoolNameEl = document.getElementById('schoolName');
    if(schoolNameEl) schoolNameEl.innerText = user.school_name;
  }
  if(user.operator_name || user.full_name) {
  const operatorNameEl = document.getElementById('operatorName');
  if(operatorNameEl) {
    operatorNameEl.innerText = user.operator_name || user.full_name;
  }
}

  if(user.plan_type) {
    const planBadgeEl = document.getElementById('planBadge');
    if(planBadgeEl) planBadgeEl.innerText = user.plan_type.toUpperCase() + ' PLAN';

    if(user.plan_type.toLowerCase().trim() === 'premium'){
      // Hapus Banner dan Lock secara instan
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
    // =========================
    // REQUEST API
    // Tetap dijalankan untuk mengambil data dinamis lainnya (misal: statistik, jumlah ujian, dll)
    // =========================
    const result = await apiRequest({
        action:'getDashboard', //
        school_npsn: user.school_npsn
    });

    console.log(result); //

    if(!result.success){
      alert(result.message || 'Gagal memuat data dashboard terbaru'); //
      return;
    }

    // Jika API mengembalikan data sekolah yang baru, Anda bisa menimpa UI di sini
    // untuk memastikan datanya selalu valid/sinkron dengan server.
    const school = result?.data?.school || {}; //
    
    // (Opsional) Sinkronisasi data ke localStorage agar login berikutnya selalu mendapat data terbaru
    if(school.school_name && school.plan_type) {
        user.school_name = school.school_name;
        user.plan_type = school.plan_type;
        localStorage.setItem('smart_exam_user', JSON.stringify(user));
    }

  } catch(err){
    console.error(err); //
  }
}
