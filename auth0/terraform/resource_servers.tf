resource "auth0_resource_server" "backend" {
  name        = "StackRef Backend"
  identifier  = "https://be.acme.example.com"
  signing_alg = "RS256"

  scopes {
    value       = "event_read"
    description = "Read Event data"
  }

  scopes {
    value       = "event_write"
    description = "Update Event data"
  }

  scopes {
    value       = "organization_read"
    description = "Read Organization data"
  }

  scopes {
    value       = "organization_write"
    description = "Update Organization data"
  }

  scopes {
    value       = "platform_read"
    description = "ADMIN: Read all StackRef platform data"
  }

  scopes {
    value       = "platform_write"
    description = "ADMIN: Update all StackRef platform data"
  }

  scopes {
    value       = "team_read"
    description = "Read Team data"
  }

  scopes {
    value       = "team_write"
    description = "Update Team data"
  }

  scopes {
    value       = "bank_read"
    description = "Read Organization bank data"
  }

  scopes {
    value       = "bank_write"
    description = "Update Organization bank data"
  }

  scopes {
    value       = "user_read"
    description = "Read User data"
  }

  scopes {
    value       = "user_write"
    description = "Update User data"
  }

  scopes {
    value       = "invitation_read"
    description = "Read Organization Invitation data"
  }

  scopes {
    value       = "invitation_write"
    description = "Update Organization Invitation data"
  }

  enforce_policies                                = true
  allow_offline_access                            = true
  token_lifetime                                  = 86400
  token_lifetime_for_web                          = 7200
  token_dialect                                   = "access_token_authz"
  skip_consent_for_verifiable_first_party_clients = true
}
