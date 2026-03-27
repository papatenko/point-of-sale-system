export function createRouter() {
  const routes = [];

  function get(path, handler) {
    routes.push({ method: "GET", path, handler });
  }

  function post(path, handler) {
    routes.push({ method: "POST", path, handler });
  }

  function put(path, handler) {
    routes.push({ method: "PUT", path, handler });
  }

  function patch(path, handler) {
    routes.push({ method: "PATCH", path, handler });
  }

  function deleteRoute(path, handler) {
    routes.push({ method: "DELETE", path, handler });
  }

  function matchPath(pattern, path) {
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");
    if (patternParts.length !== pathParts.length) return null;
    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(":")) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }

  async function match(method, path, body, db, ...args) {
    for (const route of routes) {
      if (route.method !== method) continue;
      const params = matchPath(route.path, path);
      if (params !== null) {
        return await route.handler(body, db, ...args, params);
      }
    }
    return null;
  }

  return { get, post, put, patch, delete: deleteRoute, match };
}
