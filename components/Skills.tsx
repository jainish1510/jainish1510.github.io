import React from 'react';
import { skillsData } from '../data/cvData';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-3xl font-bold text-center mb-12 gradient-text">{children}</h2>
);

const Skills: React.FC = () => {
  return (
    <section id="skills" className="py-24">
      <SectionTitle>Technical Skills</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {skillsData.map((category) => (
          <div key={category.category} className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 transition-all duration-300 hover:border-sky-500 hover:shadow-sky-500/10">
            <div className="flex items-center mb-4 text-sky-400">
                {React.cloneElement(category.icon, { className: 'w-8 h-8 mr-4' })}
                <h3 className="text-xl font-bold text-gray-100">{category.category}</h3>
            </div>
            <ul className="space-y-2">
              {category.skills.map((skill) => (
                <li key={skill.name} className="text-gray-400 flex items-center">
                  <span className="text-sky-400 mr-2">◆</span>
                  {skill.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Skills;
