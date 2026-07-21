import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '../styles/theme';

jest.mock('axios', () => {
  const post = jest.fn();
  const put = jest.fn();
  return {
    create: () => ({ post, put }),
    __mockPost: post,
    __mockPut: put
  };
});

import axios from 'axios';
import ManageBooking from './ManageBooking';

const mockPost = axios.__mockPost;
const mockPut = axios.__mockPut;

const bookingFixture = {
  summary: 'Project planning meeting',
  email: 'booker@example.com',
  start: '2026-07-28T06:00:00.000Z',
  end: '2026-07-28T06:30:00.000Z',
  timezone: 'Asia/Seoul',
  purpose: 'Plan the launch',
  meetingType: 'video',
  attendeeStatus: 'needsAction',
  calendarLink: 'https://calendar.google.com/event?eid=example',
  meetLink: 'https://meet.google.com/abc-defg-hij'
};

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <ManageBooking />
    </ThemeProvider>
  );
}

beforeEach(() => {
  mockPost.mockReset();
  mockPut.mockReset();
  window.history.replaceState(null, '', '/manage');
});

test('requests private management links for an existing booker', async () => {
  mockPost.mockResolvedValueOnce({
    data: {
      message: 'If matching bookings exist, updated Calendar invitations with management links will arrive shortly.'
    }
  });

  renderPage();
  fireEvent.change(screen.getByLabelText(/booking email/i), {
    target: { value: 'booker@example.com' }
  });
  fireEvent.click(screen.getByRole('button', { name: /request management link/i }));

  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledWith('/api/booking/manage/request-link', {
      email: 'booker@example.com'
    });
  });
  expect(await screen.findByText(/updated calendar invitations/i)).toBeInTheDocument();
});

test('loads a booking from the private fragment token without putting it in the URL query', async () => {
  const token = '123e4567-e89b-12d3-a456-426614174000.private-signature';
  window.history.replaceState(null, '', `/manage#${token}`);
  mockPost.mockResolvedValueOnce({
    data: { booking: bookingFixture }
  });

  renderPage();

  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledWith('/api/booking/manage/lookup', { token });
  });
  expect(await screen.findByRole('heading', { name: 'Project planning meeting' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  expect(window.location.search).toBe('');
});

test('updates the same booking and reports the Calendar change', async () => {
  const token = '123e4567-e89b-12d3-a456-426614174000.private-signature';
  window.history.replaceState(null, '', `/manage#${token}`);
  mockPost.mockResolvedValueOnce({ data: { booking: bookingFixture } });
  mockPut.mockResolvedValueOnce({
    data: {
      message: 'Booking updated successfully',
      booking: {
        ...bookingFixture,
        start: '2026-08-03T01:30:00.000Z',
        end: '2026-08-03T02:30:00.000Z',
        purpose: 'Updated agenda'
      }
    }
  });

  renderPage();
  await screen.findByRole('heading', { name: 'Project planning meeting' });

  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-08-03' } });
  fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '10:30' } });
  fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '60' } });
  fireEvent.change(screen.getByLabelText('Meeting purpose'), { target: { value: 'Updated agenda' } });
  fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

  await waitFor(() => {
    expect(mockPut).toHaveBeenCalledWith('/api/booking/manage', {
      token,
      date: '2026-08-03',
      time: '10:30',
      durationMinutes: 60,
      purpose: 'Updated agenda',
      timezone: 'Asia/Seoul'
    });
  });
  expect(await screen.findByText('Booking updated successfully')).toBeInTheDocument();
});
