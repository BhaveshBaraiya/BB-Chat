import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from "./context/ThemeContext"
import AuthProvider from "./context/AuthContext";
import SocketProvider from "./context/SocketContext";
import ChatProvider from "./context/ChatContext";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot( document.getElementById('root') ).render(
  <AuthProvider>
    <SocketProvider>
      <ChatProvider>
        <ThemeProvider>
          <Toaster position="top-right" />
          <App />
        </ThemeProvider>
      </ChatProvider>
    </SocketProvider>
  </AuthProvider>
)