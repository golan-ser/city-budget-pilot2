import React from "react";

export const FilterBar = ({ filters, setFilters }: any) => {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-end mb-4">
      <select
        className="border rounded p-2"
        value={filters.year || ""}
        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
      >
        <option value="">כל השנים</option>
        <option value="2023">2023</option>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
      </select>
      <select
        className="border rounded p-2"
        value={filters.status || ""}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <option value="">כל הסטטוסים</option>
        <option value="פעיל">פעיל</option>
        <option value="הסתיים">הסתיים</option>
        <option value="מתעכב">מתעכב</option>
      </select>
      <input
        type="text"
        placeholder="חיפוש לפי משרד"
        className="border rounded p-2"
        value={filters.ministry || ""}
        onChange={(e) => setFilters({ ...filters, ministry: e.target.value })}
      />
    </div>
  );
};
