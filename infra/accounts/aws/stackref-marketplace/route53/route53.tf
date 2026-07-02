# awsmp.example.com
resource "aws_route53_zone" "awsmp_stackref_com" {
  name = "awsmp.example.com"

  tags = {
    "terraform_managed" = "true"
    "environment"       = "prod"
  }
}

resource "aws_route53_key_signing_key" "awsmp_stackref_com_dnssec" {
  hosted_zone_id             = aws_route53_zone.awsmp_stackref_com.id
  key_management_service_arn = aws_kms_key.dnssec.arn
  name                       = "awsmp_stackref_com_dnssec"
}

resource "aws_route53_hosted_zone_dnssec" "awsmp_stackref_com" {
  depends_on = [
    aws_route53_key_signing_key.awsmp_stackref_com_dnssec
  ]
  hosted_zone_id = aws_route53_key_signing_key.awsmp_stackref_com_dnssec.hosted_zone_id
}
