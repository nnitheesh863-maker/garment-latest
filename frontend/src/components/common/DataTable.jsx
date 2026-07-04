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
} from '@mui/material';

export default function DataTable({
  columns,
  rows,
  loading = false,
  defaultSortBy,
  defaultSortDir = 'asc',
  rowsPerPageOptions = [10, 25, 50],
  defaultRowsPerPage = 10,
  searchable = true,
  searchPlaceholder = 'Search...',
  onRowClick,
  emptyMessage = 'No data available',
  stickyHeader = false,
  maxHeight,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [sortBy, setSortBy] = useState(defaultSortBy || (columns[0]?.id));
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
        const val = row[col.id];
        if (val == null) return false;
        return String(val).toLowerCase().includes(lower);
      })
    );
  }, [search, rows, columns]);

  const sortedRows = useMemo(() => {
    if (!filteredRows) return [];
    const sorted = [...filteredRows].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [filteredRows, sortBy, sortDir]);

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
    const val = row[col.id];
    if (val == null) return '-';
    return val;
  };

  if (loading) {
    return (
      <Paper>
        <Box p={2}>
          {searchable && <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: 1 }} />}
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 0.5, borderRadius: 0 }} />
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper>
      {searchable && (
        <Box p={2} pb={1}>
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            fullWidth
            variant="outlined"
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
                  sx={{ fontWeight: 600, whiteSpace: 'nowrap', ...col.sx }}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={sortBy === col.id}
                      direction={sortBy === col.id ? sortDir : 'asc'}
                      onClick={() => handleSort(col.id)}
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
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
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
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align || 'left'} sx={col.sx}>
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
      />
    </Paper>
  );
}
