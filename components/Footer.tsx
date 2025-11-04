import React from 'react';
import { personalInfo } from '../data/cvData';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-800">
        <div className="container mx-auto py-6 text-center text-gray-500 px-6 md:px-12">
            <p>&copy; {currentYear} {personalInfo.name}. All rights reserved.</p>
        </div>
    </footer>
  );
};

export default Footer;
