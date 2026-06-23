data "terraform_remote_state" "ssm" {
  backend = "s3"
  config = {
    region = "us-east-1"
    key    = "accounts/stackref-core/ssm/parameters/terraform.tfstate"
    bucket = "stackref-terraform-state-core"
  }
}

data "aws_ssm_parameter" "openai_api_key" {
  name = data.terraform_remote_state.ssm.outputs.openapi_api_key_name
}
