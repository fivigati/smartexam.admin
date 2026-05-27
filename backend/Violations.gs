function getViolations(data) {

  const schoolNpsn =
    String(data.school_npsn).trim();

  const violationsSheet =
    getSheet(CONFIG.SHEETS.VIOLATIONS);

  const examsSheet =
    getSheet(CONFIG.SHEETS.EXAMS);

  const violationValues =
    violationsSheet.getDataRange().getValues();

  const examValues =
    examsSheet.getDataRange().getValues();

  const violationHeaders =
    violationValues[0];

// =========================
// HEADER EXAMS
// =========================
const examHeaders =
  examValues[0];

// =========================
// INDEX EXAMS
// =========================
const examIdIndex =
  examHeaders.indexOf('id');

const subjectIndex =
  examHeaders.indexOf('subject');

// =========================
// MAP EXAM
// =========================
let examMap = {};

for(let i = 1; i < examValues.length; i++){

  const row = examValues[i];

  const examId =
    String(
      row[examIdIndex]
    ).trim();

  const subject =
    String(
      row[subjectIndex]
    ).trim();

  examMap[examId] =
    subject;

}

  let result = [];

  for(let i = 1; i < violationValues.length; i++){

    const row = violationValues[i];

    if(
      String(row[1]).trim() !== schoolNpsn
    ) continue;

    let obj = {};

    violationHeaders.forEach((header,index)=>{

      obj[header] = row[index];

    });

    // SUBJECT
    obj.subject =
    result.push(obj);
    }

  // SORT TERBARU
  result.sort((a,b)=>{

    return new Date(b.created_at)
      -
      new Date(a.created_at);

  });

  return jsonResponse({

    success:true,
    data:result

  });

}
function resetViolationStudent(data){

  const sheet =
    getSheet(CONFIG.SHEETS.VIOLATIONS);

  const values =
    sheet.getDataRange().getValues();

  for(let i = values.length - 1; i >= 1; i--){

    const nisn =
      String(values[i][2]).trim();

    const schoolNpsn =
      String(values[i][1]).trim();

    if(

      nisn ===
      String(data.student_nisn).trim()

      &&

      schoolNpsn ===
      String(data.school_npsn).trim()

    ){

      sheet.deleteRow(i + 1);

    }

  }

  return jsonResponse({

    success:true,
    message:'Pelanggaran siswa berhasil direset'

  });

}
function deleteAllViolations(data){

  const sheet =
    getSheet(CONFIG.SHEETS.VIOLATIONS);

  const values =
    sheet.getDataRange().getValues();

  for(let i = values.length - 1; i >= 1; i--){

    const schoolNpsn =
      String(values[i][1]).trim();

    if(

      schoolNpsn ===
      String(data.school_npsn).trim()

    ){

      sheet.deleteRow(i + 1);

    }

  }

  return jsonResponse({

    success:true,
    message:'Semua log pelanggaran berhasil dihapus'

  });

}
