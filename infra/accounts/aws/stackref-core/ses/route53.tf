data "aws_route53_zone" "stackref_com" {
  name = "acme.example.com."
}

resource "aws_route53_record" "amazonses_stackref_com" {
  zone_id = data.aws_route53_zone.stackref_com.zone_id
  name    = "_amazonses.acme.example.com"
  type    = "TXT"
  ttl     = "600"
  records = [aws_ses_domain_identity.stackref_com.verification_token]
}

resource "aws_route53_record" "stackref_com_amazonses_dkim_record" {
  count   = 3
  zone_id = data.aws_route53_zone.stackref_com.zone_id
  name    = "${element(aws_ses_domain_dkim.stackref_com.dkim_tokens, count.index)}._domainkey"
  type    = "CNAME"
  ttl     = "600"
  records = ["${element(aws_ses_domain_dkim.stackref_com.dkim_tokens, count.index)}.dkim.amazonses.com"]
}

resource "aws_route53_record" "stackref_com_ses_domain_mail_from_mx" {
  zone_id = data.aws_route53_zone.stackref_com.zone_id
  name    = aws_ses_domain_mail_from.bounce_stackref_com.mail_from_domain
  type    = "MX"
  ttl     = "600"
  records = ["10 feedback-smtp.${var.aws_region}.amazonses.com"]
}

resource "aws_route53_record" "stackref_com_ses_domain_mail_from_txt" {
  zone_id = data.aws_route53_zone.stackref_com.zone_id
  name    = aws_ses_domain_mail_from.bounce_stackref_com.mail_from_domain
  type    = "TXT"
  ttl     = "600"
  records = ["v=spf1 include:amazonses.com -all"]
}
