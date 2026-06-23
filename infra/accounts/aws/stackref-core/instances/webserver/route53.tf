data "aws_route53_zone" "stackref_com" {
  name         = "example.com."
  private_zone = false
}

resource "aws_route53_record" "webserver" {
  zone_id = data.aws_route53_zone.stackref_com.zone_id
  name    = "dev.example.com"
  type    = "A"

  alias {
    name                   = aws_lb.alb.dns_name
    zone_id                = aws_lb.alb.zone_id
    evaluate_target_health = false
  }
}
