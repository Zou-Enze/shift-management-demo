import { useLiveQuery } from 'dexie-react-hooks';
import type { Table, UpdateSpec } from 'dexie';

export function useTable<T extends { id: string }>(table: Table<T, string>) {
  const data = useLiveQuery(() => table.toArray(), []) ?? [];

  const add = (record: T) => table.add(record);
  const update = (id: string, changes: Partial<T>) =>
    table.update(id, changes as UpdateSpec<T>);
  const remove = (id: string) => table.delete(id);
  const bulkRemove = (ids: string[]) => table.bulkDelete(ids);

  return { data, add, update, remove, bulkRemove };
}
