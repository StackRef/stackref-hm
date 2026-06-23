resource "aws_sqs_queue" "tator" {
  name                      = "tator-ws-queue-${var.environment}.fifo"
  fifo_queue                = true
  delay_seconds             = 0
  max_message_size          = 2048
  message_retention_seconds = 60
  receive_wait_time_seconds = 0
  sqs_managed_sse_enabled   = true
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.tator_deadletter.arn
    maxReceiveCount     = 4
  })
}

resource "aws_sqs_queue" "tator_deadletter" {
  name                      = "tator-ws-deadletter-queue-${var.environment}.fifo"
  fifo_queue                = true
  delay_seconds             = 0
  max_message_size          = 2048
  message_retention_seconds = 120
  receive_wait_time_seconds = 0
  sqs_managed_sse_enabled   = true
}
