import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import * as sentry from "./utils/sentry";

void sentry.setup();

const rootElement = document.querySelector("#root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
