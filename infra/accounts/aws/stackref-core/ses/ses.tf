resource "aws_ses_domain_identity" "stackref_com" {
  domain = "acme.example.com"
}

resource "aws_ses_domain_dkim" "stackref_com" {
  domain = aws_ses_domain_identity.stackref_com.domain
}

resource "aws_ses_domain_mail_from" "bounce_stackref_com" {
  domain           = aws_ses_domain_identity.stackref_com.domain
  mail_from_domain = "bounce.${aws_ses_domain_identity.stackref_com.domain}"
}

resource "aws_ses_configuration_set" "stackref_com_default" {
  name = "stackref-com-default"

  reputation_metrics_enabled = true
}

resource "aws_ses_template" "organization_invitation" {
  name    = "OrganizationInvitation"
  subject = "Your invitation code to join StackRef!"
  html    = <<HTML
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  </head>
  <body lang="en-us" style="background:#030A1E;margin:0;padding:0;width:600px;">
    <div style="background-color:#030A1E!important;width:100%;">
      <img style="background:#030A1E;background-image:linear-gradient(#030A1E,#030A1E);display:block;margin:auto;width:600px;" alt="StackRef - Your Formations Official" src="https://images.squarespace-cdn.com/content/v1/625d9620968ce6151ac12147/d24db4c2-0846-4a74-8815-ac3902fae5e2/logo-long.png?format=600w" />
      <p style="color:#FFFFFF;font-family:'Segoe UI',Helvetica,Arial,sans-serif,'Segoe UI Emoji';font-size:1.1rem;margin-left:10px;margin-top:25px;">
        Your invitation code to join the organization <b style="color:#8FBDEF;">{{organization_name}}</b> ({{organization_domain}}) is <b style="color:#8FBDEF;">{{invitation_code}}</b>.
      </p>
      <p style="color:#FFFFFF;font-family:'Segoe UI',Helvetica,Arial,sans-serif,'Segoe UI Emoji';font-size:1.1rem;margin-left:10px;">
        You can claim the invitation by registering at
        <a href="{{environment}}.acme.example.com">{{environment}}.acme.example.com</a>
      </p>
      <p style="color:#8FBDEF;font-family:'Segoe UI',Helvetica,Arial,sans-serif,'Segoe UI Emoji';font-size:0.8rem;margin-top:50px;text-align:center;">
        Copyright StackRef Inc. All rights reserved.
        <br />
        67 Oak Ave., Northborough, MA 01532, USA
      </p>
    </div>
  </body>
</html>
HTML
  text    = <<TEXT
Your invitation code to join the organization {{organization_name}} ({{organization_domain}}) is {{invitation_code}}.

You can claim the invitation by registering at https://{{environment}}.acme.example.com
TEXT
}

resource "aws_ses_event_destination" "cloudwatch" {
  name                   = "event-destination-cloudwatch"
  configuration_set_name = aws_ses_configuration_set.stackref_com_default.name
  enabled                = true
  matching_types         = ["bounce", "send"]

  cloudwatch_destination {
    default_value  = "default"
    dimension_name = "dimension"
    value_source   = "emailHeader"
  }
}

# resource "aws_ses_event_destination" "email" {
#   name                   = "event-destination-sns-email"
#   configuration_set_name = aws_ses_configuration_set.stackref_com_default.name
#   enabled                = true
#   matching_types = [
#     "bounce",
#     "click",
#     "complaint",
#     "delivery",
#     "open",
#     "reject",
#     "renderingFailure",
#     "send"
#   ]

#   sns_destination {
#     topic_arn = "arn:aws:sns:${var.aws_region}:${data.aws_caller_identity.current.account_id}:email-jordan"
#   }
# }

# resource "aws_ses_identity_notification_topic" "bounce" {
#   topic_arn                = "arn:aws:sns:${var.aws_region}:${data.aws_caller_identity.current.account_id}:email-jordan"
#   notification_type        = "Bounce"
#   identity                 = aws_ses_domain_identity.stackref_com.domain
#   include_original_headers = true
# }

# resource "aws_ses_identity_notification_topic" "complaint" {
#   topic_arn                = "arn:aws:sns:${var.aws_region}:${data.aws_caller_identity.current.account_id}:email-jordan"
#   notification_type        = "Complaint"
#   identity                 = aws_ses_domain_identity.stackref_com.domain
#   include_original_headers = true
# }

# resource "aws_ses_identity_notification_topic" "delivery" {
#   topic_arn                = "arn:aws:sns:${var.aws_region}:${data.aws_caller_identity.current.account_id}:email-jordan"
#   notification_type        = "Delivery"
#   identity                 = aws_ses_domain_identity.stackref_com.domain
#   include_original_headers = true
# }

resource "aws_ses_email_identity" "invitations_bounce_stackref_com" {
  email = "invitations@bounce.acme.example.com"
}

/*
resource "aws_ses_identity_notification_topic" "bounce" {
  topic_arn                = aws_sns_topic.example.arn
  notification_type        = "Bounce"
  identity                 = aws_ses_domain_identity.example.domain
  include_original_headers = true
}
*/

resource "aws_ses_identity_policy" "stackref_com" {
  identity = aws_ses_domain_identity.stackref_com.arn
  name     = "permit-stackref-lambda"
  policy   = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
      {
        "Sid": "PermitStacRefLambda",
        "Effect": "Allow",
        "Principal": {
            "AWS": [
              "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root",
              "arn:aws:sts::${data.aws_caller_identity.current.account_id}:assumed-role/stackref_main_api/organizationInvitation"
            ]
        },
        "Action": "ses:Send*",
        "Resource": [
          "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/acme.example.com"
        ],
        "Condition":{
          "StringEquals":{
            "ses:FromAddress":"invitations@bounce.acme.example.com"
          }
        }
      }
  ]
}
POLICY
}
