resource "googleworkspace_domain_alias" "stackref_io" {
  parent_domain_name = "example.com"
  domain_alias_name  = "example.io"
}

resource "googleworkspace_domain_alias" "s6f_io" {
  parent_domain_name = "example.com"
  domain_alias_name  = "s6f.io"
}
