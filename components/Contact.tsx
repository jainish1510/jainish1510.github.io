import React from 'react';
import { personalInfo } from '../data/cvData';
import { GithubIcon, LinkedinIcon, MailIcon } from './icons/Icons';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-3xl font-bold text-center mb-4 gradient-text">{children}</h2>
);

const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-24 text-center">
      <SectionTitle>Get In Touch</SectionTitle>
      <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-8">
        I'm always open to discussing new projects, creative ideas, or opportunities to be part of an ambitious vision. Feel free to reach out.
      </p>
      <a href={`mailto:${personalInfo.email}`} className="inline-block bg-sky-500 text-white font-bold text-lg py-3 px-8 rounded-lg hover:bg-sky-600 transition-all duration-300 shadow-lg shadow-sky-500/20 mb-12">
        Say Hello
      </a>
      <div className="flex justify-center items-center space-x-8">
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
    </section>
  );
};

export default Contact;
