import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { Provider } from 'react-redux';
import { store } from './redux/store'; 

import { ThemeProvider } from "./context/ThemeContext";
import SocketProvider from "./context/SocketContext";
import { CallProvider } from "./context/CallContext"; 
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>    
      <SocketProvider>
          <CallProvider>
            <ThemeProvider>
              <Toaster position="top-right" />
              <App />
            </ThemeProvider>
          </CallProvider>
      </SocketProvider>    
  </Provider>
);