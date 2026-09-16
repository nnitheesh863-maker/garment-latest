import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  Box,
  Paper,
  Skeleton,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import InboxIcon from '@mui/icons-material/Inbox';
import { motion } from 'framer-motion';

export default function DataTable({
  columns,
  rows,
  loading = false,
  defaultSortBy,
  defaultSortDir = 'asc',
  rowsPerPageOptions = [10, 25, 50],
  defaultRowsPerPage = 10,
  searchable = true,
  searchPlaceholder = 'Search records...',
  onRowClick,
  emptyMessage = 'No matching records found',
  stickyHeader = true,
  maxHeight,
  elevated = true,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [sortBy, setSortBy] = useState(defaultSortBy || columns[0]?.id);
  const [sortDir, setSortDir] = useState(defaultSortDir);
  const [search, setSearch] = useState('');

  const handleSort = (columnId) => {
    if (sortBy === columnId) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(columnId);
      setSortDir('asc');
    }
  };

  const filteredRows = useMemo(() => {
    if (!search || !rows) return rows || [];
    const lower = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const val = col.accessor ? col.accessor(row) : row[col.id];
        if (val == null) return false;
        return String(val).toLowerCase().includes(lower);
      })
    );
  }, [search, rows, columns]);

  const sortedRows = useMemo(() => {
    if (!filteredRows) return [];
    const sorted = [...filteredRows].sort((a, b) => {
      const aVal = sortBy
        ? columns.find((c) => c.id === sortBy)?.accessor?.(a) ?? a[sortBy]
        : null;
      const bVal = sortBy
        ? columns.find((c) => c.id === sortBy)?.accessor?.(b) ?? b[sortBy]
        : null;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string' || typeof bVal === 'string') {
        return sortDir === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [filteredRows, sortBy, sortDir, columns]);

  const paginatedRows = useMemo(() => {
    return sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderCell = (row, col) => {
    if (col.render) return col.render(row[col.id], row);
    if (col.accessor) return col.accessor(row);
    const val = row[col.id];
    if (val == null) return '-';
    return val;
  };

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          border: (theme) =>
            `1px solid ${
              theme.palette.mode === 'light' ? 'rgba(241, 213, 192, 0.7)' : '#3A262B'
            }`,
          p: 2.5,
          bgcolor: 'background.paper',
        }}
      >
        {searchable && (
          <Skeleton
            variant="rectangular"
            height={46}
            sx={{ mb: 2.5, borderRadius: '12px' }}
          />
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, pb: 1 }}>
          <Skeleton width="20%" height={24} />
          <Skeleton width="25%" height={24} />
          <Skeleton width="20%" height={24} />
          <Skeleton width="25%" height={24} />
        </Box>
        {[...Array(5)].map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={52}
            sx={{ mb: 1, borderRadius: '12px', mx: 0.5 }}
          />
        ))}
      </Paper>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          overflow: 'hidden',
          border: (theme) =>
            `1px solid ${
              theme.palette.mode === 'light' ? 'rgba(241, 213, 192, 0.7)' : '#3A262B'
            }`,
          boxShadow: (theme) =>
            theme.palette.mode === 'light'
              ? '0 8px 32px rgba(89, 23, 27, 0.05)'
              : '0 8px 32px rgba(0, 0, 0, 0.4)',
          bgcolor: 'background.paper',
        }}
      >
        {searchable && (
          <Box p={2} pb={1.5}>
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#7A6A63', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>
        )}
        <TableContainer sx={{ maxHeight: maxHeight || 'auto' }}>
          <Table stickyHeader={stickyHeader} size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    align={col.align || 'left'}
                    sx={{
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      py: 1.5,
                      fontSize: '0.85rem',
                      letterSpacing: '0.01em',
                      ...col.sx,
                    }}
                  >
                    {col.sortable !== false ? (
                      <TableSortLabel
                        active={sortBy === col.id}
                        direction={sortBy === col.id ? sortDir : 'asc'}
                        onClick={() => handleSort(col.id)}
                        sx={{
                          '&.MuiTableSortLabel-active': { color: 'primary.main', fontWeight: 800 },
                          '& .MuiTableSortLabel-icon': { opacity: 1, color: '#7A2328' },
                        }}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        mx: 'auto',
                        mb: 1.5,
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: (theme) =>
                          theme.palette.mode === 'light'
                            ? 'rgba(254, 215, 184, 0.35)'
                            : 'rgba(164, 90, 74, 0.2)',
                        color: '#7A6A63',
                      }}
                    >
                      <InboxIcon sx={{ fontSize: 30 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row, index) => (
                  <TableRow
                    key={row._id || row.id || index}
                    hover={!!onRowClick}
                    onClick={() => onRowClick && onRowClick(row)}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background-color 0.2s ease, transform 0.15s ease',
                      '&:hover': {
                        bgcolor: (theme) =>
                          theme.palette.mode === 'light'
                            ? 'rgba(254, 215, 184, 0.18)'
                            : 'rgba(255, 255, 255, 0.04)',
                      },
                    }}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        align={col.align || 'left'}
                        sx={{ py: 1.25, fontSize: '0.875rem', ...col.sx }}
                      >
                        {renderCell(row, col)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={sortedRows.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          sx={{
            borderTop: (theme) =>
              `1px solid ${
                theme.palette.mode === 'light' ? 'rgba(241, 213, 192, 0.6)' : '#3A262B'
              }`,
            '& .MuiTablePagination-toolbar': { minHeight: 56 },
          }}
        />
      </Paper>
    </motion.div>
  );
}
