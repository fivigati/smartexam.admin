function getDashboard(data) {

  const schoolNpsn =
    String(data.school_npsn).trim();

  // SHEETS
  const schoolsSheet =
    getSheet(CONFIG.SHEETS.SCHOOLS);

  const studentsSheet =
    getSheet(CONFIG.SHEETS.STUDENTS);

  const examsSheet =
    getSheet(CONFIG.SHEETS.EXAMS);

  const violationsSheet =
    getSheet(CONFIG.SHEETS.VIOLATIONS);

  // VALUES
  const schools =
    schoolsSheet.getDataRange().getValues();

  const students =
    studentsSheet.getDataRange().getValues();

  const exams =
    examsSheet.getDataRange().getValues();

  const violations =
    violationsSheet.getDataRange().getValues();

  // SCHOOL DATA
  let schoolData = null;

  for(let i = 1; i < schools.length; i++) {

    const npsn =
      String(schools[i][0]).trim();

    if(npsn === schoolNpsn) {

      schoolData = {

        npsn: schools[i][0],
        school_name: schools[i][1],
        education_department: schools[i][2],
        address: schools[i][3],
        email: schools[i][4],
        website: schools[i][5],
        principal_name: schools[i][6],
        operator_name: schools[i][7],
        whatsapp_number: schools[i][8],
        alternate_whatsapp: schools[i][9],
        city: schools[i][10],
        province: schools[i][11],
        logo_url: schools[i][12],
        plan_type: schools[i][13],
        subscription_expired_at: schools[i][14],
        notes: schools[i][15],
        is_active: schools[i][16]

      };

      break;

    }

  }

  // TOTALS
  const totalStudents =
    students.filter(
      r => String(r[1]).trim() === schoolNpsn
    ).length;

  const totalExams =
    exams.filter(
      r => String(r[1]).trim() === schoolNpsn
    ).length;

  const totalViolations =
    violations.filter(
      r => String(r[1]).trim() === schoolNpsn
    ).length;

  return jsonResponse({

    success: true,

    data: {

      school: schoolData,

      stats: {

        total_students: totalStudents,
        total_exams: totalExams,
        total_violations: totalViolations

      }

    }

  });

}
