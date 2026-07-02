

function handler(event) {
  var response = event.response;
  var headers = response.headers;

  // If origin header is missing, set it equal to the host header.
  //if (!headers.origin)
  //  headers.origin = {value:`https://${host}`};

  // If Access-Control-Allow-Origin CORS header is missing, add it.
  // Since JavaScript doesn't allow for hyphens in variable names, we use the dict["key"] notation.
  if (headers['origin']) {
    headers['access-control-allow-origin'] = {value: headers['origin'].value};
    console.log("Access-Control-Allow-Origin was missing, adding it now.");
  }
  
  // Set HTTP security headers
  // Since JavaScript doesn't allow for hyphens in variable names, we use the dict["key"] notation 
  headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubdomains; preload'}; 
  //headers['content-security-policy'] = { value: "default-src 'none'; img-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'"}; 
  headers['x-content-type-options'] = { value: 'nosniff'}; 
  headers['x-frame-options'] = {value: 'DENY'}; 
  headers['x-xss-protection'] = {value: '1; mode=block'};
  headers['referrer-policy'] = {value: 'same-origin'};

  // Set the cache-control header
  headers['cache-control'] = {value: 'public, max-age=0'};

  // Return the response to viewers 
  return response;
}
