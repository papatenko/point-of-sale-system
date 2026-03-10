import { createServer } from "http";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2";
dotenv.config();

// Grab

// Grabs the built /dist/ directory built from Vite
const FRONTEND_PATH = path.resolve("..") + "/frontend/dist";
const PORT = process.env.PORT || 3000;

// Serves for .then() functions, for whether a file exists or not.
const toBool = [() => true, () => false];

// These are needed to submit to writeHead() function
const MIME_TYPES = {
  default: "application/octet-stream",
  html: "text/html; charset=UTF-8",
  js: "text/javascript",
  css: "text/css",
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  ico: "image/x-icon",
  svg: "image/svg+xml",
};

async function prepareFile(url) {
  let filePath = FRONTEND_PATH + url;
  if (url === "/") filePath = FRONTEND_PATH + "/index.html";

  // Checks to see if path exists in the filesystem
  const ifPathExists = await fs.promises.access(filePath).then(...toBool);

  // If the path exists, go to its path, otherwise go to home page.
  const streamPath = ifPathExists ? filePath : `${FRONTEND_PATH}/index.html`;

  // Creates it as a stream that reads the path
  const streamFile = fs.createReadStream(streamPath);

  // Extension is needed for MIME types
  const extension = path.extname(streamPath).substring(1);

  return { streamFile, extension, ifPathExists };
}

const server = createServer(async (req, res) => {
  const file = await prepareFile(req.url);
  const statusCode = file.ifPathExists ? 200 : 404;
  const fileMimeType = MIME_TYPES[file.extension] || MIME_TYPES.default;
  res.writeHead(statusCode, { "Content-Type": fileMimeType });
  file.streamFile.pipe(res);
});

server.listen(PORT, () => {
  console.log("Listening on port 3000");
});

// Create a connection to the database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to the database
connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL Database!");

  // Example query
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) throw err;
    console.log(results);
  });

  // Close the connection
  connection.end();
});
