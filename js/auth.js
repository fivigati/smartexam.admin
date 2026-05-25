function login(data) {

  const sheet =
    getSheet(CONFIG.SHEETS.USERS);

  const values =
    sheet.getDataRange().getValues();

  const headers = values[0];

  const npsnIndex =
    headers.indexOf('school_npsn');

  const passwordIndex =
    headers.indexOf('password');

  const activeIndex =
    headers.indexOf('is_active');

  for(let i = 1; i < values.length; i++) {

    const row = values[i];

    const schoolNpsn = row[npsnIndex];
    const password = row[passwordIndex];
    const isActive = row[activeIndex];

    if(
      schoolNpsn == data.npsn &&
      password == data.password &&
      isActive == true
    ) {

      return jsonResponse({
        success: true,

        user: {
          id: row[0],
          school_npsn: row[1],
          full_name: row[2],
          email: row[3],
          role: row[4]
        }
      });

    }

  }

  return jsonResponse({
    success: false,
    message: 'NPSN atau password salah'
  });

}
