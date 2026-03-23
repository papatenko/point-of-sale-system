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

  function deleteRoute(path, handler) {
    routes.push({ method: "DELETE", path, handler });
  }

  async function match(method, path, body, db, ...args) {
    const route = routes.find(
      (r) => r.method === method && r.path === path,
    );
    if (route) {
      return await route.handler(body, db, ...args);
    }
    return null;
  }

  return { get, post, put, delete: deleteRoute, match };
}
