exports.lambdaHandler = async (event) => {
  const { request } = event.Records[0].cf;
  const uri = request.uri;

  const redirect = request.method === 'POST' && request.body.data;

  if (redirect) {
    const body = Buffer.from(request.body.data, 'base64').toString();
    return {
      status: '302',
      statusDescription: 'Found',
      headers: {
        location: [{
          key: 'Location',
          value: `/?${body}`,
        }],
      },
    };
  }

  // Check whether the URI is missing a file name.
  if (uri.endsWith('/')) {
    request.uri += 'index.html';
  } 
  // Check whether the URI is missing a file extension.
  else if (!uri.includes('.')) {
    request.uri = '/index.html';
  }

  return request;
};
