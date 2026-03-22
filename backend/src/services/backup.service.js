import mysqldump from "mysqldump";

export async function createBackup() {
  const result = await mysqldump({
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
  });

  const schema = result.dump?.schema || "";
  const data = result.dump?.data || "";
  const content = schema + data;

  const date = new Date().toISOString().split("T")[0];
  return {
    filename: `backup_${date}.dump.sql`,
    content,
  };
}
