import React from 'react';
import { Container, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import WeekCalendar from './components/WeekCalendar';

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <WeekCalendar />
      </Container>
    </LocalizationProvider>
  );
}
