import React from 'react';
import { projectsData } from '../data/cvData';
import { GithubIcon } from './icons/Icons';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-3xl font-bold text-center mb-12 gradient-text">{children}</h2>
);

const Projects: React.FC = () => {
  return (
    <section id="projects" className="py-24">
      <SectionTitle>Projects</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {projectsData.map((project) => (
          <div key={project.title} className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800 group transition-all duration-300 hover:border-sky-500 hover:shadow-sky-500/10 hover:-translate-y-2">
            <img src={project.image} alt={project.title} className="w-full h-48 object-cover" />
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold mb-2 text-gray-100">{project.title}</h3>
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-400 transition-colors">
                    <GithubIcon className="w-6 h-6" />
                  </a>
                )}
              </div>
              {project.award && (
                <p className="text-sm font-semibold text-amber-400 mb-2">🏆 {project.award}</p>
              )}
              <p className="text-gray-400 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="bg-gray-800 text-sky-300 text-xs font-semibold px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projects;
