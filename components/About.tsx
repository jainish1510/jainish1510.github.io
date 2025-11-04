import React from 'react';
import { professionalSummary } from '../data/cvData';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-3xl font-bold text-center mb-12 gradient-text">{children}</h2>
);

const About: React.FC = () => {
  return (
    <section id="about" className="py-24">
      <SectionTitle>About Me</SectionTitle>
      <div className="max-w-3xl mx-auto bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-800">
        <p className="text-lg text-gray-300 leading-relaxed text-center">
            {professionalSummary}
        </p>
      </div>
    </section>
  );
};

export default About;
