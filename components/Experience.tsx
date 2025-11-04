import React from 'react';
import { experienceData } from '../data/cvData';
import { BriefcaseIcon } from './icons/Icons';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-3xl font-bold text-center mb-16 gradient-text">{children}</h2>
);

const Experience: React.FC = () => {
  return (
    <section id="experience" className="py-24">
      <SectionTitle>Professional Experience</SectionTitle>
      <div className="relative max-w-3xl mx-auto">
        <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-700"></div>
        {experienceData.map((item, index) => (
          <div key={index} className="relative mb-12">
            <div className={`flex items-center ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}>
              <div className="w-1/2 px-4">
                <div className={`text-sm font-semibold ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>{item.date}</div>
                <h3 className={`text-xl font-bold mt-1 ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>{item.title}</h3>
                <p className={`text-md text-sky-400 ${index % 2 === 0 ? 'text-left' : 'text-right'}`}>{item.subtitle}</p>
                <ul className="mt-4 space-y-2 text-gray-400 list-disc list-inside">
                  {item.description.map((desc, i) => <li key={i}>{desc}</li>)}
                </ul>
              </div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-1 w-8 h-8 bg-gray-950 border-2 border-sky-500 rounded-full flex items-center justify-center">
                <BriefcaseIcon className="w-4 h-4 text-sky-500" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Experience;
