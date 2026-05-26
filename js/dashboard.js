async function loadDashboard() {

  // =========================
  // GET USER LOGIN
  // =========================
  const user =
    JSON.parse(
      localStorage.getItem(
        'smart_exam_user'
      )
    );

  // =========================
  // BELUM LOGIN
  // =========================
  if(!user){

    window.location.href =
      'index.html';

    return;

  }

  try {

    // =========================
    // REQUEST API
    // =========================
    const result =
      await apiRequest({

        action:'getDashboard',

        school_npsn:
          user.school_npsn

      });

    console.log(result);

    // =========================
    // ERROR API
    // =========================
    if(!result.success){

      alert(
        result.message ||
        'Gagal memuat dashboard'
      );

      return;

    }

    // =========================
    // SCHOOL DATA
    // =========================
    const school =
      result.data.school || {};

    // =========================
    // SCHOOL NAME
    // =========================
    document.getElementById(
      'schoolName'
    )?.innerText =
      school.school_name ||
      'Smart Exam';

    // =========================
    // PLAN BADGE
    // =========================
    document.getElementById(
      'planBadge'
    )?.innerText =
      (
        school.plan_type ||
        'free'
      ).toUpperCase()
      +
      ' PLAN';

    // =========================
    // PREMIUM ACCESS
    // =========================
    if(
      school.plan_type
      ?.toLowerCase()
      .trim()
      ===
      'premium'
    ){

      // =====================
      // REMOVE UPGRADE CARD
      // =====================
      document.getElementById(
        'upgradeCard'
      )?.remove();

      // =====================
      // REMOVE LOCK ICONS
      // =====================
      document.getElementById(
        'liveLock'
      )?.remove();

      document.getElementById(
        'violationLock'
      )?.remove();

      // =====================
      // ACTIVATE LIVE SESSION
      // =====================
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

      // =====================
      // ACTIVATE VIOLATION MENU
      // =====================
      document.getElementById(
        'violationMenu'
      )?.classList.remove(
        'text-slate-500'
      );

      document.getElementById(
        'violationMenu'
      )?.classList.add(
        'text-slate-700'
      );

    }

  } catch(err){

    console.error(err);

    alert(
      'Terjadi kesalahan saat memuat dashboard'
    );

  }

}
