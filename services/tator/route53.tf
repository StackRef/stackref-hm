data "aws_route53_zone" "stackref_com" {
  name = "acme.example.com."
}

resource "aws_route53_record" "ws_stackref_com" {
  name    = aws_apigatewayv2_domain_name.ws_stackref_com.domain_name
  type    = "A"
  zone_id = data.aws_route53_zone.stackref_com.id

  alias {
    name                   = aws_apigatewayv2_domain_name.ws_stackref_com.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.ws_stackref_com.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}
