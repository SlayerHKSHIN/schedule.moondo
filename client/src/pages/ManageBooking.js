import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const api = axios.create({
  baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4312'
    : '',
  withCredentials: true
});

const Page = styled.main`
  min-height: 100vh;
  padding: ${props => props.theme.spacing.lg};
  background: linear-gradient(135deg, ${props => props.theme.colors.background.default}, ${props => props.theme.colors.beige.light});
  color: ${props => props.theme.colors.text.primary};
`;

const Shell = styled.div`
  width: min(680px, 100%);
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl} 0;
`;

const BackLink = styled.a`
  display: inline-block;
  margin-bottom: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.secondary};
`;

const Header = styled.header`
  margin-bottom: ${props => props.theme.spacing.xl};

  h1 {
    margin-bottom: ${props => props.theme.spacing.sm};
    font-family: ${props => props.theme.typography.headingFontFamily};
    font-size: clamp(2rem, 6vw, 3rem);
  }

  p {
    color: ${props => props.theme.colors.text.secondary};
    line-height: 1.7;
  }
`;

const Card = styled.section`
  padding: ${props => props.theme.spacing.xl};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.theme.colors.background.paper};
  box-shadow: ${props => props.theme.shadows.lg};
`;

const Form = styled.form`
  display: grid;
  gap: ${props => props.theme.spacing.md};
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.sm};
`;

const Label = styled.label`
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.85rem 1rem;
  border: 2px solid ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.card};
  font: inherit;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.theme.colors.pastel.lavender};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.85rem 1rem;
  border: 2px solid ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.card};
  font: inherit;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 110px;
  padding: 0.85rem 1rem;
  border: 2px solid ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.card};
  font: inherit;
  resize: vertical;
`;

const Button = styled.button`
  padding: 0.9rem 1.2rem;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.text.primary};
  color: white;
  font: inherit;
  font-weight: 600;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;

const Notice = styled.p`
  margin-top: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.$error ? props.theme.colors.pastel.rose : props.theme.colors.pastel.sage};
  line-height: 1.6;
`;

const BookingMeta = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.lg} 0;

  dt {
    color: ${props => props.theme.colors.text.secondary};
  }

  dd {
    margin: 0;
  }
`;

const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.lg} 0;
`;

function getBookingForm(booking) {
  const timezone = booking.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(booking.start));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const duration = Math.round((new Date(booking.end) - new Date(booking.start)) / 60000);

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
    duration: duration > 30 ? '60' : '30',
    purpose: booking.purpose || '',
    timezone
  };
}

function ManageBooking() {
  const [token] = useState(() => window.location.hash.slice(1));
  const [email, setEmail] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [booking, setBooking] = useState(null);
  const [bookingForm, setBookingForm] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(Boolean(token));
  const [lookupError, setLookupError] = useState('');
  const [saving, setSaving] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    if (!token) return;

    let active = true;
    api.post('/api/booking/manage/lookup', { token })
      .then((response) => {
        if (!active) return;
        setBooking(response.data.booking);
        setBookingForm(getBookingForm(response.data.booking));
      })
      .catch((error) => {
        if (!active) return;
        setLookupError(error.response?.data?.error || 'This management link is invalid or has expired.');
      })
      .finally(() => {
        if (active) setLoadingBooking(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const requestLinks = async (event) => {
    event.preventDefault();
    setRequesting(true);
    setRequestMessage('');
    setRequestError('');

    try {
      const response = await api.post('/api/booking/manage/request-link', {
        email: email.trim().toLowerCase()
      });
      setRequestMessage(response.data.message);
    } catch (error) {
      setRequestError(error.response?.data?.error || 'We could not send the management link. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  const updateBooking = async (event) => {
    event.preventDefault();
    setSaving(true);
    setUpdateMessage('');
    setUpdateError('');

    try {
      const response = await api.put('/api/booking/manage', {
        token,
        date: bookingForm.date,
        time: bookingForm.time,
        durationMinutes: Number(bookingForm.duration),
        purpose: bookingForm.purpose.trim(),
        timezone: bookingForm.timezone
      });
      setBooking(response.data.booking);
      setBookingForm(getBookingForm(response.data.booking));
      setUpdateMessage(response.data.message);
    } catch (error) {
      setUpdateError(error.response?.data?.error || 'We could not update this booking. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <Shell>
        <BackLink href="/">← Book a new meeting</BackLink>
        <Header>
          <h1>Manage your booking</h1>
          <p>Use the private link in your Google Calendar invitation to view or change a meeting.</p>
        </Header>
        {!token && (
          <Card>
            <h2>Find an existing booking</h2>
            <p>Enter the same email address you used to book. If a booking matches, Google Calendar will send an updated invitation containing its private management link.</p>
            <Form onSubmit={requestLinks}>
              <Label htmlFor="booking-email">Booking email</Label>
              <Input
                id="booking-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Button type="submit" disabled={requesting}>
                {requesting ? 'Requesting…' : 'Request management link'}
              </Button>
            </Form>
            {requestMessage && <Notice role="status">{requestMessage}</Notice>}
            {requestError && <Notice $error role="alert">{requestError}</Notice>}
          </Card>
        )}

        {token && loadingBooking && <Card aria-live="polite">Loading your booking…</Card>}

        {token && lookupError && (
          <Card>
            <Notice $error role="alert">{lookupError}</Notice>
            <a href="/manage">Request a new management link</a>
          </Card>
        )}

        {token && booking && bookingForm && (
          <Card>
            <h2>{booking.summary}</h2>
            <BookingMeta>
              <dt>Booked for</dt><dd>{booking.email}</dd>
              <dt>Timezone</dt><dd>{booking.timezone}</dd>
              <dt>Invitation</dt><dd>{booking.attendeeStatus || 'pending'}</dd>
            </BookingMeta>
            <LinkRow>
              {booking.calendarLink && <a href={booking.calendarLink} target="_blank" rel="noreferrer">Open Google Calendar</a>}
              {booking.meetLink && <a href={booking.meetLink} target="_blank" rel="noreferrer">Join Google Meet</a>}
            </LinkRow>
            <Form onSubmit={updateBooking}>
              <FieldGrid>
                <Field>
                  <Label htmlFor="booking-date">Date</Label>
                  <Input
                    id="booking-date"
                    type="date"
                    value={bookingForm.date}
                    onChange={(event) => setBookingForm({ ...bookingForm, date: event.target.value })}
                    required
                  />
                </Field>
                <Field>
                  <Label htmlFor="booking-time">Start time</Label>
                  <Input
                    id="booking-time"
                    type="time"
                    value={bookingForm.time}
                    onChange={(event) => setBookingForm({ ...bookingForm, time: event.target.value })}
                    required
                  />
                </Field>
              </FieldGrid>
              <Field>
                <Label htmlFor="booking-duration">Duration</Label>
                <Select
                  id="booking-duration"
                  value={bookingForm.duration}
                  onChange={(event) => setBookingForm({ ...bookingForm, duration: event.target.value })}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="booking-purpose">Meeting purpose</Label>
                <Textarea
                  id="booking-purpose"
                  value={bookingForm.purpose}
                  onChange={(event) => setBookingForm({ ...bookingForm, purpose: event.target.value })}
                  required
                />
              </Field>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
            </Form>
            {updateMessage && <Notice role="status">{updateMessage}</Notice>}
            {updateError && <Notice $error role="alert">{updateError}</Notice>}
          </Card>
        )}
      </Shell>
    </Page>
  );
}

export default ManageBooking;
