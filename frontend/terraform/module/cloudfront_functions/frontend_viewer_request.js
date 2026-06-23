function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var body = '';

  const redirect = request.method === 'POST' && request.body.data;

  if (redirect) {
    body = Buffer.from(request.body.data, 'base64').toString();
    body = `?${body}`;
  }
  
  // Check whether the URI is missing a file name.
  if (uri.endsWith('/')) {
      request.uri += `index.html${body}`;
  } 
  // Check whether the URI is missing a file extension.
  else if (!uri.includes('.')) {
      request.uri = `/index.html${body}`;
  }

  return request;
}
