## NOTE: This only works for per-project config, not at the Group level
##       like we have done in the UI.
#resource "gitlab_service_slack" "slack" {
#  project                 = data.gitlab_group.stackref.id
#  webhook                 = var.slack_webhook_url
#  username                = "gitlab"
#  push_events             = true
#  merge_requests_events   = true
#  note_events             = true
#  tag_push_events         = true
#  pipeline_events         = true
#  branches_to_be_notified = "all"
#}
