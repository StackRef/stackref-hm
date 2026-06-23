resource "aws_accessanalyzer_analyzer" "stackref" {
  depends_on = [aws_organizations_organization.stackref]

  analyzer_name = "stackref"
  type          = "ORGANIZATION"
}
