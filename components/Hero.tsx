import React from 'react';
import { personalInfo, professionalSummary } from '../data/cvData';
import { GithubIcon, LinkedinIcon, MailIcon } from './icons/Icons';

const Hero: React.FC = () => {
  return (
    <section id="home" className="min-h-screen flex flex-col justify-center py-20">
      <div className="max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
          Hi, I'm <span className="gradient-text">Jainish Patel</span>
        </h1>
        <h2 className="text-2xl md:text-4xl font-semibold text-gray-300 mb-6">{personalInfo.title}</h2>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl">{professionalSummary}</p>
        <div className="flex items-center space-x-6 mb-8">
            <a href={personalInfo.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-400 hover:text-sky-400 transition-transform duration-300 hover:scale-110">
                <GithubIcon className="w-8 h-8" />
            </a>
            <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-sky-400 transition-transform duration-300 hover:scale-110">
                <LinkedinIcon className="w-8 h-8" />
            </a>
             <a href={`mailto:${personalInfo.email}`} aria-label="Email" className="text-gray-400 hover:text-sky-400 transition-transform duration-300 hover:scale-110">
                <MailIcon className="w-8 h-8" />
            </a>
        </div>
        <div>
          <a href={personalInfo.cvUrl} className="bg-sky-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-sky-600 transition-all duration-300 shadow-lg shadow-sky-500/20">
            Download CV
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
