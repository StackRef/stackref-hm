data "aws_acm_certificate" "stackref_com" {
  domain      = "example.com"
  statuses    = ["ISSUED"]
  most_recent = true
}
