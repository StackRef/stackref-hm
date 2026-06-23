function fetchUserProfile(accessToken, context, callback) {
  request.get(
    {
      url: 'https://gitlab.com/oauth/userinfo',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
      }
    },
    (err, resp, body) => {
      if (err) {
        return callback(err);
      }
      if (resp.statusCode !== 200) {
        return callback(new Error(body));
      }
      let bodyParsed;
      try {
        bodyParsed = JSON.parse(body);
      } catch (jsonError) {
        return callback(new Error(body));
      }
      const profile = {
        user_id: bodyParsed.sub,
        email: bodyParsed.email,
        name: bodyParsed.name,
        nickname: bodyParsed.nickname,
        given_name: bodyParsed.name.split(' ')[0],
        family_name: bodyParsed.name.split(' ')[1],
        picture: bodyParsed.picture
      };
      callback(null, profile);
    }
  );
}
