variable "stackref_repos" {
  type = map(object({
    namespace = string
    name      = string
    mutable   = bool
  }))
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}
