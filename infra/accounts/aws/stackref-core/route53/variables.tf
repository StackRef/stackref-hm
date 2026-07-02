variable "aws_region" {
  default = "us-east-1"
}

variable "stackref_com_ips" {
  default = [
    "203.0.113.10",
    "203.0.113.11",
    "203.0.113.12",
    "203.0.113.13"
  ]
}

variable "stackref_com_mail_servers" {
  default = [
    "1 ASPMX.L.GOOGLE.COM",
    "5 ALT1.ASPMX.L.GOOGLE.COM",
    "5 ALT2.ASPMX.L.GOOGLE.COM",
    "10 ALT3.ASPMX.L.GOOGLE.COM",
    "10 ALT4.ASPMX.L.GOOGLE.COM"
  ]
}

variable "stackref_com_base_txt_records" {
  default = [
    "google-site-verification=YOUR_GOOGLE_SITE_VERIFICATION_TOKEN",
    "v=spf1 include:_spf.google.com include:spf.mandrillapp.com ~all",
    "MS=msXXXXXXXX"
  ]
}

variable "stackref_com_dmarc_txt_record" {
  default = [
    "v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@example.com; sp=none; aspf=r;"
  ]
}

variable "stackref_com_mta_sts_txt_record" {
  default = [
    "v=STSv1; id=20241030T0000Z"
  ]
}

variable "stackref_com_smtp_tls_txt_record" {
  default = [
    "v=TLSRPTv1; rua=mailto:postmaster@example.com"
  ]
}

variable "stackref_com_doogle_domainkey_txt_record" {
  default = [
    "v=DKIM1; k=rsa; p=YOUR_DKIM_PUBLIC_KEY"
  ]
}

variable "stackref_com_r53_records" {
  type = map(object({
    name    = string
    type    = string
    ttl     = number
    records = list(string)
  }))
}

variable "stackref_io_base_txt_records" {
  default = [
    "google-site-verification=YOUR_GOOGLE_SITE_VERIFICATION_TOKEN",
    "v=spf1 include:_spf.google.com include:spf.mandrillapp.com ~all",
    "MS=msXXXXXXXX"
  ]
}

variable "stackref_io_r53_records" {
  type = map(object({
    name    = string
    type    = string
    ttl     = number
    records = list(string)
  }))
}

variable "s6f_io_base_txt_records" {
  default = [
    "google-site-verification=YOUR_GOOGLE_SITE_VERIFICATION_TOKEN",
    "v=spf1 include:_spf.google.com include:spf.mandrillapp.com ~all",
    "MS=msXXXXXXXX"
  ]
}

variable "s6f_io_r53_records" {
  type = map(object({
    name    = string
    type    = string
    ttl     = number
    records = list(string)
  }))
}
