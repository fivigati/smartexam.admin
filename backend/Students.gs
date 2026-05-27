function getStudents(data) {

  const schoolNpsn = data.school_npsn;

  const sheet = getSheet(CONFIG.SHEETS.STUDENTS);

  const values = sheet.getDataRange().getValues();

  const headers = values[0];

  const result = [];

  for(let i = 1; i < values.length; i++) {

    const row = values[i];

    if(row[1] != schoolNpsn) continue;

    let obj = {};

    headers.forEach((header, index) => {
      obj[header] = row[index];
    });

    result.push(obj);

  }

  return jsonResponse({
    success: true,
    data: result
  });

}

function saveStudent(data) {

  const sheet = getSheet(CONFIG.SHEETS.STUDENTS);

  sheet.appendRow([
    data.nisn,
    data.school_npsn,
    data.grade_level,
    data.full_name,
    data.class_name,
    data.description,
    data.room_name,
    'active',
    '',
    '',
    now()
  ]);

  return jsonResponse({
    success: true,
    message: 'Siswa berhasil ditambahkan'
  });

}

function deleteStudent(data) {

  const sheet = getSheet(CONFIG.SHEETS.STUDENTS);

  const values = sheet.getDataRange().getValues();

  for(let i = values.length - 1; i >= 1; i--) {

    if(values[i][0] == data.nisn) {
      sheet.deleteRow(i + 1);
    }

  }

  return jsonResponse({
    success: true,
    message: 'Siswa berhasil dihapus'
  });

}
