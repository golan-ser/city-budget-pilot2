import React, { useEffect, useState } from 'react';
import ProjectCard from './ProjectCard';

interface Project {
  id: number;
  name: string;
  tabar_number: string;
  status: string;
  department: string;
  year: number;
  total_budget: number;
  used_budget: number;
  utilization_percent: number;
  description: string;
  last_report_days?: number;
}

const ProjectsGrid: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`/api/projects`, {
          headers: {
            'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
          }
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        // מציג רק 3 פרויקטים ראשונים בדשבורד
        setProjects(data.slice(0, 3));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('שגיאה בטעינת הפרויקטים');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">אין פרויקטים להצגה</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id}
          project={project}
          compact={true}
        />
      ))}
    </div>
  );
};

export default ProjectsGrid; 