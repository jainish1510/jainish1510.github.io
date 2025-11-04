import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import Leadership from './components/Leadership';
import Education from './components/Education';

const App: React.FC = () => {
  return (
    <div className="bg-gray-950 text-gray-200">
      <Navbar />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-950 to-black opacity-20 z-0"></div>
      <main className="container mx-auto px-6 md:px-12 relative z-10">
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Leadership />
        <Education />
        <Contact />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

export default App;
