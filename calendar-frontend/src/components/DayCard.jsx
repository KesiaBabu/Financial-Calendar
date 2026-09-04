// src/DayCard.jsx
import React from 'react';
import { Paper, Typography, Stack, Box, Divider, useTheme } from '@mui/material';
import { format } from 'date-fns';

export default function DayCard({ date, counts = {}, selected = false, onClick = () => {} }) {
  const theme = useTheme();
  const dayName = format(date, 'EEE');
  const dayNum = format(date, 'd');
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const categories = ['Economic', 'Earnings', 'Dividends'];

  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? '#000000' : '#ffffff';
  const selectedBg = isDark ? '#2c2c2c' : '#d9d9d9';
  const borderColor = isDark ? '#3a3a3a' : '#cfcfcf';

  return (
    <Paper
      onClick={onClick}
      elevation={0}
      sx={{
        flex: '1 1 calc(14.2% - 8px)', // fits 7 cards per row
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${borderColor}`,
        cursor: 'pointer',
        backgroundColor: selected ? selectedBg : cardBg,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          backgroundColor: selected
            ? selectedBg
            : isDark
            ? '#111111'
            : '#f1f1f1',
        },
      }}
    >
      <Stack spacing={1.2}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: isToday ? 'primary.main' : 'text.primary',
            }}
          >
            {dayName} {dayNum}
          </Typography>

          {isToday && (
            <Box
              sx={{
                fontSize: '0.65rem',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                px: 0.8,
                py: 0.1,
                borderRadius: 1,
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Today
            </Box>
          )}
        </Box>

        <Divider sx={{ opacity: 0.2 }} />

        {/* Category counts (no bullets) */}
        <Box>
          {categories.map((label) => (
            <Box
              key={label}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 0.3,
              }}
            >
              {/* Removed bullet circle */}
              <Typography
                variant="caption"
                sx={{
                  color: counts[label] ? 'text.primary' : 'text.disabled',
                  fontWeight: 500,
                }}
              >
                {label}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: counts[label]
                    ? theme.palette.text.primary
                    : theme.palette.text.disabled,
                }}
              >
                {counts[label] || 0}
              </Typography>
            </Box>
          ))}
        </Box>
      </Stack>
    </Paper>
  );
}
