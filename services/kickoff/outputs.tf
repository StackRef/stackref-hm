output "sqs_queue_arn" {
  value = aws_sqs_queue.kickoff.arn
}

output "sqs_queue_url" {
  value = aws_sqs_queue.kickoff.url
}

output "kickoff_record_results_lambda_arn" {
  value = aws_lambda_function.kickoff_record_results.arn
}

output "kickoff_lambda_role_arn" {
  value = aws_iam_role.kickoff_lambda.arn
}

output "kickoff_codescans_codepipeline_role_arn" {
  value = aws_iam_role.kickoff_codescans_codepipeline.arn
}

output "kickoff_scheduler_role_arn" {
  value = aws_iam_role.kickoff_scheduler.arn
}
