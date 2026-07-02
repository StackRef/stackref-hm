resource "auth0_custom_domain" "stackref_com" {
  domain = "auth.acme.example.com"
  type   = "auth0_managed_certs"
}

resource "auth0_branding" "stackref" {
  logo_url = "https://stackref-static-assets.s3.amazonaws.com/images/StackRef-Logo.svg"
  colors {
    primary         = "#2c8cf2"
    page_background = "#000819"
  }
}

resource "auth0_prompt" "default" {
  universal_login_experience = "new"
}

resource "auth0_role" "stackref_administrator" {
  name        = "Administrator"
  description = "StackRef Administrator"
}
