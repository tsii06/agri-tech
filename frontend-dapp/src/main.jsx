import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.css";
import "react-loading-skeleton/dist/skeleton.css";
import { QueryProvider } from "./providers/QueryProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryProvider>
    <App />
  </QueryProvider>
);
