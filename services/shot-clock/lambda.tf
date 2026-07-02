data "aws_lambda_layer_version" "python_lambda_layer" {
  layer_name              = "standard_python_lambda_layer"
  compatible_architecture = "arm64"
}
