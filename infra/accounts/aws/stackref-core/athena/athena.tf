resource "aws_athena_workgroup" "dev" {
  name = "stackref-dev"

  configuration {
    enforce_workgroup_configuration    = false
    publish_cloudwatch_metrics_enabled = false

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.bucket}/dev/output/"

      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }
  }
}
