import * as BackupService from "../services/backup.service.js";

export async function handleGetBackup() {
  return await BackupService.createBackup();
}
