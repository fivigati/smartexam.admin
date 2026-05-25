const API_URL =
'https://script.google.com/macros/s/AKfycbx3SamwedBeCTTJGfN3BXMr0CEePYNupPsbxspwGM4GzA2izbWy5we-qo_SBWASh51BRA/exec';

async function apiRequest(payload) {

  try {

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log(text);
    return JSON.parse(text);

  } catch(err) {

    console.error(err);

    return {
      success: false,
      message: 'Server error'
    };

  }

}
