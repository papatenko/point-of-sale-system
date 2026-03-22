import * as BackupController from "../controllers/backup.controller.js";

export function registerBackupRoutes(router) {
  router.get("/api/backup", async (_, db) => BackupController.handleGetBackup(_, db));
}
