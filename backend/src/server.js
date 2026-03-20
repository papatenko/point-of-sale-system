import { createServer } from "http";
import fs from "node:fs";
import path from "node:path";
import { handleEmployeeCreate } from "./auth/create_employ.js";
import{handleCustomerCreate} from './auth/create_users.js'
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

// Read the full JSON body from a request
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : null);
      } catch {
        resolve(null);
      }
    });
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  // CORS headers on every request
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // handle preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // API routes
  // if (req.url.startsWith("/api")) {
  //   const body = req.method === "POST" ? await readBody(req) : null;
  //   try {
  //     const result = await mySQLQuery(req.url, body, req.method, req, res);
  //     res.writeHead(200, { "Content-Type": "application/json" });
  //     res.end(JSON.stringify(result));
  //   } catch (err) {
  //     res.writeHead(500, { "Content-Type": "application/json" });
  //     res.end(JSON.stringify({ error: err.message }));
  //   }
  //   return;
  // }

  // Frontend static files
  const file = await prepareFile(req.url);
  const fileMimeType = MIME_TYPES[file.extension] || MIME_TYPES.default;
  res.writeHead(200, { "Content-Type": fileMimeType });
  file.streamFile.pipe(res);
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
      
      console.log("API Request:", req.url, body); //debugging
    }
    
    // res.writeHead(200, { "Content-Type": "application/json" });


    try {
          let result;
          
          // ===== RUTAS ESPECIALES =====
          if (req.url === "/api/auth/login" && req.method === "POST") {
            // LOGIN - pasar email y password como array
            if (body && body.email && body.password) {
              console.log("📨 BODY:", body);

              const params = [body.email, body.password];
              console.log("🚀 PARAMS SENT:", params);

              result = await mySQLQuery("/api/auth/login", params);
            } else {
              result = { success: false, error: "Email and password required" };
            }
          }
          else if (req.url === "/api/employee/create" && req.method === "POST") {
            await handleEmployeeCreate(req, res, body);
            return;
          } else if (req.url === "/api/register-customer" && req.method === "POST") {
            await handleCustomerCreate(req, res, body);
            return;
          }
          else {
        // Para otras rutas (GET generalmente)
        // Convertir body a array si es necesario
        
        // Si es GET o no hay body, pasar array vacío
        let queryParams = [];
        
        // Si hay body, convertir a array apropiadamente
        if (body) {
          if (Array.isArray(body)) {
            // Si ya es array, usarlo directamente
            queryParams = body;
          } else if (typeof body === 'object') {
            
            if (req.url === "/api/register-user") {
              // Para registro, espera [email, password]?
              queryParams = [body.email, body.password];
            } else {
              // Por defecto, poner el objeto como único elemento del array
              queryParams = [body];
            }
          } else {
            // Si es string, number, etc.
            queryParams = [body];
          }
        }
        
        // Para depuración
        console.log(`Query params for ${req.url}:`, queryParams);
        
        // Ejecutar query con los parámetros convertidos
        result = await mySQLQuery(req.url, queryParams);
      }
      
      res.end(JSON.stringify(result));
      
    } catch (error) {
      console.error("API Error:", error);
      res.end(JSON.stringify({ error: error.message }));
    }
  } 
      // ========== ARCHIVOS ESTÁTICOS ==========
      // else {
      //   res.writeHead(200, { "Content-Type": fileMimeType });
      //   file.streamFile.pipe(res);
      // }
    });


server.listen(PORT, () => {
  console.log("Listening on port 3000");
});
