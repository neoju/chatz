variable "project_id" {
  description = "GCP project ID that will host the Chatz single-VM deployment."
  type        = string
  nullable    = false
}

variable "app_name" {
  description = "Short application name used in resource names and labels."
  type        = string
  default     = "chatz"
  nullable    = false

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,15}$", var.app_name))
    error_message = "app_name must be 3-16 lowercase letters, numbers, or hyphens, starting with a letter."
  }
}

variable "environment" {
  description = "Deployment environment name used in resource names and labels."
  type        = string
  default     = "prod"
  nullable    = false

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,7}$", var.environment))
    error_message = "environment must be 2-8 lowercase letters, numbers, or hyphens, starting with a letter."
  }
}

variable "region" {
  description = "GCP region. This deployment is intentionally constrained to Singapore."
  type        = string
  default     = "asia-southeast1"
  nullable    = false

  validation {
    condition     = var.region == "asia-southeast1"
    error_message = "region must be asia-southeast1 for the Singapore deployment."
  }
}

variable "zone" {
  description = "GCP zone in Singapore for the VM and persistent data disk."
  type        = string
  default     = "asia-southeast1-a"
  nullable    = false

  validation {
    condition     = can(regex("^asia-southeast1-[a-c]$", var.zone))
    error_message = "zone must be one of the asia-southeast1 zones."
  }
}

variable "domain_name" {
  description = "Optional public domain name for Caddy HTTPS. Leave empty to start with HTTP on the static IP."
  type        = string
  default     = ""
  nullable    = false
}

variable "machine_type" {
  description = "Compute Engine machine type for the single Docker Compose VM."
  type        = string
  default     = "e2-medium"
  nullable    = false

  validation {
    condition     = var.machine_type == "e2-medium"
    error_message = "machine_type is fixed to e2-medium for this minimum-cost plan."
  }
}

variable "network_tier" {
  description = "External network tier. STANDARD lowers internet egress cost but has less optimal routing than PREMIUM."
  type        = string
  default     = "STANDARD"
  nullable    = false

  validation {
    condition     = contains(["STANDARD", "PREMIUM"], var.network_tier)
    error_message = "network_tier must be STANDARD or PREMIUM."
  }
}

variable "boot_disk_size_gb" {
  description = "Boot disk size in GiB. Docker data is moved to the attached data disk by startup script."
  type        = number
  default     = 20
  nullable    = false

  validation {
    condition     = var.boot_disk_size_gb >= 20
    error_message = "boot_disk_size_gb must be at least 20."
  }
}

variable "boot_disk_type" {
  description = "Boot disk type. pd-standard keeps the OS disk cheap while Docker data lives on the balanced data disk."
  type        = string
  default     = "pd-standard"
  nullable    = false
}

variable "data_disk_size_gb" {
  description = "Persistent data disk size in GiB for Docker, MongoDB, Redis, and Caddy data."
  type        = number
  default     = 50
  nullable    = false

  validation {
    condition     = var.data_disk_size_gb >= 50
    error_message = "data_disk_size_gb must be at least 50."
  }
}

variable "data_disk_type" {
  description = "Persistent data disk type. pd-balanced is the cost/performance floor for MongoDB on a small VM."
  type        = string
  default     = "pd-balanced"
  nullable    = false
}

variable "allowed_http_source_ranges" {
  description = "CIDR ranges allowed to reach HTTP, HTTPS, and HTTP/3 on the VM."
  type        = list(string)
  default     = ["0.0.0.0/0"]
  nullable    = false
}

variable "iap_ssh_source_ranges" {
  description = "CIDR ranges allowed to reach SSH. The default is Google Cloud IAP TCP forwarding only."
  type        = list(string)
  default     = ["35.235.240.0/20"]
  nullable    = false
}

variable "attachment_cors_origins" {
  description = "Browser origins allowed to upload/download attachments directly with signed Cloud Storage URLs."
  type        = list(string)
  default     = []
  nullable    = false
}

variable "attachment_retention_days" {
  description = "Optional object lifecycle deletion age for attachments. Set 0 to retain until explicitly deleted."
  type        = number
  default     = 0
  nullable    = false

  validation {
    condition     = var.attachment_retention_days >= 0
    error_message = "attachment_retention_days must be 0 or greater."
  }
}

variable "deletion_protection" {
  description = "Enable Compute Engine deletion protection for the single production VM."
  type        = bool
  default     = true
  nullable    = false
}

variable "labels" {
  description = "Additional labels to apply to supported resources."
  type        = map(string)
  default     = {}
  nullable    = false
}
