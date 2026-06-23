resource "google_compute_instance" "default" {
  name         = "endzone-${var.env}"
  machine_type = "e2-small"
  zone         = "us-east4-a"

  description = "EndZone Application - ${var.env}"
  hostname    = "endzone-dev.example.com"

  allow_stopping_for_update = true

  boot_disk {
    auto_delete = true
    device_name = "endzone-boot-${var.env}"

    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  network_interface {
    network = "default"

    access_config {
      // Ephemeral public IP
    }
  }

  labels = {
    application       = "endzone",
    env               = "dev",
    terraform_managed = "true"
  }

  service_account {
    email  = "terraform@example-gcp.iam.gserviceaccount.com"
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}
