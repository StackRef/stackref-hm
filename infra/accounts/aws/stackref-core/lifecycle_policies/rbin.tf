resource "aws_rbin_rule" "snapshots" {
  description   = "Retain recycle bin snapshots for 30 days"
  resource_type = "EBS_SNAPSHOT"

  retention_period {
    retention_period_value = 30
    retention_period_unit  = "DAYS"
  }
}

resource "aws_rbin_rule" "amis" {
  description   = "Retain recycle bin AMIs for 30 days"
  resource_type = "EC2_IMAGE"

  retention_period {
    retention_period_value = 30
    retention_period_unit  = "DAYS"
  }

}
