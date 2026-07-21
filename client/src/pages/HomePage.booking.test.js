import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '../styles/theme';

jest.mock('axios', () => {
  const get = jest.fn();
  const post = jest.fn();
  return {
    create: () => ({ get, post }),
    __mockGet: get,
    __mockPost: post
  };
});

import axios from 'axios';
import HomePage from './HomePage';

const mockGet = axios.__mockGet;
const mockPost = axios.__mockPost;

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockGet.mockImplementation((url) => {
    if (url === '/api/auth/user') {
      return Promise.resolve({ data: { authenticated: false } });
    }
    if (url.startsWith('/api/calendar/available-slots')) {
      return Promise.resolve({ data: { slots: ['2:30 PM'] } });
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
});

test('reuses one request identity after a failed booking attempt and explains Calendar delivery', async () => {
  mockPost
    .mockRejectedValueOnce({ response: { data: { error: 'Temporary failure' } } })
    .mockResolvedValueOnce({
      data: {
        success: true,
        email: 'booker@example.com',
        calendarLink: 'https://calendar.google.com/calendar/event?eid=example',
        manageUrl: 'https://schedule.moondo.ai/manage#private-token'
      }
    });

  render(
    <ThemeProvider theme={theme}>
      <HomePage />
    </ThemeProvider>
  );

  fireEvent.click(await screen.findByRole('button', { name: '2:30 PM' }));
  fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test Booker' } });
  fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'booker@example.com' } });
  fireEvent.change(screen.getByLabelText('Meeting Purpose *'), { target: { value: 'Plan the launch' } });

  fireEvent.click(screen.getByRole('button', { name: 'Book Meeting' }));
  await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Book Meeting' })).not.toBeDisabled());
  fireEvent.click(screen.getByRole('button', { name: 'Book Meeting' }));

  await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(2));
  const firstIdentity = mockPost.mock.calls[0][1].idempotencyKey;
  const retryIdentity = mockPost.mock.calls[1][1].idempotencyKey;
  expect(firstIdentity).toMatch(/^[A-Za-z0-9_-]{16,128}$/);
  expect(retryIdentity).toBe(firstIdentity);
  expect(await screen.findByText(/google calendar invitation has been sent/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /manage this booking/i })).toHaveAttribute(
    'href',
    'https://schedule.moondo.ai/manage#private-token'
  );
});
