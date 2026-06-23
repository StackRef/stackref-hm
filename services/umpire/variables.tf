variable "aws_region" {
  default = "us-east-1"
}

variable "sr_umpire_version" {
  description = "The version tag for Umpire"
  type        = string
}

variable "environment" {
  type = string
}

variable "sr_logging_level" {
  type = string
}
