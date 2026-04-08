import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Provider } from "react-redux";
import { store } from "./redux/store";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Render the app
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);


//parche
const originalFetch = window.fetch;

window.fetch = (url, options = {}) => {
  const newOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      'x-api-key': 'mi_clave_frontend'
    }
  };

  return originalFetch(url, newOptions);
};

root.render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
