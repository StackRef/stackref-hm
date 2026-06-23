output "process_invitation_list_lambda_arn" {
  value = aws_lambda_function.process_invitation_list.arn
}

output "shot_clock_lambda_role_arn" {
  value = aws_iam_role.shot_clock_lambda.arn
}

output "shot_clock_org_invitations_sqs_arn" {
  value = aws_sqs_queue.org_invitations.arn
}

output "shot_clock_org_invitations_deadletter_sqs_arn" {
  value = aws_sqs_queue.org_invitations_deadletter.arn
}
