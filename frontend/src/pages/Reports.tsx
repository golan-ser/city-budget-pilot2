
import React, { useEffect, useState } from 'react';

const Reports = () => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/reports`)
      .then((res) => res.json())
      .then((data) => setReports(data))
      .catch((error) => console.error('Error fetching reports:', error));
  }, []);

  return (
    <div>
      <h1>Reports</h1>
      <ul>
        {reports.map((report) => (
          <li key={report.id}>{report.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default Reports;
