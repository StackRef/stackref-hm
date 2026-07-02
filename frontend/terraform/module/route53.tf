data "aws_route53_zone" "stackref_com" {
  name = "acme.example.com."
}

resource "aws_route53_record" "env_stackref_com" {
  zone_id = data.aws_route53_zone.stackref_com.zone_id
  name    = "${var.environment == "prod" ? "app" : var.environment}.acme.example.com"
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.primary_frontend.domain_name
    zone_id                = aws_cloudfront_distribution.primary_frontend.hosted_zone_id
    evaluate_target_health = true
  }
}
