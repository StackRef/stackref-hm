resource "aws_sqs_queue" "org_invitations" {
  name                       = "org-invitations-queue-${var.environment}"
  fifo_queue                 = false
  delay_seconds              = 0
  max_message_size           = 2048
  message_retention_seconds  = 300
  receive_wait_time_seconds  = 0
  sqs_managed_sse_enabled    = true
  visibility_timeout_seconds = 60
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.org_invitations_deadletter.arn
    maxReceiveCount     = 4
  })
}

resource "aws_sqs_queue" "org_invitations_deadletter" {
  name                       = "org-invitations-deadletter-queue-${var.environment}"
  fifo_queue                 = false
  delay_seconds              = 0
  max_message_size           = 2048
  message_retention_seconds  = 600
  receive_wait_time_seconds  = 0
  sqs_managed_sse_enabled    = true
  visibility_timeout_seconds = 60
}
