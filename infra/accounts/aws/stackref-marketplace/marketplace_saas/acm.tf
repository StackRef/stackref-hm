data "aws_acm_certificate" "awsmp_stackref_com" {
  domain      = "awsmp.example.com"
  statuses    = ["ISSUED"]
  most_recent = true
}
