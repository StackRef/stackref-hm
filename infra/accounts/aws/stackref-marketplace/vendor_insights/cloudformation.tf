resource "aws_cloudformation_stack" "vendor_insights_prerequisite" {
  name = "VendorInsightsPrerequisiteStack"

  template_url = "https://aws-vendor-insights.s3.amazonaws.com/vendor-onboarding-templates/v0/VendorInsightsPrerequisiteCFT.yaml"
  capabilities = ["CAPABILITY_NAMED_IAM"]
  on_failure   = "ROLLBACK"
}

resource "aws_cloudformation_stack_set" "vendor_insights_onboarding" {
  name        = "VendorInsightsOnboardingStackSetsExecution"
  description = "Vendor Insights on-boarding Stack Set"

  template_url            = "https://aws-vendor-insights.s3.amazonaws.com/vendor-onboarding-templates/v0/VendorInsightsOnboardingCFT.yaml"
  capabilities            = ["CAPABILITY_NAMED_IAM"]
  administration_role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/AWSVendorInsightsOnboardingStackSetsAdmin"
  execution_role_name     = "AWSVendorInsightsOnboardingStackSetsExecution"

  parameters = {
    MarketplaceManagementAccountId          = var.marketplace_account_id
    PrimaryRegion                           = var.aws_region
    CreateVendorInsightsIAMRoles            = "Yes"
    CreateVendorInsightsBucket              = "Yes"
    CreateVendorInsightsSelfAssessment      = "Yes"
    ProductName                             = "StackRef"
    CreateVendorInsightsAutomatedAssessment = "Yes"
    SecurityFrameworkVersion                = "V2"
  }

  operation_preferences {
    max_concurrent_count    = 1
    failure_tolerance_count = 0
  }

  depends_on = [aws_cloudformation_stack.vendor_insights_prerequisite]
}

resource "aws_cloudformation_stack_set_instance" "vendor_insights_onboarding_stackref_marketplace" {
  account_id     = data.aws_caller_identity.current.account_id
  region         = var.aws_region
  stack_set_name = aws_cloudformation_stack_set.vendor_insights_onboarding.name
}
