import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target.tagName === 'INPUT' && target.type === 'text' || target.tagName === 'TEXTAREA') {
      target.value = target.value.toUpperCase();
    }
  });
});

createRoot(document.getElementById("root")).render(<App />);
