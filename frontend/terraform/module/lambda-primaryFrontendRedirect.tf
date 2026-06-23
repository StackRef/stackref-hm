data "archive_file" "primary_frontend_redirect_lambda_payload" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_functions/primaryFrontendRedirect/src"
  output_path = "${path.module}/lambda_functions/primaryFrontendRedirect/payload.zip"
}

resource "aws_lambda_function" "primary_frontend_redirect" {
  filename         = data.archive_file.primary_frontend_redirect_lambda_payload.output_path
  function_name    = "primaryFrontendRedirect-${var.environment}"
  description      = "Redirects to S3 index.html and AWS Marketplace POST to GET"
  role             = aws_iam_role.lambda.arn
  handler          = "edge-redirect.lambdaHandler"
  source_code_hash = data.archive_file.primary_frontend_redirect_lambda_payload.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 5
  publish          = "true"
  architectures    = ["x86_64"] # Lamda@Edge currently only supports x86_64
}
