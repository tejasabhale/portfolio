import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import SmoothScroll from "./components/ui/SmoothScroll.jsx";
import ScrollToTop from "./components/ui/ScrollToTop.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <SmoothScroll />
    <ScrollToTop />
    <App />
  </BrowserRouter>,
);
