async function login() {

  const npsn =
    document.getElementById('npsn').value.trim();

  const password =
    document.getElementById('password').value.trim();

  if(!npsn || !password) {

    alert('NPSN dan password wajib diisi');

    return;
  }

  const result = await apiRequest({

    action: 'login',
    npsn,
    password

  });

  console.log(result);

  if(result.success) {

    localStorage.setItem(
      'smart_exam_user',
      JSON.stringify(result.user)
    );

    window.location.href =
      'dashboard.html';

  } else {

    alert(result.message);

  }

}
