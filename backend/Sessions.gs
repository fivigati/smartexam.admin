function getLiveSessions(data) {

  const schoolNpsn =
    String(data.school_npsn).trim();

  const sheet =
    getSheet(CONFIG.SHEETS.LIVE_SESSIONS);

  const values =
    sheet.getDataRange().getValues();

  const headers =
    values[0];

  const result = [];

  for(let i = 1; i < values.length; i++) {

    const row = values[i];

    if(

      String(row[1]).trim() !==
      schoolNpsn

    ) continue;

    let obj = {};

    headers.forEach((header, index) => {

      obj[header] = row[index];

    });

    result.push(obj);

  }

  return jsonResponse({

    success:true,
    data:result

  });

}
function deleteSession(data) {

  const sheet =
    getSheet(CONFIG.SHEETS.LIVE_SESSIONS);

  const values =
    sheet.getDataRange().getValues();

  for(let i = values.length - 1; i >= 1; i--) {

    const id =
      String(values[i][0]).trim();

    const schoolNpsn =
      String(values[i][1]).trim();

    if(

      id === String(data.id).trim() &&
      schoolNpsn ===
      String(data.school_npsn).trim()

    ) {

      sheet.deleteRow(i + 1);

    }

  }

  return jsonResponse({

    success:true,
    message:'Session berhasil dihapus'

  });

}
function deleteAllSessions(data) {

  const sheet =
    getSheet(CONFIG.SHEETS.LIVE_SESSIONS);

  const values =
    sheet.getDataRange().getValues();

  for(let i = values.length - 1; i >= 1; i--) {

    if(

      String(values[i][1]).trim() ===
      String(data.school_npsn).trim()

    ) {

      sheet.deleteRow(i + 1);

    }

  }

  return jsonResponse({

    success:true,
    message:'Semua session berhasil dihapus'

  });

}
