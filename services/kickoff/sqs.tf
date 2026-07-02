resource "aws_sqs_queue" "kickoff" {
  name                      = "kickoff-queue-${var.environment}.fifo"
  fifo_queue                = true
  delay_seconds             = 0
  max_message_size          = 2048
  message_retention_seconds = 60
  receive_wait_time_seconds = 0
  sqs_managed_sse_enabled   = true
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.kickoff_deadletter.arn
    maxReceiveCount     = 4
  })
}

resource "aws_sqs_queue" "kickoff_deadletter" {
  name                      = "kickoff-deadletter-queue-${var.environment}.fifo"
  fifo_queue                = true
  delay_seconds             = 0
  max_message_size          = 2048
  message_retention_seconds = 120
  receive_wait_time_seconds = 0
  sqs_managed_sse_enabled   = true
}
