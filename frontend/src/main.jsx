import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./styles.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"

const qc = new QueryClient({
  defaultOptions:{ queries:{ retry:1, refetchOnWindowFocus:false } }
})

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <App />
      <Toaster position="top-right" />
    </QueryClientProvider>
  </React.StrictMode>
)
