import * as BackupService from "../services/backup.service.js";

export function registerBackupRoutes(router) {
  router.get("/api/backup", async (_, db) => BackupService.createBackup());
}
