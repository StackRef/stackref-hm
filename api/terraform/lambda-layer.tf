resource "null_resource" "python_lambda_layer_dependencies" {
  triggers = {
    requirements = filebase64sha256("${var.python_lambda_layer_dir}/requirements.txt")
  }

  provisioner "local-exec" {
    command = "${var.python_lambda_layer_dir}/get_dependencies.sh"
  }
}

data "archive_file" "python_lambda_layer_payload" {
  type       = "zip"
  source_dir = "${var.python_lambda_layer_dir}/package"
  excludes = [
    "venv",
    "_pycache_"
  ]
  output_path = "${var.python_lambda_layer_dir}/payload.zip"
  depends_on = [
    null_resource.python_lambda_layer_dependencies
  ]
}

resource "aws_lambda_layer_version" "python_lambda_layer" {
  filename                 = "${var.python_lambda_layer_dir}/payload.zip"
  layer_name               = "standard_python_lambda_layer"
  source_code_hash         = data.archive_file.python_lambda_layer_payload.output_base64sha256
  compatible_runtimes      = ["python3.11"]
  compatible_architectures = ["arm64"]
}
