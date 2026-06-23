#tfsec:ignore:aws-dynamodb-enable-recovery
resource "aws_dynamodb_table" "tator_ws_connections" {
  name         = "tator_ws_connections_${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connection_id"

  attribute {
    name = "connection_id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "tator_ws_connections_${var.environment}"
  }
}

#tfsec:ignore:aws-dynamodb-enable-recovery
resource "aws_dynamodb_table" "tator_ws_rooms" {
  name         = "tator_ws_rooms_${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "room_uuid"

  attribute {
    name = "room_uuid"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "tator_ws_rooms_${var.environment}"
  }
}

#tfsec:ignore:aws-dynamodb-enable-recovery
resource "aws_dynamodb_table" "tator_room_notifications" {
  name         = "tator_room_notifications_${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "notification_uuid"
  range_key    = "timestamp"

  attribute {
    name = "notification_uuid"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "room_uuid"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  global_secondary_index {
    name            = "room_uuid_timestamp_index"
    hash_key        = "room_uuid"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "tator_room_notifications_${var.environment}"
  }
}

#tfsec:ignore:aws-dynamodb-enable-recovery
resource "aws_dynamodb_table" "tator_user_notifications" {
  name         = "tator_user_notifications_${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "notification_uuid"
  range_key    = "timestamp"

  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"

  attribute {
    name = "notification_uuid"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "recipient_uuid"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  global_secondary_index {
    name            = "recipient_uuid_timestamp_index"
    hash_key        = "recipient_uuid"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "tator_user_notifications_${var.environment}"
  }
}
