async function login() {

  const npsn =
    document.getElementById('npsn').value.trim();

  const password =
    document.getElementById('password').value.trim();

  const button =
    document.getElementById('loginBtn');

  const text =
    document.getElementById('loginText');

  if(!npsn || !password) {

    alert('NPSN dan password wajib diisi');

    return;
  }

  // LOADING STATE
  button.disabled = true;

  button.classList.add(
    'opacity-70',
    'cursor-not-allowed'
  );

  text.innerHTML = `
    <div class="flex items-center justify-center gap-2">

      <svg
        class="animate-spin h-4 w-4 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24">

        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4">
        </circle>

        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 00-10 10h2z">
        </path>

      </svg>

      <span>Memverifikasi...</span>

    </div>
  `;

  const result = await apiRequest({

    action:'login',
    npsn,
    password

  });

  console.log(result);

  if(result.success) {

    text.innerHTML = 'Berhasil Login...';

    setTimeout(() => {

      localStorage.setItem(
        'smart_exam_user',
        JSON.stringify(result.user)
      );

      window.location.href =
        'dashboard.html';

    }, 700);

  } else {

    alert(result.message);

    button.disabled = false;

    button.classList.remove(
      'opacity-70',
      'cursor-not-allowed'
    );

    text.innerHTML =
      'Masuk ke Dashboard';

  }

}
