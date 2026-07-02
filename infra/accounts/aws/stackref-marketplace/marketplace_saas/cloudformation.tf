resource "aws_cloudformation_stack" "marketplace_saas" {
  name = "sr-mp-saas"

  template_url = "https://aws-quickstart.s3.us-east-1.amazonaws.com/cloudformation-aws-marketplace-saas/templates/cloudformation-aws-marketplace-saas.template.yaml"

  capabilities = [
    "CAPABILITY_AUTO_EXPAND",
    "CAPABILITY_NAMED_IAM"
  ]

  parameters = {
    "ArtifactBucketName"                     = "aws-quickstart"
    "AWSMarketplaceMeteringRecordsTableName" = "AWSMarketplaceMeteringRecords"
    "CreateRegistrationWebPage"              = "false"
    "EntitlementSNSTopic"                    = "arn:aws:sns:us-east-1:000000000000:aws-mp-entitlement-notification-ex1nw4nap7tikm3lyxp2h3pif"
    "MarketplaceTechAdminEmail"              = "stackref-marketplace@example.com"
    "NewSubscribersTableName"                = "AWSMarketplaceSubscribers"
    "ProductCode"                            = "ex1nw4nap7tikm3lyxp2h3pif"
    "SubscriptionSNSTopic"                   = "arn:aws:sns:us-east-1:000000000000:aws-mp-subscription-notification-ex1nw4nap7tikm3lyxp2h3pif"
    "TypeOfSaaSListing"                      = "subscriptions"
    "WebsiteS3BucketName"                    = ""
  }
}
