resource "aws_iam_role" "tator_event_bridge_lambda" {
  name = "tator_event_bridge_lambda"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "tator_event_bridge_lambda" {
  name = "tator_event_bridge_lambda"

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/tatorEventBridge:*"
        ]
    },
    {
        "Sid": "EC2Control",
        "Effect": "Allow",
        "Action": [
            "ec2:Stop*"
        ],
        "Resource": "*"
    },
    {
        "Sid": "AssumeTatorRoleInTeamAccounts",
        "Effect": "Allow",
        "Action": "sts:AssumeRole",
        "Resource": "arn:aws:iam::*:role/stackref/admin/sr-tator-websocket"
    }
  ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "tator_event_bridge_lambda" {
  role       = aws_iam_role.tator_event_bridge_lambda.name
  policy_arn = aws_iam_policy.tator_event_bridge_lambda.arn
}

resource "aws_iam_role_policy_attachment" "event_bridge_lambda_AmazonRDSDataFullAccess" {
  role       = aws_iam_role.tator_event_bridge_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonRDSDataFullAccess"
}

resource "aws_iam_role_policy_attachment" "event_bridge_lambda_AWSLambdaVPCAccessExecutionRole" {
  role       = aws_iam_role.tator_event_bridge_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role" "tator_websocket_lambda" {
  name = "tator_websocket_${var.environment}"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "tator_websocket_lambda" {
  name = "tator_websocket_lambda-${var.environment}"

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "logs:CreateLogGroup",
      "Resource": "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/tatorWebsocketConnect:*",
        "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/tatorWebsocketDefault:*",
        "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/tatorWebsocketDisconnect:*",
        "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/tatorSQS:*",
        "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/tatorDDBStream:*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:DeleteItem",
        "dynamodb:Put*",
        "dynamodb:Get*",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "${aws_dynamodb_table.tator_ws_connections.arn}",
        "${aws_dynamodb_table.tator_ws_rooms.arn}",
        "${aws_dynamodb_table.tator_room_notifications.arn}",
        "${aws_dynamodb_table.tator_room_notifications.arn}/index/*",
        "${aws_dynamodb_table.tator_user_notifications.arn}",
        "${aws_dynamodb_table.tator_user_notifications.arn}/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "execute-api:*"
      ],
      "Resource": "${aws_apigatewayv2_api.tator_websocket.execution_arn}/$default/POST/@connections/*"
    },
    {
        "Sid": "SecretsManagerDbCredentialsAccess",
        "Effect": "Allow",
        "Action": [
            "secretsmanager:GetSecretValue"
        ],
        "Resource": [
          "${data.terraform_remote_state.rds.outputs.rds_sr_api_secret_arn}"
        ]
      },
      {
        "Sid": "SQS",
        "Effect": "Allow",
        "Action": [
            "sqs:*"
        ],
        "Resource": [
          "${aws_sqs_queue.tator.arn}",
          "${aws_sqs_queue.tator_deadletter.arn}"
        ]
      }
  ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "tator_websocket_lambda" {
  role       = aws_iam_role.tator_websocket_lambda.name
  policy_arn = aws_iam_policy.tator_websocket_lambda.arn
}

resource "aws_iam_role_policy_attachment" "tator_event_bridge_lambda_websocket" {
  role       = aws_iam_role.tator_event_bridge_lambda.name
  policy_arn = aws_iam_policy.tator_websocket_lambda.arn
}

resource "aws_iam_role_policy_attachment" "tator_ddb_stream_lambda_AWSLambdaDynamoDBExecutionRole" {
  role       = aws_iam_role.tator_websocket_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaDynamoDBExecutionRole"
}

resource "aws_iam_role" "tator_websocket_api" {
  name = "tator_websocket_api"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "tator_websocket_api" {
  name = "tator_websocket_api-${var.environment}"

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
        "Effect": "Allow",
        "Action": "lambda:InvokeFunction",
        "Resource": [
            "${aws_lambda_function.tator_websocket_connect.arn}",
            "${aws_lambda_function.tator_websocket_default.arn}",
            "${aws_lambda_function.tator_websocket_disconnect.arn}",
            "${data.aws_lambda_function.auth0_authorizer.arn}",
            "${data.aws_lambda_alias.auth0_authorizer.arn}"
        ]
    }
  ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "tator_websocket_api" {
  role       = aws_iam_role.tator_websocket_api.name
  policy_arn = aws_iam_policy.tator_websocket_api.arn
}

resource "aws_iam_role_policy_attachment" "tator_websocket_lambda_AmazonAPIGatewayPushToCloudWatchLogs" {
  role       = aws_iam_role.tator_websocket_api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_iam_role_policy_attachment" "tator_websocket_lambda_AmazonAPIGatewayInvokeFullAccess" {
  role       = aws_iam_role.tator_websocket_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonAPIGatewayInvokeFullAccess"
}

resource "aws_iam_role_policy_attachment" "tator_websocket_lambda_AWSLambdaVPCAccessExecutionRole" {
  role       = aws_iam_role.tator_websocket_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

