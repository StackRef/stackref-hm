resource "auth0_action" "login" {
  name = "Submit to StackRef API (Login)"
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  runtime = "node16"
  code    = file("${path.module}/../post-login.js")

  dependencies {
    name    = "@slack/webhook"
    version = "6.1.0"
  }
  dependencies {
    name    = "@sentry/node"
    version = "7.43.0"
  }
  dependencies {
    name    = "@sentry/tracing"
    version = "7.43.0"
  }

  secrets {
    name  = "SR_AUTH0_CLIENT_ID"
    value = var.be_auth0_client_id
  }
  secrets {
    name  = "SR_AUTH0_CLIENT_SECRET"
    value = var.be_auth0_client_secret
  }
  secrets {
    name  = "SLACK_WEBHOOK_URL"
    value = var.slack_webhook_url
  }
  secrets {
    name  = "SENTRY_DSN"
    value = var.sentry_dsn
  }

  deploy = true
}

resource "auth0_action" "post_registration" {
  name = "Submit to StackRef API (Registration)"
  supported_triggers {
    id      = "post-user-registration"
    version = "v2"
  }
  runtime = "node16"
  code    = file("${path.module}/../post-user-registration.js")

  dependencies {
    name    = "@slack/webhook"
    version = "6.1.0"
  }
  dependencies {
    name    = "@sentry/node"
    version = "7.43.0"
  }
  dependencies {
    name    = "@sentry/tracing"
    version = "7.43.0"
  }

  secrets {
    name  = "SR_AUTH0_CLIENT_ID"
    value = var.be_auth0_client_id
  }
  secrets {
    name  = "SR_AUTH0_CLIENT_SECRET"
    value = var.be_auth0_client_secret
  }
  secrets {
    name  = "SLACK_WEBHOOK_URL"
    value = var.slack_webhook_url
  }
  secrets {
    name  = "SENTRY_DSN"
    value = var.sentry_dsn
  }

  deploy = true
}
