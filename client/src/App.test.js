import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import App from './App';
import { theme } from './styles/theme';

test('routes existing bookers to the booking management page', () => {
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/manage']}>
        <App />
      </MemoryRouter>
    </ThemeProvider>
  );

  expect(screen.getByRole('heading', { name: /manage your booking/i })).toBeInTheDocument();
});
