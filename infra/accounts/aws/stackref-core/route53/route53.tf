# example.com
resource "aws_route53_zone" "stackref_com" {
  name = "example.com"

  tags = {
    "terraform_managed" = "true"
    "environment"       = "prod"
  }
}

resource "aws_route53_record" "stackref_com_mx_records" {
  zone_id = aws_route53_zone.stackref_com.zone_id
  name    = ""
  type    = "MX"
  ttl     = "900"
  records = var.stackref_com_mail_servers
}

resource "aws_route53_record" "stackref_com_base_txt" {
  zone_id = aws_route53_zone.stackref_com.zone_id
  name    = ""
  type    = "TXT"
  ttl     = "900"
  records = var.stackref_com_base_txt_records
}

resource "aws_route53_record" "stackref_com_dmarc_txt" {
  zone_id = aws_route53_zone.stackref_com.zone_id
  name    = "_dmarc.example.com"
  type    = "TXT"
  ttl     = "900"
  records = var.stackref_com_dmarc_txt_record
}

resource "aws_route53_record" "stackref_com_mta_sts_txt" {
  zone_id = aws_route53_zone.stackref_com.zone_id
  name    = "_mta-sts.example.com"
  type    = "TXT"
  ttl     = "900"
  records = var.stackref_com_mta_sts_txt_record
}

resource "aws_route53_record" "stackref_com_smtp_tls_txt" {
  zone_id = aws_route53_zone.stackref_com.zone_id
  name    = "_smtp._tls.example.com"
  type    = "TXT"
  ttl     = "900"
  records = var.stackref_com_smtp_tls_txt_record
}

resource "aws_route53_record" "stackref_com_google_domainkey_txt" {
  zone_id = aws_route53_zone.stackref_com.zone_id
  name    = "google._domainkey.example.com"
  type    = "TXT"
  ttl     = "900"
  records = var.stackref_com_doogle_domainkey_txt_record
}

#resource "aws_route53_record" "stackref_com" {
#  zone_id = aws_route53_zone.stackref_com.zone_id
#  name    = ""
#  type    = "A"
#  ttl     = "900"
#  records = var.stackref_com_ips
#}

resource "aws_route53_record" "www_stackref_com" {
  zone_id = aws_route53_zone.stackref_com.zone_id
  name    = "www.example.com"
  type    = "CNAME"
  ttl     = "900"
  records = ["example.com"]
}

resource "aws_route53_record" "others_stackref_com" {
  for_each = var.stackref_com_r53_records

  zone_id = aws_route53_zone.stackref_com.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = each.value.ttl
  records = each.value.records
}

resource "aws_route53_key_signing_key" "stackref_com_dnssec" {
  hosted_zone_id             = aws_route53_zone.stackref_com.id
  key_management_service_arn = aws_kms_key.dnssec.arn
  name                       = "stackref_com_dnssec"
}

resource "aws_route53_hosted_zone_dnssec" "stackref_com" {
  depends_on = [
    aws_route53_key_signing_key.stackref_com_dnssec
  ]
  hosted_zone_id = aws_route53_key_signing_key.stackref_com_dnssec.hosted_zone_id
}

# example.io

resource "aws_route53_zone" "stackref_io" {
  name = "example.io"

  tags = {
    "terraform_managed" = "true"
    "environment"       = "prod"
  }
}

resource "aws_route53_record" "stackref_io_mx_records" {
  zone_id = aws_route53_zone.stackref_io.zone_id
  name    = ""
  type    = "MX"
  ttl     = "86400"
  records = var.stackref_com_mail_servers
}

resource "aws_route53_record" "stackref_io_base_txt" {
  zone_id = aws_route53_zone.stackref_io.zone_id
  name    = ""
  type    = "TXT"
  ttl     = "86400"
  records = var.stackref_io_base_txt_records
}

resource "aws_route53_record" "stackref_io_dmarc_txt" {
  zone_id = aws_route53_zone.stackref_io.zone_id
  name    = "_dmarc.example.io"
  type    = "TXT"
  ttl     = "86400"
  records = var.stackref_com_dmarc_txt_record
}

resource "aws_route53_record" "stackref_io_mta_sts_txt" {
  zone_id = aws_route53_zone.stackref_io.zone_id
  name    = "_mta-sts.example.io"
  type    = "TXT"
  ttl     = "86400"
  records = var.stackref_com_mta_sts_txt_record
}

resource "aws_route53_record" "stackref_io_smtp_tls_txt" {
  zone_id = aws_route53_zone.stackref_io.zone_id
  name    = "_smtp._tls.example.io"
  type    = "TXT"
  ttl     = "86400"
  records = var.stackref_com_smtp_tls_txt_record
}

resource "aws_route53_record" "stackref_io_google_domainkey_txt" {
  zone_id = aws_route53_zone.stackref_io.zone_id
  name    = "google._domainkey.example.io"
  type    = "TXT"
  ttl     = "86400"
  records = var.stackref_com_doogle_domainkey_txt_record
}

#resource "aws_route53_record" "stackref_io" {
#  zone_id = aws_route53_zone.stackref_io.zone_id
#  name    = ""
#  type    = "A"
#  ttl     = "86400"
#  records = var.stackref_com_ips
#}

resource "aws_route53_record" "www_stackref_io" {
  zone_id = aws_route53_zone.stackref_io.zone_id
  name    = "www.example.io"
  type    = "CNAME"
  ttl     = "86400"
  records = ["example.io"]
}

resource "aws_route53_key_signing_key" "stackref_io_dnssec" {
  hosted_zone_id             = aws_route53_zone.stackref_io.id
  key_management_service_arn = aws_kms_key.dnssec.arn
  name                       = "stackref_io_dnssec"
}

resource "aws_route53_hosted_zone_dnssec" "stackref_io" {
  depends_on = [
    aws_route53_key_signing_key.stackref_io_dnssec
  ]
  hosted_zone_id = aws_route53_key_signing_key.stackref_io_dnssec.hosted_zone_id
}

resource "aws_route53_record" "others_stackref_io" {
  for_each = var.stackref_io_r53_records

  zone_id = aws_route53_zone.stackref_io.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = each.value.ttl
  records = each.value.records
}

# s6f.io

resource "aws_route53_zone" "s6f_io" {
  name = "s6f.io"

  tags = {
    "terraform_managed" = "true"
    "environment"       = "prod"
  }
}

resource "aws_route53_record" "s6f_io_mx_records" {
  zone_id = aws_route53_zone.s6f_io.zone_id
  name    = ""
  type    = "MX"
  ttl     = "86400"
  records = var.stackref_com_mail_servers
}

resource "aws_route53_record" "s6f_io_base_txt" {
  zone_id = aws_route53_zone.s6f_io.zone_id
  name    = ""
  type    = "TXT"
  ttl     = "86400"
  records = var.s6f_io_base_txt_records
}

resource "aws_route53_record" "s6f_io_dmarc_txt" {
  zone_id = aws_route53_zone.s6f_io.zone_id
  name    = "_dmarc.s6f.io"
  type    = "TXT"
  ttl     = "86400"
  records = var.stackref_com_dmarc_txt_record
}

resource "aws_route53_record" "s6f_io_mta_sts_txt" {
  zone_id = aws_route53_zone.s6f_io.zone_id
  name    = "_mta-sts.s6f.io"
  type    = "TXT"
  ttl     = "86400"
  records = var.stackref_com_mta_sts_txt_record
}

resource "aws_route53_record" "s6f_io_smtp_tls_txt" {
  zone_id = aws_route53_zone.s6f_io.zone_id
  name    = "_smtp._tls.s6f.io"
  type    = "TXT"
  ttl     = "86400"
  records = var.stackref_com_smtp_tls_txt_record
}

resource "aws_route53_record" "s6f_io_google_domainkey_txt" {
  zone_id = aws_route53_zone.s6f_io.zone_id
  name    = "google._domainkey.s6f.io"
  type    = "TXT"
  ttl     = "86400"
  records = var.stackref_com_doogle_domainkey_txt_record
}

#resource "aws_route53_record" "s6f_io" {
#  zone_id = aws_route53_zone.s6f_io.zone_id
#  name    = ""
#  type    = "A"
#  ttl     = "1200"
#  records = var.stackref_com_ips
#}

resource "aws_route53_record" "www_s6f_io" {
  zone_id = aws_route53_zone.s6f_io.zone_id
  name    = "www.s6f.io"
  type    = "CNAME"
  ttl     = "1200"
  records = ["s6f.io"]
}

resource "aws_route53_key_signing_key" "s6f_io_dnssec" {
  hosted_zone_id             = aws_route53_zone.s6f_io.id
  key_management_service_arn = aws_kms_key.dnssec.arn
  name                       = "s6f_io_dnssec"
}

resource "aws_route53_hosted_zone_dnssec" "s6f_io" {
  depends_on = [
    aws_route53_key_signing_key.s6f_io_dnssec
  ]
  hosted_zone_id = aws_route53_key_signing_key.s6f_io_dnssec.hosted_zone_id
}

resource "aws_route53_record" "others_s6f_io" {
  for_each = var.s6f_io_r53_records

  zone_id = aws_route53_zone.s6f_io.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = each.value.ttl
  records = each.value.records
}
