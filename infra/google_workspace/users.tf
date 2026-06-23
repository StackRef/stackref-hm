resource "googleworkspace_user" "demo" {
  primary_email = "admin@example.com"

  name {
    family_name = "Avery"
    given_name  = "Jordan"
  }

  aliases = [
    "jordan.avery@example.com",
    "jordan@example.com"
  ]

  phones {
    type    = "work"
    primary = true
    value   = "(555) 555-0100"
  }

  keywords {
    type  = "occupation"
    value = "President/CEO"
  }

  recovery_email = "jordan@example.net"
}

#resource "googleworkspace_user" "tmorgan" {
#  primary_email = "tmorgan@example.com"
#
#  name {
#    family_name = "Morgan"
#    given_name  = "Taylor"
#  }
#
#  aliases = [
#    "taylor.morgan@example.com",
#    "walt@example.com"
#  ]
#
#  keywords {
#    type  = "occupation"
#    value = "Developer"
#  }
#
#  recovery_email = "user5@example.com"
#}
