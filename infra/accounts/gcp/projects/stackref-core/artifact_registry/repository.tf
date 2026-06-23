resource "google_artifact_registry_repository" "endzone" {
  location      = "us-east4"
  repository_id = "endzone"
  description   = "endzone docker repository"
  format        = "DOCKER"
}
