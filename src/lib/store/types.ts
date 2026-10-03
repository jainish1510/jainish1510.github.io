/**
 * Shapes produced by the content loader. They deliberately mirror what the
 * pages and components consume, so a page never needs to know whether content
 * came from files, a database or an API.
 */
export type Media = { path: string; alt: string };
export type GalleryImage = { path: string; alt: string; caption: string | null };
export type NamedRef = { name: string; slug: string };

export type SiteConfig = {
  name: string;
  url: string;
  discipline: string;
  roles: string;
  description: string;
  heroIntro: string;
  location: string;
  timezone: string;
  email: string;
  contactBlurb: string;
  availability: string;
  resumeUrl: string;
  blogHeroEyebrow: string;
  blogHeroLine: string;
  footerMotto: string[];
  nav: { label: string; href: string }[];
  homeSections: { now: boolean; projects: boolean; research: boolean; writing: boolean; about: boolean; interests: boolean };
  portrait: { src: string; alt: string; isPlaceholder: boolean } | null;
  aboutIntro: string;
  aboutStory: string;
  comments: { enabled: boolean; repo: string; repoId: string; category: string; categoryId: string };
};

export type Category = { id: string; slug: string; name: string; description: string | null };

export type PostCard = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  readingTime: number;
  publishedAt: Date | null;
  featured: boolean;
  isDemo: boolean;
  category: { name: string; slug: string } | null;
  tags: NamedRef[];
  cover: Media | null;
};

export type Post = PostCard & {
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  content: string;
  areas: NamedRef[];
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
  author: { name: string };
};

export type SkillRef = { id: string; name: string; slug: string };

export type ProjectCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  githubUrl: string | null;
  demoUrl: string | null;
  featured: boolean;
  isPlaceholder: boolean;
  recognition: string | null;
  cover: Media | null;
  skills: SkillRef[];
  areas: NamedRef[];
};

export type Project = ProjectCard & {
  videoUrl: string | null;
  problem: string | null;
  motivation: string | null;
  architecture: string | null;
  howItWorks: string | null;
  challenges: string | null;
  results: string | null;
  lessons: string | null;
  gallery: GalleryImage[];
  research: { slug: string; title: string; status: string }[];
};

export type ResearchEntry = {
  id: string;
  slug: string;
  title: string;
  abstract: string;
  question: string | null;
  methodology: string | null;
  datasets: string | null;
  experiments: string | null;
  results: string | null;
  publication: string | null;
  codeUrl: string | null;
  collaborators: string | null;
  institution: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  featured: boolean;
  isPlaceholder: boolean;
  areas: NamedRef[];
  skills: SkillRef[];
  projects: { slug: string; title: string }[];
};

export type Area = { id: string; slug: string; name: string; description: string | null; parentId: string | null };

export type Skill = {
  id: string;
  slug: string;
  name: string;
  category: string;
  /** One use per line. */
  usedFor: string | null;
  proficiency: number;
  favorite: boolean;
  areaSlugs: string[];
  projects: { title: string; slug: string }[];
  research: { title: string; slug: string }[];
  _count: { projects: number; research: number; experiences: number };
};

export type Experience = {
  id: string;
  role: string;
  organization: string;
  location: string | null;
  type: string;
  startDate: Date;
  endDate: Date | null;
  current: boolean;
  period: string | null;
  summary: string | null;
  /** One highlight per line. */
  highlights: string | null;
  url: string | null;
  skills: SkillRef[];
};

export type Education = { id: string; institution: string; degree: string; field: string; location: string | null; endDate: Date | null; expected: boolean; notes: string | null };
export type Award = { id: string; title: string; issuer: string; date: Date | null; description: string | null; url: string | null };
export type NowItem = { id: string; label: string; value: string; detail: string | null; icon: string };
export type TimelineEvent = { id: string; year: number; title: string; description: string | null; kind: string; link: string | null };
export type LearningItem = { id: string; topic: string; note: string | null; progress: number };
export type Fact = { id: string; text: string };
export type Book = { id: string; title: string; author: string; note: string | null; status: string; url: string | null };
export type Interest = { id: string; name: string; description: string | null };
export type Goal = { id: string; text: string; horizon: string };
export type SocialLink = { id: string; platform: string; label: string; url: string; handle: string | null; visible: boolean };

export type Widgets = {
  spotify: { enabled: boolean; title: string; artist: string; album: string; url: string | null } | null;
  github: { enabled: boolean; username: string };
  clock: { enabled: boolean };
  randomFact: { enabled: boolean };
};

export type Content = {
  site: SiteConfig;
  categories: Category[];
  areas: Area[];
  posts: Post[];
  projects: Project[];
  research: ResearchEntry[];
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  awards: Award[];
  now: NowItem[];
  timeline: TimelineEvent[];
  learning: LearningItem[];
  facts: Fact[];
  books: Book[];
  interests: Interest[];
  goals: Goal[];
  social: SocialLink[];
  widgets: Widgets;
  builtAt: Date;
};
