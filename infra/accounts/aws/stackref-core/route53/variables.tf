variable "aws_region" {
  default = "us-east-1"
}

variable "stackref_com_ips" {
  default = [
    "198.185.159.144",
    "198.185.159.145",
    "198.49.23.144",
    "198.49.23.145"
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
    "google-site-verification=yNvicCfzp0P2yNKzJzAM7468emd2e9_eBk8EYMWCoE0",
    "v=spf1 include:_spf.google.com include:spf.mandrillapp.com ~all",
    "MS=ms24015479"
  ]
}

variable "stackref_com_dmarc_txt_record" {
  default = [
    "v=DMARC1; p=quarantine; pct=100; rua=mailto:re+lxgmp8489q6@dmarc.postmarkapp.com; sp=none; aspf=r;"
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
    "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCAy/6CEpNr88aDHWvILVAjBuyNCAkvwYYHnlmyfbhD0UOIQf+hTWdMz9TEbLS1WViz5ocLTUoop8sW2ymaR7/bwbEFfRCf4zLqs65nM59+Tq4WHcWfLeoImxIstkdsOKYzHNOUh5L/q37Fn9aBWiVfh2dtVfaptama40490MxXPQIDAQAB"
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
    "google-site-verification=-ag1k9LcMoLbQxWm4bwXv8hzIBonduDC0o-ty4CiRYw",
    "v=spf1 include:_spf.google.com include:spf.mandrillapp.com ~all",
    "MS=ms24015479"
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
    "google-site-verification=-C0QRNOLoqQa47QzOV59hVi2Zfm8kJjYrBH80YKXviQ",
    "v=spf1 include:_spf.google.com include:spf.mandrillapp.com ~all",
    "MS=ms24015479"
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
