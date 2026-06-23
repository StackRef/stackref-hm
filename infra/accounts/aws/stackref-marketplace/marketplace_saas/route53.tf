data "aws_route53_zone" "awsmp_stackref_com" {
  name = "awsmp.example.com."
}

resource "aws_route53_record" "awsmp_stackref_com" {
  name    = aws_api_gateway_domain_name.awsmp_stackref_com.domain_name
  type    = "A"
  zone_id = data.aws_route53_zone.awsmp_stackref_com.id

  alias {
    evaluate_target_health = true
    name                   = aws_api_gateway_domain_name.awsmp_stackref_com.cloudfront_domain_name
    zone_id                = aws_api_gateway_domain_name.awsmp_stackref_com.cloudfront_zone_id
  }
}
