import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import * as sentry from "./utils/sentry";
import "./style/main.css";

// There's a bug in Cordova IOS that prevents
// full screen elements from taking full screen
// https://github.com/apache/cordova-ios/issues/965#issuecomment-1017265047
if (__APP_PLATFORM__ === "cdv-ios") {
  const { style } = document.documentElement;
  style.width = "100vw";
  style.height = "100vh";
}

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
