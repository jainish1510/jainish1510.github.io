import type { ReactNode } from 'react';

export interface Skill {
  name: string;
  // FIX: Use ReactNode instead of JSX.Element to resolve namespace issue and allow for null values.
  icon: ReactNode;
}

export interface TimelineItem {
  date: string;
  title: string;
  subtitle: string;
  description: string[];
}

export interface Project {
  title: string;
  description: string;
  tags: string[];
  image: string;
  liveUrl?: string;
  githubUrl?: string;
  award?: string;
}