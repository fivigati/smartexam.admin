function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getPostData(e) {

  return JSON.parse(
    e.parameter.data
  );

}

function generateId(prefix = '') {
  return prefix + Utilities.getUuid();
}

function now() {
  return new Date();
}
