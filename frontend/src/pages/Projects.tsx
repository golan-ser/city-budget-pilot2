import React, { useEffect, useState } from 'react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/projects`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching projects:', err);
        setError('שגיאה בטעינת הנתונים');
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">רשימת פרויקטים</h1>
      {loading ? (
        <p>טוען נתונים...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">שם הפרויקט</th>
                <th className="border p-2">תיאור</th>
                <th className="border p-2">סוג</th>
                <th className="border p-2">מחלקה</th>
                <th className="border p-2">תאריך התחלה</th>
                <th className="border p-2">תאריך סיום</th>
                <th className="border p-2">תקציב</th>
                <th className="border p-2">סטטוס</th>
                <th className="border p-2">תאריך יצירה</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="border p-2 text-center">{project.id}</td>
                  <td className="border p-2">{project.name}</td>
                  <td className="border p-2">{project.description || '-'}</td>
                  <td className="border p-2">{project.type}</td>
                  <td className="border p-2">{project.department_id}</td>
                  <td className="border p-2">{project.start_date?.split('T')[0]}</td>
                  <td className="border p-2">{project.end_date?.split('T')[0]}</td>
                  <td className="border p-2 text-right">
                    ₪{parseInt(project.budget_amount).toLocaleString()}
                  </td>
                  <td className="border p-2">{project.status}</td>
                  <td className="border p-2">{project.created_at?.split('T')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Projects;
