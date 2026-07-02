function handler(event) {
  var request = event.request;
  var projectId = '632559';

  request.uri = `/api/${projectId}/envelope/`;

  return request;
}
