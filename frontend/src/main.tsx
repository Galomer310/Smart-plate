// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

// ✅ add these:
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
// Keep this path consistent with your Navbar import:
import store from "./store/srote"; // if your file is actually 'store.ts', update both places

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
