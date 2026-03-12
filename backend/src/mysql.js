import mysql from "mysql";

const DATABASE_HOST = process.env.DB_HOST;
const DATABASE_USER = process.env.DB_USER;
const DATABASE_PASSWORD = process.env.DB_PASSWORD;

const database = mysql.createConnection({
  host: DATABASE_HOST,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
});

export async function mySQLQuery(url) {
  if (url === "/api/employee") {
    return "HI";
  } else if (url === "/api/employee/pos") {
    database.query();
  } else if (url === "/api/employee/reports") {
    database.query();
  } else if (url === "/api/employee/inventory") {
    database.query();
  } else if (url === "/api/employee/creation") {
    database.query();
  } else if (url === "/api/employee/jsearch") {
    database.query();
  } else {
    return "";
  }
}

// Test Connect to the database
mysql.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL Database!");

  // Example query
  mysql.query("SELECT * FROM users", (err, results) => {
    if (err) throw err;
    console.log(results);
  });

  // Close the connection
  connection.end();
});
