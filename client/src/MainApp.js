import React from 'react';
import { ThemeProvider } from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';

function MainApp() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <App />
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{
          fontSize: '14px'
        }}
        toastStyle={{
          backgroundColor: theme.colors.background.paper,
          color: theme.colors.text.primary,
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.lg
        }}
      />
    </ThemeProvider>
  );
}

export default MainApp;