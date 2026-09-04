// src/EventTable.jsx
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Stack,
  CircularProgress,
  Alert,
  useTheme,
} from "@mui/material";

const unavailableCategories = {
  Economic: "Economic event data is not currently available.",
  Dividends: "Dividend event data is not currently available.",
};

export default function EventTable({ selectedDate, category }) {
  const [columns, setColumns] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  // ✅ Format date to YYYY-MM-DD safely
  const formatDateToISO = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d)) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // ✅ Fetch data from FastAPI backend
  useEffect(() => {
    if (!selectedDate || !category) {
      setColumns([]);
      setEvents([]);
      return;
    }

    if (unavailableCategories[category]) {
      setColumns([]);
      setEvents([]);
      return;
    }

    async function fetchEvents() {
      setLoading(true);
      try {
        // const formattedDate = selectedDate.toISOString().slice(0, 10);
        const formattedDate = formatDateToISO(selectedDate);
        const url = `${import.meta.env.VITE_API_URL}/events?day=${encodeURIComponent(formattedDate)}&category=${encodeURIComponent(category)}`;
        const res = await fetch(url);
        const data = await res.json();

        setColumns(data.columns || []);
        setEvents(data.data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        setColumns([]);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [selectedDate, category]);

  // ✅ Loading state
  if (loading)
    return (
      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );

  // ✅ Empty state
  if (category && unavailableCategories[category])
    return (
      <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
        {unavailableCategories[category]}
      </Alert>
    );

  if (!events.length)
    return (
      <Typography
        variant="body2"
        sx={{
          mt: 3,
          textAlign: "center",
          color: "text.secondary",
          fontStyle: "italic",
        }}
      >
        {category
          ? `No ${category} data available for ${selectedDate}`
          : `Select a category to view events`}
      </Typography>
    );

  // ✅ Key mapping helper (handles backend key names cleanly)
  const getValue = (row, header) => {
    const key = header
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]/g, "");
    return row[key] || "-";
  };

  // ✅ Special rendering for flags and emojis
  const renderCell = (header, value, row) => {
    if (header === "Flag" || header === "Country") {
      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <span style={{ fontSize: "1.4rem" }}>{row.flag || "🏳️"}</span>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.country || ""}
          </Typography>
        </Stack>
      );
    }
    return value;
  };

  // ✅ Table UI
  return (
    <Box sx={{ mt: 4, overflowX: "auto" }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: "primary.main",
          borderBottom: `2px solid ${theme.palette.primary.main}`,
          display: "inline-block",
          mb: 2,
          pb: 0.5,
        }}
      >
        {category} Data — {selectedDate}
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          boxShadow: 2,
          overflow: "auto",
          "&::-webkit-scrollbar": { height: 8 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.mode === "dark" ? "#555" : "#ccc",
            borderRadius: 10,
          },
        }}
      >
        <Table stickyHeader size="small" sx={{ minWidth: 800 }}>
          {/* ✅ Table Header */}
          <TableHead>
            <TableRow
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[900]
                    : theme.palette.grey[200],
              }}
            >
              {columns.map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    borderBottom: `2px solid ${theme.palette.divider}`,
                    whiteSpace: "nowrap",
                    fontSize: "0.9rem",
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* ✅ Table Body */}
          <TableBody>
            {events.map((row, idx) => (
              <TableRow
                key={idx}
                hover
                sx={{
                  backgroundColor:
                    idx % 2 === 0
                      ? theme.palette.action.hover
                      : "transparent",
                  "&:hover": {
                    backgroundColor: theme.palette.action.selected,
                  },
                }}
              >
                {columns.map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      color:
                        header.toLowerCase().includes("actual") &&
                        category === "Earnings"
                          ? theme.palette.success.main
                          : header.toLowerCase().includes("estimate")
                          ? theme.palette.warning.main
                          : header.toLowerCase().includes("surprise")
                          ? theme.palette.error.main
                          : "inherit",
                    }}
                  >
                    {renderCell(header, getValue(row, header), row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
