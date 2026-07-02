variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "beta"
}

variable "api_version" {
  type    = string
  default = "v2"
}

variable "allowed_countries" {
  type = list(any)
  default = [
    "AU",
    "CA",
    "DE",
    "ES",
    "FR",
    "GB",
    "GR",
    "IE",
    "IN",
    "IT",
    "JP",
    "LU",
    "MX",
    "NL",
    "NO",
    "NZ",
    "PT",
    "UA",
    "UM",
    "US"
  ]
}
