import React, { useState, useEffect } from 'react';
import { personalInfo } from '../data/cvData';
import { GithubIcon, LinkedinIcon } from './icons/Icons';

const navLinks = [
  { name: 'About', href: '#about' },
  { name: 'Skills', href: '#skills' },
  { name: 'Experience', href: '#experience' },
  { name: 'Projects', href: '#projects' },
  { name: 'Contact', href: '#contact' },
];

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-950/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'}`}>
      <nav className="container mx-auto flex items-center justify-between p-4 px-6 md:px-12">
        <a href="#" className="text-xl font-bold gradient-text">Jainish Patel</a>
        <ul className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-gray-300 hover:text-sky-400 transition-colors">{link.name}</a>
            </li>
          ))}
        </ul>
        <div className="flex items-center space-x-4">
          <a href={personalInfo.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-gray-400 hover:text-white transition-colors">
            <GithubIcon className="w-6 h-6" />
          </a>
          <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-white transition-colors">
            <LinkedinIcon className="w-6 h-6" />
          </a>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
