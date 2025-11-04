import React from 'react';
import { Project, Skill, TimelineItem } from '../types';
import { CodeIcon, CloudIcon, CpuChipIcon, CommandLineIcon, BriefcaseIcon, AcademicCapIcon, UsersIcon } from '../components/icons/Icons';

export const personalInfo = {
  name: "Jainish Patel",
  title: "Machine Learning Engineer",
  location: "Mount Juliet, TN",
  email: "jainish.h.patel@vanderbilt.edu",
  phone: "+1 (615) 968-1912",
  linkedin: "https://linkedin.com/in/jainishpatel",
  github: "https://github.com/jainish1510",
  cvUrl: "#" // Placeholder for CV download link
}

export const professionalSummary = "Machine Learning Engineer with hands-on experience in developing data pipelines, training transformer-based NLP models, and deploying AI applications in healthcare and research. Skilled in Python, PyTorch, TensorFlow, and cloud-based ML solutions. Proven record improving model performance by 20-30% and automating complex workflows for scalable, real-world impact.";

// FIX: Replaced JSX syntax with React.createElement and null values as JSX is not supported in .ts files.
// Also updated type from JSX.Element to React.ReactNode.
export const skillsData: { category: string; skills: Skill[]; icon: React.ReactNode }[] = [
  {
    category: 'Languages',
    icon: React.createElement(CommandLineIcon, { className: "w-8 h-8" }),
    skills: [
      { name: 'Python', icon: null },
      { name: 'C++', icon: null },
      { name: 'JavaScript/TypeScript', icon: null },
      { name: 'SQL', icon: null },
      { name: 'R', icon: null },
    ],
  },
  {
    category: 'ML/AI',
    icon: React.createElement(CpuChipIcon, { className: "w-8 h-8" }),
    skills: [
      { name: 'PyTorch', icon: null },
      { name: 'TensorFlow', icon: null },
      { name: 'scikit-learn', icon: null },
      { name: 'Hugging Face', icon: null },
      { name: 'LangChain', icon: null },
      { name: 'LlamaIndex', icon: null },
    ],
  },
  {
    category: 'Data & Cloud',
    icon: React.createElement(CloudIcon, { className: "w-8 h-8" }),
    skills: [
      { name: 'AWS', icon: null },
      { name: 'Docker', icon: null },
      { name: 'Tableau', icon: null },
      { name: 'Power BI', icon: null },
      { name: 'Git', icon: null },
    ],
  },
  {
    category: 'Web Development',
    icon: React.createElement(CodeIcon, { className: "w-8 h-8" }),
    skills: [
      { name: 'Next.js', icon: null },
      { name: 'FastAPI', icon: null },
      { name: 'Node.js', icon: null },
      { name: 'MongoDB', icon: null },
      { name: 'PostgreSQL', icon: null },
    ],
  },
];

export const experienceData: TimelineItem[] = [
  {
    date: 'Summer 2025',
    title: 'Research Intern',
    subtitle: 'Vanderbilt Institute for Surgery and Engineering (VISE)',
    description: [
      'Built automated MRI analysis pipelines for 5K+ scans to evaluate cross-site variability in brain volume.',
      'Integrated environmental data (air quality, weather) with MRI datasets using Python and scikit-learn.',
      'Enhanced reproducibility of multicenter studies by 22% via data harmonization and statistical modeling.',
    ],
  },
  {
    date: 'Jan - May 2025',
    title: 'AI R&D Engineer',
    subtitle: 'Bill Summary API Project, MTSU',
    description: [
      'Fine-tuned T5-small transformer models for legislative summarization, improving ROUGE scores by 21%.',
      'Processed 2M+ tokens across datasets; deployed real-time API with <1.5s latency.',
    ],
  },
  {
    date: 'Jun - Jul 2024',
    title: 'Artificial Intelligence Intern',
    subtitle: 'MindWise Health',
    description: [
      'Developed a RAG chatbot with MongoDB vector search and LangChain, increasing response accuracy by 18%.',
      'Proposed EHR-driven AI analytics pipeline for predictive healthcare management adopted for pilot testing.',
    ],
  },
];

export const leadershipData: TimelineItem[] = [
  {
    date: '2023 - 2025',
    title: 'Vice President',
    subtitle: 'ACM MTSU',
    description: [
      'Directed 10+ workshops and MTSU\'s first coding competition (30+ participants).',
      'Mentored peers in ML modeling, cloud deployment, and software engineering.'
    ],
  },
];

export const educationData: TimelineItem[] = [
    {
      date: 'Expected Dec 2026',
      title: 'M.S. Computer Science',
      subtitle: 'Vanderbilt University, Nashville, TN',
      description: [],
    },
    {
      date: 'Aug 2025',
      title: 'B.S. Computer Science',
      subtitle: 'Middle Tennessee State University, Murfreesboro, TN',
      description: [
        'Dean\'s List',
        'Merit Scholarship Recipient'
      ],
    },
];

export const projectsData: Project[] = [
  {
    title: "Weather & Air Pollution Data Collector",
    description: "Created and published a PyPI package automating environmental data retrieval for 1K+ cities, reducing redundant API calls by 70%.",
    tags: ["PyPI", "Python", "Automation"],
    image: 'https://picsum.photos/seed/pypi/600/400',
    githubUrl: '#',
  },
  {
    title: "AI Elder Care System",
    description: "Led a 4-member team building an AI Elder Care system using Next.js, FastAPI, GPT, and Twilio, achieving 95% task automation rate.",
    tags: ["Next.js", "FastAPI", "GPT", "Twilio", "AI"],
    image: 'https://picsum.photos/seed/eldercare/600/400',
    githubUrl: '#',
    award: "HackMT '25 - Hacker's Choice Award",
  },
  {
    title: "BlueAid",
    description: "Designed BlueAid, an LLM-based medical bill analysis tool deployed on AWS, identifying 80% of overbilling cases.",
    tags: ["LLM", "AWS", "Healthcare"],
    image: 'https://picsum.photos/seed/blueaid/600/400',
    githubUrl: '#',
    award: "HackMT '24 - Winner",
  },
   {
    title: "Quantum Encrypted Voting System",
    description: "Implemented quantum-secured voting using Amazon Braket SDK with 100% encryption integrity in simulation.",
    tags: ["Quantum Computing", "Amazon Braket", "Security"],
    image: 'https://picsum.photos/seed/quantum/600/400',
    githubUrl: '#',
  },
];


export const getCVContext = (): string => {
  const skillsText = skillsData.map(category => 
    `${category.category}: ${category.skills.map(s => s.name).join(', ')}`
  ).join('\n');

  const experienceText = experienceData.map(item => 
    `Title: ${item.title} at ${item.subtitle} (${item.date})\n- ${item.description.join('\n- ')}`
  ).join('\n\n');
  
  const leadershipText = leadershipData.map(item =>
    `Role: ${item.title} at ${item.subtitle} (${item.date})\n- ${item.description.join('\n- ')}`
  ).join('\n\n');

  const educationText = educationData.map(item =>
    `Degree: ${item.title}, ${item.subtitle} (${item.date})\n${item.description.length > 0 ? '- ' + item.description.join('\n- ') : ''}`
  ).join('\n\n');

  const projectsText = projectsData.map(project => 
    `Project: ${project.title} ${project.award ? `(${project.award})` : ''}\nDescription: ${project.description}\nTechnologies: ${project.tags.join(', ')}`
  ).join('\n\n');

  return `
You are an AI assistant for Jainish Patel, a Machine Learning Engineer. Your role is to answer questions about his skills, experience, and projects based ONLY on the following information. Be friendly, professional, and concise. Do not answer questions outside of this scope.

---
**JAINISH PATEL'S CV**
---
Name: ${personalInfo.name}
Title: ${personalInfo.title}
Summary: ${professionalSummary}
---

**SKILLS**
${skillsText}

---

**PROFESSIONAL EXPERIENCE**
${experienceText}

---

**LEADERSHIP**
${leadershipText}

---

**EDUCATION**
${educationText}

---

**PROJECTS**
${projectsText}

---
  `;
};