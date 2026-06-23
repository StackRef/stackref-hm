resource "auth0_client" "prod" {
  name                       = "StackRef"
  description                = "StackRef"
  app_type                   = "spa"
  logo_uri                   = "https://stackref-static-assets.s3.amazonaws.com/images/final-fat-hands-logo-only-med.png"
  custom_login_page_on       = true
  token_endpoint_auth_method = "none"
  oidc_conformant            = true

  callbacks = [
    "https://app.acme.example.com",
    "https://app.acme.example.com/dashboard"
  ]

  grant_types = ["authorization_code", "implicit", "refresh_token"]

  allowed_logout_urls = [
    "https://*.acme.example.com",
    "https://*.acme.example.com/dashboard"
  ]

  web_origins = [
    "https://*.acme.example.com"
  ]

  jwt_configuration {
    alg                 = "RS256"
    lifetime_in_seconds = 36000
  }

  refresh_token {
    leeway                  = 10
    rotation_type           = "rotating"
    expiration_type         = "expiring"
    token_lifetime          = 2592000
    infinite_token_lifetime = false
    idle_token_lifetime     = 1296000
  }
}

resource "auth0_client" "dev" {
  name                       = "StackRef (dev)"
  description                = "StackRef - Development"
  app_type                   = "spa"
  logo_uri                   = "https://stackref-static-assets.s3.amazonaws.com/images/final-fat-hands-logo-only-med.png"
  custom_login_page_on       = true
  token_endpoint_auth_method = "none"
  oidc_conformant            = true

  callbacks = [
    "https://dev.acme.example.com",
    "https://dev.acme.example.com/dashboard"
  ]

  grant_types = ["authorization_code", "implicit", "refresh_token"]

  allowed_logout_urls = [
    "https://*.acme.example.com",
    "https://*.acme.example.com/dashboard"
  ]

  web_origins = [
    "https://*.acme.example.com"
  ]

  jwt_configuration {
    alg                 = "RS256"
    lifetime_in_seconds = 36000
  }

  refresh_token {
    leeway                  = 10
    rotation_type           = "rotating"
    expiration_type         = "expiring"
    token_lifetime          = 2592000
    infinite_token_lifetime = false
    idle_token_lifetime     = 1296000
  }
}

resource "auth0_client" "backend" {
  name                       = "StackRef Backend (Test Application)"
  app_type                   = "non_interactive"
  token_endpoint_auth_method = "client_secret_post"
  grant_types                = ["client_credentials"]
  jwt_configuration {
    alg                 = "RS256"
    lifetime_in_seconds = 36000
  }
}

data "auth0_client" "auth0_actions" {
  name = "Auth0 Actions"
}

resource "auth0_client_grant" "backend" {
  client_id = auth0_client.backend.id
  audience  = auth0_resource_server.backend.identifier
  scope = [
    "event_read",
    "event_write",
    "organization_read",
    "organization_write",
    "platform_read",
    "platform_write",
    "team_read",
    "team_write",
    "bank_read",
    "bank_write",
    "user_read",
    "user_write",
    "invitation_read",
    "invitation_write"
  ]
}

resource "auth0_client" "aws_sso" {
  name     = "AWS SSO"
  app_type = "regular_web"

  callbacks = [
    "https://us-east-1.signin.aws.amazon.com/platform/saml/acs/3a637461-a526-41ba-82eb-ff03edda9f27"
  ]

  addons {
    samlp {
      destination = "https://us-east-1.signin.aws.amazon.com/platform/saml/acs/3a637461-a526-41ba-82eb-ff03edda9f27"
      mappings = {
        "email" = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        "name"  = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      }
      create_upn_claim              = false
      include_attribute_name_format = false
      lifetime_in_seconds           = 3600
      map_identities                = false
      name_identifier_format        = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
      name_identifier_probes = [
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      ]
      passthrough_claims_with_no_mapping = false
      typed_attributes                   = false
      #digest_algorithm                   = "sha256"
      #signature_algorithm                = "rsa-sha256"
    }
  }

  lifecycle {
    ignore_changes = [
      addons[0].samlp[0].digest_algorithm,
      addons[0].samlp[0].signature_algorithm
    ]
  }
}
