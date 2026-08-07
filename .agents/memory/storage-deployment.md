---
name: Ironworks persistence
description: Replit persistence behavior for the Ironworks deployment
---

The Ironworks API must construct the Replit App Storage client with the provisioned `DEFAULT_OBJECT_STORAGE_BUCKET_ID`; relying on the sidecar default-bucket lookup can fail in this deployment context.

**Why:** The workspace bucket was provisioned successfully, but the sidecar default-bucket lookup returned “A bucket name is needed,” while explicit bucket selection worked for listing and uploads.

Production PostgreSQL is not available until a successful Publish creates it. The development database is healthy, and publishing is the supported path for provisioning and applying the production schema.

**Why:** Replit’s production database query path reported that no production database exists before the next successful deployment.