import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import * as sentry from "./utils/sentry";

const App = lazy(async () => import("./app"));

void sentry.setup();

const rootElement = document.querySelector("#root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Suspense fallback="Loading...">
      <App />
    </Suspense>
  </React.StrictMode>
);
