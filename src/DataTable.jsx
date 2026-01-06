import React, { useState, useMemo } from 'react';

export default function DataTable({ data, city }) {
    if (!data) return null;

    const [sortConfig, setSortConfig] = useState({ key: 'TOTAL', direction: 'desc' });

    const originalRows = data.features.map((feature) => feature.properties);

    // sorting logic
    const sortedRows = useMemo(() => {
        let sortableItems = [...originalRows];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key] ?? 0;
                const bValue = b[sortConfig.key] ?? 0;

                // numeric sort
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }
                // string sort for district names
                else {
                    return sortConfig.direction === 'asc'
                        ? String(aValue).localeCompare(String(bValue), undefined, { numeric: true })
                        : String(bValue).localeCompare(String(aValue), undefined, { numeric: true });
                }
            });
        }
        return sortableItems;
    }, [originalRows, sortConfig]);

    // handler for header clicks
    const requestSort = (key) => {
        let direction = 'desc';
        // If clicking the same header, toggle direction
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    // helper to draw sort arrows
    const getSortIcon = (name) => {
        if (sortConfig.key !== name) return <span className="text-gray-300 ml-1">⇅</span>;
        return sortConfig.direction === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
    };

    const downloadCSV = () => {
        if (!sortedRows.length) return;

        const headers = ["DISTRICT", "TOTAL", "WHITE", "BLACK", "HISPANIC", "ASIAN",
            "AMERICAN_INDIAN", "PACIFIC_ISLANDER", "TWO_OR_MORE", "OTHER"];
        const csvContent = [
            headers.join(","),
            ...sortedRows.map(row =>
                headers.map(header => {
                    const val = row[header] ?? 0;
                    return `"${val}"`;
                }).join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const safeName = city.name.replace(/, /g, "_").replace(/ /g, "_");
        link.setAttribute("download", `${safeName}_demographics.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // helper component for table headers
    const SortableHeader = ({ label, sortKey, align = "right" }) => (
        <th
            onClick={() => requestSort(sortKey)}
            className={`px-6 py-3 text-${align} text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 select-none group transition-colors`}
        >
            <div className={`flex items-center ${align === "right" ? "justify-end" : "justify-start"}`}>
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="w-full max-w-5xl mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">District Data: {city.name}</h3>
                <button
                    onClick={downloadCSV}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download CSV
                </button>
            </div>

            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                            <SortableHeader label="District" sortKey="DISTRICT" align="left" />
                            <SortableHeader label="Total Pop" sortKey="TOTAL" />
                            <SortableHeader label="White" sortKey="WHITE" />
                            <SortableHeader label="Black" sortKey="BLACK" />
                            <SortableHeader label="Hispanic" sortKey="HISPANIC" />
                            <SortableHeader label="Asian" sortKey="ASIAN" />
                            <SortableHeader label="Am. Indian" sortKey="AMERICAN_INDIAN" />
                            <SortableHeader label="Pac. Islander" sortKey="PACIFIC_ISLANDER" />
                            <SortableHeader label="Two+" sortKey="TWO_OR_MORE" />
                            <SortableHeader label="Other" sortKey="OTHER" />
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.DISTRICT}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{row.TOTAL.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{row.WHITE.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{row.BLACK.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{row.HISPANIC.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{row.ASIAN.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{row.AMERICAN_INDIAN.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{row.PACIFIC_ISLANDER.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{row.TWO_OR_MORE.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{row.OTHER.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}