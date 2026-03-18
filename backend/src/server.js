import { createServer } from "http";
import fs from "node:fs";
import path from "node:path";
import { handleEmployeeCreate } from "./auth/create_employ.js";
import { mySQLQuery } from "./mysql.js";

// Grabs the built /dist/ directory built from Vite
const FRONTEND_PATH = path.resolve("..") + "/frontend/dist";
const PORT = 3000;

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
  // Frontend Connection
  const file = await prepareFile(req.url);
  const fileMimeType = MIME_TYPES[file.extension] || MIME_TYPES.default;

  // If frontend requests from MYSQL...
//   if (req.url.startsWith("/api")) {
//     let body = null;
//     if (req.method === "POST") {
//       body = await new Promise((resolve) => {
//         let data = "";
//         req.on("data", (chunk) => (data += chunk));
//         req.on("end", () => resolve(JSON.parse(data)));
//       });
//     }
//     res.writeHead(200, { "Content-Type": "text/plain" });
//     res.end(await mySQLQuery(req.url, body));
//   } else {
//     // Else, pipe frontend files
//     res.writeHead(200, { "Content-Type": fileMimeType });
//     file.streamFile.pipe(res);
//   }
// });

// server.listen(PORT, () => {
//   console.log("Listening on port 3000");
// });
  // If frontend requests from MYSQL...
  if (req.url.startsWith("/api")) {
    let body = null;
    if (req.method === "POST") {
      body = await new Promise((resolve) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({});
          }
        });
      });
      
      console.log("API Request:", req.url, body); // Para debugging
    }
    
    res.writeHead(200, { "Content-Type": "application/json" });
    
    try {
      // Procesar diferentes rutas de API
      let result;
      
      if (req.url === "/api/employee/create" && req.method === "POST") {
        // USA EL HANDLER QUE IMPORTAMOS
        await handleEmployeeCreate(req, res, body);
        return; // Importante: return para no continuar
      } else {
        // Para otras rutas API, pasar el body como parámetros
        result = await mySQLQuery(req.url, body);
        res.end(JSON.stringify(result));
      }
      
    } catch (error) {
      console.error("API Error:", error);
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    // Else, pipe frontend files
    res.writeHead(200, { "Content-Type": fileMimeType });
    file.streamFile.pipe(res);
  }
});

server.listen(PORT, () => {
  console.log("Listening on port 3000");
});