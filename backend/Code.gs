function doPost(e) {
  try {

    const body = getPostData(e);
    const action = body.action;

    switch(action) {

  case 'login':
    return login(body);

  case 'getDashboard':
    return getDashboard(body);

  case 'getStudents':
    return getStudents(body);

  case 'saveStudent':
    return saveStudent(body);

  case 'deleteStudent':
    return deleteStudent(body);

  // LIVE SESSION
  case 'getLiveSessions':
    return getLiveSessions(body);

  case 'deleteSession':
    return deleteSession(body);

  case 'deleteAllSessions':
    return deleteAllSessions(body);

  // VIOLATIONS
  case 'getViolations':
  return getViolations(body);

  case 'resetViolationStudent':
  return resetViolationStudent(body);

  case 'deleteAllViolations':
  return deleteAllViolations(body);

  default:
    return jsonResponse({
      success: false,
      message: 'Invalid action'
    });

}

  } catch(err) {

    return jsonResponse({
      success: false,
      error: err.toString()
    });

  }
}
