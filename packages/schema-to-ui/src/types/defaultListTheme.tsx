import { ListTheme } from "./ListSchema";

export const defaultListTheme: ListTheme = {
    table: {
        container: 'w-full border-collapse',
        header: {
            container: 'bg-gray-50',
            cell: 'px-4 py-2 text-left font-medium text-gray-500 cursor-pointer',
            sortIcon: 'ml-1',
        },
        row: 'border-t border-gray-200 hover:bg-gray-50',
        cell: 'px-4 py-2',
    },
    pagination: {
        container: 'flex items-center justify-between px-4 py-3 bg-white border-t',
        button: 'px-3 py-1 border rounded disabled:opacity-50',
        text: 'text-sm text-gray-700',
    },
    loading: 'p-4 text-center text-gray-500',
    error: 'p-4 text-center text-red-500',
};
