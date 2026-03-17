import mysql from "mysql";

const DATABASE_HOST = process.env.DB_HOST;
const DATABASE_USER = process.env.DB_USER;
const DATABASE_PASSWORD = process.env.DB_PASSWORD;


const database = mysql.createConnection({
  host: DATABASE_HOST,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
});

export async function mySQLQuery(url,  params = []) {
  // rebeca routes for auth XD
    if (url === "/api/users") {
    const [rows] = await database.query("SELECT * FROM users");
    return rows;
  } else if (url === "/api/register-user") {
    const [result] = await database.query(
      "INSERT INTO users(username, password) VALUES (?, ?)",
      params
    );
    return result;
  } else if (url === "/api/register-manager") {
    const [result] = await database.query(
      `INSERT INTO managers(email, budget)
       VALUES (?, ?)`,
      params
    );
    return result;
  }

  if (url === "/api/employee") {
    return "HI FROM MYSQL";
  } else if (url === "/api/employee/pos") {
    database.query();
  } else if (url === "/api/employee/reports") {
    database.query();
  } else if (url === "/api/employee/inventory") {
    database.query();
  }   else if (url === "/api/employee/creation") {
      // CORREGIDO
      return new Promise((resolve, reject) => {
        const query = `INSERT INTO employees 
                       (email, license_plate, role, hire_date, hourly_rate) 
                       VALUES (?, ?, ?, ?, ?)`;
        
        database.query(query, params, (err, result) => {
          if (err) {
            console.error("Error creating employee:", err);
            reject(err);
          } else {
            console.log("Employee created with ID:", result.insertId);
            resolve(result); // Esto devuelve { insertId, affectedRows, etc. }
          }
        });
      });
    }   else if (url === "/api/employee/jsearch") {
    database.query();
  } else if (url === "/api/auth/login") {
    database.query();
  }  else {
    return "";
  }
}

// Test Connect to the database
// mysql.connect((err) => {
//   if (err) throw err;
//   console.log("Connected to MySQL Database!");

//   // Example query
//   mysql.query("SELECT * FROM users", (err, results) => {
//     if (err) throw err;
//     console.log(results);
//   });

//   // Close the connection
//   connection.end();
// });
