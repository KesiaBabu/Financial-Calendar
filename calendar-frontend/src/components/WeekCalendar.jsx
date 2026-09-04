import React, { useMemo, useState, useEffect } from 'react';
import EventTable from './EventTable';
import {
  Box,
  IconButton,
  Button,
  Alert,
  Typography,
  Stack,
  Fade,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  startOfWeek,
  addDays,
  format,
  addWeeks,
  subWeeks,
  endOfWeek,
} from 'date-fns';
import DayCard from './DayCard';
import { ThemeToggleButton } from '/src/ThemeProviderWrapper';
import { useTheme } from '@mui/material/styles';

export default function WeekCalendar() {
  const [current, setCurrent] = useState(new Date());
  const [category, setCategory] = useState(null);
  const [summary, setSummary] = useState(null);
  const [hovered, setHovered] = useState(false); // 👈 Hover state for week area

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const selectedISO = format(current, 'yyyy-MM-dd');
  const weekStart = useMemo(() => startOfWeek(current, { weekStartsOn: 1 }), [current]);
  const weekEnd = useMemo(() => endOfWeek(current, { weekStartsOn: 1 }), [current]);

  const days = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    async function fetchWeeklyCounts() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/summary?week_start=${format(
            weekStart,
            'yyyy-MM-dd'
          )}`
        );
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error('Error fetching weekly counts:', err);
      }
    }
    fetchWeeklyCounts();
  }, [weekStart]);

  const goPrevWeek = () => setCurrent((d) => subWeeks(d, 1));
  const goNextWeek = () => setCurrent((d) => addWeeks(d, 1));
  const goToday = () => setCurrent(new Date());
  const dateRangeTitle = `${format(weekStart, 'MMM d')} — ${format(
    weekEnd,
    'MMM d, yyyy'
  )}`;

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, position: 'relative' }}>
      <ThemeToggleButton />

      <Typography
        component="h1"
        variant="h4"
        sx={{ mb: 5, fontWeight: 500, color: 'text.primary', textAlign: 'center' }}
      >
        Financial Trading Calendar
      </Typography>

      {/* HEADER SECTION */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<TodayIcon />}
            onClick={goToday}
            sx={{ fontWeight: 600 }}
          >
            Today
          </Button>

          <DatePicker
            views={['year', 'month', 'day']}
            value={current}
            onChange={(newVal) => newVal && setCurrent(newVal)}
            slotProps={{
              textField: { size: 'small', sx: { width: 150 } },
              actionBar: { actions: ['today'] },
            }}
          />
          <IconButton onClick={goPrevWeek}> 
            <ChevronLeft /> 
            </IconButton>

          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              minWidth: 200,
              textAlign: 'center',
              color: 'text.primary',
            }}
          >
            {dateRangeTitle}
            <IconButton onClick={goNextWeek}>
               <ChevronRight /> 
               </IconButton>
          </Typography>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        Economic and Dividend event data are currently unavailable. Earnings data is available.
      </Alert>

      {/* WEEK CARDS + FLOATING CHEVRONS */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          '&:hover': { cursor: 'pointer' },
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ⬅️ Floating Left Arrow */}
        <Fade in={hovered}>
          <IconButton
            onClick={goPrevWeek}
            size="medium"
            sx={{
              position: 'absolute',
              left: -45,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor:
                theme.palette.mode === 'dark'
                  ? theme.palette.grey[800]
                  : 'white',
              boxShadow: 3,
              zIndex: 10,
              '&:hover': {
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.grey[700]
                    : theme.palette.grey[200],
              },
            }}
          >
            <ChevronLeft />
          </IconButton>
        </Fade>

        {/* 7 Day Cards */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            gap: 1,
          }}
        >
          {days.map((day) => {
            const iso = format(day, 'yyyy-MM-dd');
            const isSelected = iso === selectedISO;
            const counts =
              summary?.days?.find((d) => d.iso === iso)?.counts || {};
            return (
              <DayCard
                key={iso}
                date={day}
                counts={counts}
                selected={isSelected}
                onClick={() => setCurrent(day)}
              />
            );
          })}
        </Box>

        {/* ➡️ Floating Right Arrow */}
        <Fade in={hovered}>
          <IconButton
            onClick={goNextWeek}
            size="medium"
            sx={{
              position: 'absolute',
              right: -45,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor:
                theme.palette.mode === 'dark'
                  ? theme.palette.grey[800]
                  : 'white',
              boxShadow: 3,
              zIndex: 10,
              '&:hover': {
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.grey[700]
                    : theme.palette.grey[200],
              },
            }}
          >
            <ChevronRight />
          </IconButton>
        </Fade>
      </Box>

      {/* CATEGORY FILTERS */}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          mt: 2,
          flexWrap: 'wrap',
          justifyContent: isSmall ? 'center' : 'flex-start',
        }}
      >
        {['Economic', 'Earnings', 'Dividends', 'Revenue'].map((c) => {
          const isSelected = category === c;
          return (
            <Button
              key={c}
              variant={isSelected ? 'contained' : 'outlined'}
              color="inherit"
              onClick={() => setCategory(isSelected ? null : c)}
              sx={{
                minWidth: 100,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                backgroundColor: isSelected
                  ? (theme) =>
                      theme.palette.mode === 'dark'
                        ? theme.palette.grey[800]
                        : theme.palette.grey[300]
                  : 'transparent',
                '&:hover': {
                  boxShadow: 'none',
                  transform: 'translateY(-1px)',
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? theme.palette.grey[700]
                      : theme.palette.grey[200],
                },
              }}
            >
              {c}
            </Button>
          );
        })}
      </Stack>

      {/* EVENTS TABLE */}
      <Box sx={{ mt: 3 }}>
        <EventTable selectedDate={selectedISO} category={category} />
      </Box>
    </Box>
  );
}
