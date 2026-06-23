data "aws_acm_certificate" "stackref_com" {
  domain      = "acme.example.com"
  statuses    = ["ISSUED"]
  most_recent = true
}
