import { useState, type ReactElement } from "react";
import logo from "./logo.svg";
import "./app.css";

type AppProps = {
  isAware?: boolean;
};

export default function App({ isAware }: AppProps): ReactElement {
  const [count, setCount] = useState(0);

  const handleIncrement = (): void => {
    setCount(count + 1);
  };

  const renderButtonComponent = (): ReactElement => (
    <button type="button" onClick={handleIncrement}>
      count is: {count}
    </button>
  );
  return (
    <>
      <div className="titleBar" />
      <div className="App">
        <header className="App-header">
          <img alt="logo" className="App-logo" src={logo} />
          <p>Hello Vite + React!</p>
          {isAware && <p>You are aware of Vite + React!</p>}
          <p>{renderButtonComponent()}</p>
          <p>
            Edit <code>App.tsx</code> and save to test HMR updates.
          </p>
          <p>
            <a
              className="App-link"
              href="https://reactjs.org"
              rel="noopener noreferrer"
              target="_blank"
            >
              Learn React
            </a>
            {" | "}
            <a
              className="App-link"
              href="https://vitejs.dev/guide/features.html"
              rel="noopener noreferrer"
              target="_blank"
            >
              Vite Docs
            </a>
          </p>
        </header>
      </div>
    </>
  );
}
