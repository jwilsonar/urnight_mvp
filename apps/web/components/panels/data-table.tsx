'use client';

import { CaretDown, CaretUp, CaretUpDown, MagnifyingGlass } from '@phosphor-icons/react';
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { type ReactNode, useState } from 'react';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';

export interface DataTableFilter {
  /** id de la columna a filtrar (debe usar filterFn de igualdad). */
  columnId: string;
  /** Etiqueta del placeholder del Select. */
  title: string;
  options: { label: string; value: string }[];
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** id de columna sobre la que actúa el buscador (igual a accessorKey). */
  searchColumn?: string;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  pageSize?: number;
  emptyState?: ReactNode;
}

/**
 * Tabla de datos genérica (shadcn + @tanstack/react-table). Búsqueda, filtros
 * faceteados, orden y paginación 100% client-side (el backend devuelve arrays
 * completos). Estados estándar: cargando (skeleton), error (retry), vacío.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  isError,
  onRetry,
  searchColumn,
  searchPlaceholder = 'Buscar…',
  filters,
  pageSize = 10,
  emptyState,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isError) {
    return <ErrorState description="No pudimos cargar la lista." onRetry={onRetry} />;
  }

  const searchCol = searchColumn ? table.getColumn(searchColumn) : undefined;
  const hasToolbar = Boolean(searchCol) || (filters?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      {hasToolbar ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {searchCol ? (
            <div className="relative w-full sm:max-w-xs">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={(searchCol.getFilterValue() as string) ?? ''}
                onChange={(event) => searchCol.setFilterValue(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8"
              />
            </div>
          ) : null}
          {filters?.map((filter) => {
            const column = table.getColumn(filter.columnId);
            if (!column) return null;
            const value = (column.getFilterValue() as string) ?? 'all';
            return (
              <Select
                key={filter.columnId}
                value={value}
                onValueChange={(next) => column.setFilterValue(next === 'all' ? undefined : next)}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder={filter.title} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{filter.title}: todos</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })}
        </div>
      ) : null}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
                  {table.getAllLeafColumns().map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-5 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="even:bg-muted/30 hover:bg-accent">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  {emptyState ?? (
                    <EmptyState
                      icon={<MagnifyingGlass weight="duotone" />}
                      title="Sin resultados"
                      description="Ajusta los filtros o vuelve a intentarlo más tarde."
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && table.getPageCount() > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-foreground"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-foreground"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Cabecera de columna con orden (clic alterna asc/desc). Úsala en `header`. */
export function SortableHeader<TData, TValue>({
  column,
  children,
}: {
  column: Column<TData, TValue>;
  children: ReactNode;
}) {
  if (!column.getCanSort()) return <span>{children}</span>;
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className={cn(
        'inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground',
        sorted ? 'text-foreground' : '',
      )}
    >
      {children}
      {sorted === 'asc' ? (
        <CaretUp className="h-3.5 w-3.5" />
      ) : sorted === 'desc' ? (
        <CaretDown className="h-3.5 w-3.5" />
      ) : (
        <CaretUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  );
}
