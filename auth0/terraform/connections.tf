resource "auth0_connection" "auth0_db" {
  name     = "Username-Password-Authentication"
  strategy = "auth0"
  options {
    password_policy = "good"
    password_history {
      enable = true
      size   = 3
    }
    brute_force_protection = "true"
  }
}

resource "auth0_connection" "google" {
  name         = "google-oauth2"
  display_name = "Google"
  strategy     = "google-oauth2"

  options {
    allowed_audiences              = []
    api_enable_users               = false
    brute_force_protection         = false
    client_id                      = var.google_application_id
    client_secret                  = var.google_secret
    custom_scripts                 = {}
    debug                          = false
    disable_cache                  = false
    disable_signup                 = false
    domain_aliases                 = []
    enabled_database_customization = false
    import_mode                    = false
    ips                            = []
    non_persistent_attrs           = []
    requires_username              = false
    scopes                         = ["email", "profile"]
    scripts                        = {}
    sign_saml_request              = false
    strategy_version               = 0
    use_cert_auth                  = false
    use_kerberos                   = false
    use_wsfed                      = false
    waad_common_endpoint           = false
  }
}

resource "auth0_connection" "github" {
  name         = "github"
  display_name = "GitHub"
  strategy     = "github"

  options {
    allowed_audiences              = []
    api_enable_users               = false
    brute_force_protection         = false
    client_id                      = var.github_application_id
    client_secret                  = var.github_secret
    custom_scripts                 = {}
    debug                          = false
    disable_cache                  = false
    disable_signup                 = false
    domain_aliases                 = []
    enabled_database_customization = false
    import_mode                    = false
    ips                            = []
    non_persistent_attrs           = []
    requires_username              = false
    scopes                         = ["email", "profile"]
    scripts                        = {}
    sign_saml_request              = false
    strategy_version               = 0
    use_cert_auth                  = false
    use_kerberos                   = false
    use_wsfed                      = false
    waad_common_endpoint           = false
  }
}

# resource "auth0_connection" "gitlab" {
#   name         = "gitlab"
#   strategy     = "oauth2"
#   realms       = ["gitlab"]
#   display_name = "GitLab"

#   options {
#     allowed_audiences              = []
#     authorization_endpoint         = "https://gitlab.com/oauth/authorize"
#     api_enable_users               = false
#     brute_force_protection         = false
#     client_id                      = var.gitlab_application_id
#     client_secret                  = var.gitlab_secret
#     custom_scripts                 = {}
#     debug                          = false
#     disable_cache                  = false
#     disable_signup                 = false
#     domain_aliases                 = []
#     enabled_database_customization = false
#     import_mode                    = false
#     ips                            = []
#     non_persistent_attrs           = []
#     requires_username              = false
#     scopes                         = ["openid"]
#     scripts = {
#       fetchUserProfile = <<-EOT
# function fetchUserProfile(accessToken, context, callback) {
#   request.get(
#     {
#       url: 'https://gitlab.com/oauth/userinfo',
#       headers: {
#         'Authorization': 'Bearer ' + accessToken,
#       }
#     },
#     (err, resp, body) => {
#       if (err) {
#         return callback(err);
#       }
#       if (resp.statusCode !== 200) {
#         return callback(new Error(body));
#       }
#       let bodyParsed;
#       try {
#         bodyParsed = JSON.parse(body);
#       } catch (jsonError) {
#         return callback(new Error(body));
#       }
#       const profile = {
#         user_id: bodyParsed.sub,
#         email: bodyParsed.email,
#         name: bodyParsed.name,
#         nickname: bodyParsed.nickname,
#         given_name: bodyParsed.name.split(' ')[0],
#         family_name: bodyParsed.name.split(' ')[1],
#         picture: bodyParsed.picture
#       };
#       callback(null, profile);
#     }
#   );
# }
# EOT
#     }
#     sign_saml_request    = false
#     strategy_version     = 0
#     token_endpoint       = "https://gitlab.com/oauth/token"
#     use_cert_auth        = false
#     use_kerberos         = false
#     use_wsfed            = false
#     waad_common_endpoint = false
#   }
# }

resource "auth0_connection_client" "google_auth0_actions" {
  connection_id = auth0_connection.google.id
  client_id     = data.auth0_client.auth0_actions.client_id
}

resource "auth0_connection_client" "google_prod" {
  connection_id = auth0_connection.google.id
  client_id     = auth0_client.prod.client_id
}

# resource "auth0_connection_client" "google_beta" {
#   connection_id = auth0_connection.google.id
#   client_id     = auth0_client.beta.client_id
# }

resource "auth0_connection_client" "google_dev" {
  connection_id = auth0_connection.google.id
  client_id     = auth0_client.dev.client_id
}

# resource "auth0_connection_client" "google_local" {
#   connection_id = auth0_connection.google.id
#   client_id     = auth0_client.local.client_id
# }

resource "auth0_connection_client" "google_backend" {
  connection_id = auth0_connection.google.id
  client_id     = auth0_client.backend.client_id
}

resource "auth0_connection_client" "google_aws_sso" {
  connection_id = auth0_connection.google.id
  client_id     = auth0_client.aws_sso.client_id
}

resource "auth0_connection_client" "github_auth0_actions" {
  connection_id = auth0_connection.github.id
  client_id     = data.auth0_client.auth0_actions.client_id
}

resource "auth0_connection_client" "github_prod" {
  connection_id = auth0_connection.github.id
  client_id     = auth0_client.prod.client_id
}

# resource "auth0_connection_client" "github_beta" {
#   connection_id = auth0_connection.github.id
#   client_id     = auth0_client.beta.client_id
# }

resource "auth0_connection_client" "github_dev" {
  connection_id = auth0_connection.github.id
  client_id     = auth0_client.dev.client_id
}

# resource "auth0_connection_client" "github_local" {
#   connection_id = auth0_connection.github.id
#   client_id     = auth0_client.local.client_id
# }

resource "auth0_connection_client" "github_backend" {
  connection_id = auth0_connection.github.id
  client_id     = auth0_client.backend.client_id
}
