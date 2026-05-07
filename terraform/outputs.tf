output "app_static_ip" {
  description = "Static external IPv4 address assigned to the Chatz VM."
  value       = google_compute_address.app.address
}

output "app_url" {
  description = "Initial application URL based on domain_name or the static IP."
  value       = local.frontend_url
}

output "attachment_bucket_name" {
  description = "Cloud Storage bucket for message attachments."
  value       = google_storage_bucket.attachments.name
}

output "vm_name" {
  description = "Compute Engine VM name."
  value       = google_compute_instance.app.name
}

output "vm_service_account_email" {
  description = "Runtime service account email attached to the VM."
  value       = google_service_account.app.email
}

output "ssh_iap_command" {
  description = "Command to SSH to the VM through Identity-Aware Proxy."
  value       = "gcloud compute ssh ${google_compute_instance.app.name} --project ${var.project_id} --zone ${var.zone} --tunnel-through-iap"
}
