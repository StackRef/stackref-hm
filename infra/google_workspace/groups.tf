resource "googleworkspace_group" "beta" {
  email       = "beta@example.com"
  name        = "Beta"
  description = "Beta test sign-ups and communication"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_settings" "beta" {
  email = googleworkspace_group.beta.email

  allow_external_members = false
  is_archived            = false

  who_can_join            = "INVITED_CAN_JOIN"
  who_can_view_group      = "ALL_MEMBERS_CAN_VIEW"
  who_can_view_membership = "ALL_MANAGERS_CAN_VIEW"
  who_can_post_message    = "ANYONE_CAN_POST"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_members" "beta" {
  group_id = googleworkspace_group.beta.id

  members {
    email = googleworkspace_user.demo.primary_email
    role  = "OWNER"
  }
}

resource "googleworkspace_group" "github" {
  email       = "github@example.com"
  name        = "GitHub"
  description = "GitHub account"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_settings" "github" {
  email = googleworkspace_group.github.email

  allow_external_members = false
  is_archived            = false

  who_can_join            = "INVITED_CAN_JOIN"
  who_can_view_group      = "ALL_MEMBERS_CAN_VIEW"
  who_can_view_membership = "ALL_MANAGERS_CAN_VIEW"
  who_can_post_message    = "ANYONE_CAN_POST"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_member" "github_demo" {
  group_id = googleworkspace_group.github.id
  email    = googleworkspace_user.demo.primary_email

  role = "OWNER"
}

resource "googleworkspace_group" "info" {
  email       = "info@example.com"
  name        = "Info"
  description = "General info emails"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_settings" "info" {
  email = googleworkspace_group.info.email

  allow_external_members = false
  is_archived            = false

  who_can_join            = "INVITED_CAN_JOIN"
  who_can_view_group      = "ALL_MEMBERS_CAN_VIEW"
  who_can_view_membership = "ALL_MANAGERS_CAN_VIEW"
  who_can_post_message    = "ANYONE_CAN_POST"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_members" "info" {
  group_id = googleworkspace_group.info.id

  members {
    email = googleworkspace_user.demo.primary_email
    role  = "OWNER"
  }
}

resource "googleworkspace_group" "instagram" {
  email       = "instagram@example.com"
  name        = "StackRef Instagram"
  description = "StackRef Instagram account"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_settings" "instagram" {
  email = googleworkspace_group.instagram.email

  allow_external_members = false
  is_archived            = false

  who_can_join            = "INVITED_CAN_JOIN"
  who_can_view_group      = "ALL_MEMBERS_CAN_VIEW"
  who_can_view_membership = "ALL_MANAGERS_CAN_VIEW"
  who_can_post_message    = "ANYONE_CAN_POST"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_members" "instagram" {
  group_id = googleworkspace_group.instagram.id

  members {
    email = googleworkspace_user.demo.primary_email
    role  = "OWNER"
  }
}

resource "googleworkspace_group" "notices" {
  email       = "notices@example.com"
  name        = "Notices"
  description = "Notices regarding StackRef accounts"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_settings" "notices" {
  email = googleworkspace_group.notices.email

  allow_external_members = false
  is_archived            = false

  who_can_join            = "INVITED_CAN_JOIN"
  who_can_view_group      = "ALL_MEMBERS_CAN_VIEW"
  who_can_view_membership = "ALL_MANAGERS_CAN_VIEW"
  who_can_post_message    = "ANYONE_CAN_POST"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_members" "notices" {
  group_id = googleworkspace_group.notices.id

  members {
    email = googleworkspace_user.demo.primary_email
    role  = "OWNER"
  }
}

resource "googleworkspace_group" "postmaster" {
  email       = "postmaster@example.com"
  name        = "Postmaster"
  description = "Postmaster, hostmaster, etc. address"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_settings" "postmaster" {
  email = googleworkspace_group.postmaster.email

  allow_external_members = false
  is_archived            = false

  who_can_join            = "CAN_REQUEST_TO_JOIN"
  who_can_view_group      = "ALL_MEMBERS_CAN_VIEW"
  who_can_view_membership = "ALL_MEMBERS_CAN_VIEW"
  who_can_post_message    = "ANYONE_CAN_POST"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_members" "postmaster" {
  group_id = googleworkspace_group.postmaster.id

  members {
    email = googleworkspace_user.demo.primary_email
    role  = "OWNER"
  }
}

resource "googleworkspace_group" "sales" {
  email       = "sales@example.com"
  name        = "Sales"
  description = "Sales inquiries"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_settings" "sales" {
  email = googleworkspace_group.sales.email

  allow_external_members = false
  is_archived            = false

  who_can_join            = "INVITED_CAN_JOIN"
  who_can_view_group      = "ALL_MEMBERS_CAN_VIEW"
  who_can_view_membership = "ALL_MANAGERS_CAN_VIEW"
  who_can_post_message    = "ANYONE_CAN_POST"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_members" "sales" {
  group_id = googleworkspace_group.sales.id

  members {
    email = googleworkspace_user.demo.primary_email
    role  = "OWNER"
  }
}

resource "googleworkspace_group" "twitter" {
  email       = "twitter@example.com"
  name        = "Twitter"
  description = "StackRef Twitter account"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_settings" "twitter" {
  email = googleworkspace_group.twitter.email

  allow_external_members = false
  is_archived            = false

  who_can_join            = "INVITED_CAN_JOIN"
  who_can_view_group      = "ALL_MEMBERS_CAN_VIEW"
  who_can_view_membership = "ALL_MANAGERS_CAN_VIEW"
  who_can_post_message    = "ANYONE_CAN_POST"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_members" "twitter" {
  group_id = googleworkspace_group.twitter.id

  members {
    email = googleworkspace_user.demo.primary_email
    role  = "OWNER"
  }
}

resource "googleworkspace_group" "stackref-marketplace" {
  email       = "stackref-marketplace@example.com"
  name        = "StackRef Marketplace"
  description = "StackRef Marketplace AWS account"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_settings" "stackref-marketplace" {
  email = googleworkspace_group.stackref-marketplace.email

  allow_external_members = false
  is_archived            = false

  who_can_join            = "INVITED_CAN_JOIN"
  who_can_view_group      = "ALL_MEMBERS_CAN_VIEW"
  who_can_view_membership = "ALL_MANAGERS_CAN_VIEW"
  who_can_post_message    = "ANYONE_CAN_POST"
}

resource "googleworkspace_group_members" "stackref-marketplace" {
  group_id = googleworkspace_group.stackref-marketplace.id

  members {
    email = googleworkspace_user.demo.primary_email
    role  = "OWNER"
  }
}

resource "googleworkspace_group" "invitations" {
  email       = "invitations@example.com"
  name        = "Invitations"
  description = "Reply-to address for sent Organization Invitations"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_settings" "invitations" {
  email = googleworkspace_group.invitations.email

  allow_external_members = false
  is_archived            = false

  who_can_join            = "INVITED_CAN_JOIN"
  who_can_view_group      = "ALL_MEMBERS_CAN_VIEW"
  who_can_view_membership = "ALL_MANAGERS_CAN_VIEW"
  who_can_post_message    = "ANYONE_CAN_POST"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_members" "invitations" {
  group_id = googleworkspace_group.invitations.id

  members {
    email = googleworkspace_user.demo.primary_email
    role  = "OWNER"
  }
}

resource "googleworkspace_group" "support" {
  email       = "support@example.com"
  name        = "Support"
  description = "Support requests"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_settings" "support" {
  email = googleworkspace_group.support.email

  allow_external_members = false
  is_archived            = false

  who_can_join            = "INVITED_CAN_JOIN"
  who_can_view_group      = "ALL_MEMBERS_CAN_VIEW"
  who_can_view_membership = "ALL_MANAGERS_CAN_VIEW"
  who_can_post_message    = "ANYONE_CAN_POST"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_members" "support" {
  group_id = googleworkspace_group.support.id

  members {
    email = googleworkspace_user.demo.primary_email
    role  = "OWNER"
  }
}

resource "googleworkspace_group" "aws_accounts" {
  email       = "stackref-aws-account@example.com"
  name        = "AWS account notices"
  description = "Various AWS account notices when tied to AWS account root logins"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_settings" "aws_accounts" {
  email = googleworkspace_group.aws_accounts.email

  allow_external_members = false
  is_archived            = false

  who_can_join            = "INVITED_CAN_JOIN"
  who_can_view_group      = "ALL_MEMBERS_CAN_VIEW"
  who_can_view_membership = "ALL_MANAGERS_CAN_VIEW"
  who_can_post_message    = "ANYONE_CAN_POST"

  timeouts {
    create = "10m"
    update = "10m"
  }
}

resource "googleworkspace_group_members" "aws_accounts" {
  group_id = googleworkspace_group.aws_accounts.id

  members {
    email = googleworkspace_user.demo.primary_email
    role  = "OWNER"
  }
}
