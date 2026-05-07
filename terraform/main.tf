locals {
  name_prefix           = "${var.app_name}-${var.environment}"
  web_tag               = "${local.name_prefix}-web"
  ssh_iap_tag           = "${local.name_prefix}-ssh-iap"
  data_disk_device_name = "${local.name_prefix}-data"
  caddy_site_address    = trimspace(var.domain_name) != "" ? var.domain_name : ":80"
  frontend_url          = trimspace(var.domain_name) != "" ? "https://${var.domain_name}" : "http://${google_compute_address.app.address}"

  labels = merge(
    {
      app         = var.app_name
      environment = var.environment
      managed_by  = "terraform"
    },
    var.labels
  )

  startup_script = <<-EOT
#!/usr/bin/env bash
set -euo pipefail

DEVICE="/dev/disk/by-id/google-${local.data_disk_device_name}"
MOUNT_POINT="/srv/chatz-data"
APP_DIR="/srv/chatz"

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl git gnupg lsb-release

install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
fi

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

for attempt in $(seq 1 30); do
  if [ -e "$DEVICE" ]; then
    break
  fi
  sleep 2
done

if [ ! -e "$DEVICE" ]; then
  echo "Data disk device $DEVICE was not found" >&2
  exit 1
fi

mkdir -p "$MOUNT_POINT"
if ! blkid "$DEVICE" >/dev/null 2>&1; then
  mkfs.ext4 -F -m 0 "$DEVICE"
fi

UUID=$(blkid -s UUID -o value "$DEVICE")
if ! grep -q "$UUID" /etc/fstab; then
  echo "UUID=$UUID $MOUNT_POINT ext4 discard,defaults,nofail 0 2" >> /etc/fstab
fi

mount "$MOUNT_POINT" || mount -a
mkdir -p "$MOUNT_POINT/docker" "$APP_DIR"

cat >/etc/docker/daemon.json <<'JSON'
{
  "data-root": "/srv/chatz-data/docker",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  }
}
JSON

systemctl enable docker
systemctl restart docker

cat >"$APP_DIR/README.deploy" <<'README'
Terraform provisioned this VM for Chatz.

Next steps:
1. Deploy the repository to /srv/chatz/app by CI or SSH.
2. Create a production env file outside Terraform state.
3. Run: docker compose --env-file /srv/chatz/app/.env -f /srv/chatz/app/docker-compose.yml up -d --build
4. Configure MongoDB as a single-node replica set before using transaction-backed features.
README

cat >"$APP_DIR/chatz.env.example" <<'ENV'
CADDY_SITE_ADDRESS=${local.caddy_site_address}
MONGO_URI=mongodb://mongo:27017/chatz?replicaSet=rs0
REDIS_URL=redis://redis:6379
FRONTEND_URL=${local.frontend_url}
ATTACHMENT_BUCKET=${google_storage_bucket.attachments.name}
GCP_PROJECT_ID=${var.project_id}
ENV
EOT
}

resource "google_project_service" "required" {
  for_each = toset([
    "compute.googleapis.com",
    "iamcredentials.googleapis.com",
    "storage.googleapis.com"
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_compute_network" "app" {
  name                    = "${local.name_prefix}-vpc"
  auto_create_subnetworks = false
  description             = "VPC for the single-host Chatz deployment."

  depends_on = [google_project_service.required]
}

resource "google_compute_subnetwork" "app" {
  name                     = "${local.name_prefix}-subnet"
  ip_cidr_range            = "10.10.0.0/24"
  region                   = var.region
  network                  = google_compute_network.app.id
  private_ip_google_access = true
  description              = "Singapore subnet for the Chatz VM."
}

resource "google_compute_firewall" "web" {
  name          = "${local.name_prefix}-allow-web"
  network       = google_compute_network.app.name
  direction     = "INGRESS"
  source_ranges = var.allowed_http_source_ranges
  target_tags   = [local.web_tag]
  description   = "Allow public HTTP, HTTPS, and HTTP/3 to Caddy."

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  allow {
    protocol = "udp"
    ports    = ["443"]
  }
}

resource "google_compute_firewall" "ssh_iap" {
  name          = "${local.name_prefix}-allow-ssh-iap"
  network       = google_compute_network.app.name
  direction     = "INGRESS"
  source_ranges = var.iap_ssh_source_ranges
  target_tags   = [local.ssh_iap_tag]
  description   = "Allow SSH only through Identity-Aware Proxy TCP forwarding."

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

resource "google_service_account" "app" {
  account_id   = "${local.name_prefix}-vm"
  display_name = "Chatz ${var.environment} VM"
  description  = "Runtime service account for the Chatz Docker Compose VM."

  depends_on = [google_project_service.required]
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "google_storage_bucket" "attachments" {
  name                        = "${var.project_id}-${local.name_prefix}-attachments-${random_id.bucket_suffix.hex}"
  location                    = upper(var.region)
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false
  labels                      = local.labels

  dynamic "cors" {
    for_each = length(var.attachment_cors_origins) > 0 ? [1] : []

    content {
      origin          = var.attachment_cors_origins
      method          = ["GET", "HEAD", "PUT", "POST"]
      response_header = ["Content-Type", "Content-Length", "ETag", "x-goog-resumable"]
      max_age_seconds = 3600
    }
  }

  dynamic "lifecycle_rule" {
    for_each = var.attachment_retention_days > 0 ? [var.attachment_retention_days] : []

    content {
      action {
        type = "Delete"
      }

      condition {
        age = lifecycle_rule.value
      }
    }
  }

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [google_project_service.required]
}

resource "google_storage_bucket_iam_member" "app_attachment_object_admin" {
  bucket = google_storage_bucket.attachments.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.app.email}"
}

resource "google_service_account_iam_member" "app_sign_blob" {
  service_account_id = google_service_account.app.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.app.email}"
}

resource "google_compute_address" "app" {
  name         = "${local.name_prefix}-ipv4"
  region       = var.region
  address_type = "EXTERNAL"
  network_tier = var.network_tier

  depends_on = [google_project_service.required]
}

resource "google_compute_disk" "app_data" {
  name                      = local.data_disk_device_name
  zone                      = var.zone
  type                      = var.data_disk_type
  size                      = var.data_disk_size_gb
  physical_block_size_bytes = 4096
  labels                    = local.labels

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [google_project_service.required]
}

data "google_compute_image" "debian" {
  family  = "debian-12"
  project = "debian-cloud"
}

resource "google_compute_instance" "app" {
  name                      = "${local.name_prefix}-vm"
  machine_type              = var.machine_type
  zone                      = var.zone
  allow_stopping_for_update = true
  deletion_protection       = var.deletion_protection
  labels                    = local.labels
  tags                      = [local.web_tag, local.ssh_iap_tag]

  boot_disk {
    initialize_params {
      image = data.google_compute_image.debian.self_link
      type  = var.boot_disk_type
      size  = var.boot_disk_size_gb
      labels = local.labels
    }
  }

  attached_disk {
    source      = google_compute_disk.app_data.id
    device_name = local.data_disk_device_name
    mode        = "READ_WRITE"
  }

  network_interface {
    subnetwork = google_compute_subnetwork.app.id

    access_config {
      nat_ip       = google_compute_address.app.address
      network_tier = var.network_tier
    }
  }

  metadata = {
    block-project-ssh-keys = "TRUE"
    enable-oslogin         = "TRUE"
    startup-script         = local.startup_script
  }

  service_account {
    email  = google_service_account.app.email
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

  shielded_instance_config {
    enable_integrity_monitoring = true
    enable_secure_boot          = true
    enable_vtpm                 = true
  }

  depends_on = [
    google_project_service.required,
    google_service_account_iam_member.app_sign_blob,
    google_storage_bucket_iam_member.app_attachment_object_admin
  ]
}
