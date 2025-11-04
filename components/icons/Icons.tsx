import React from 'react';

// Generic UI
export const CodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

export const CloudIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.09A5.002 5.002 0 003 15z" />
    </svg>
);

export const CpuChipIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5m0 16.5v-1.5m3.75-12h1.5m-18 0h1.5m15 0h1.5m-18 0h1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.375h-9a1.875 1.875 0 0 1-1.875-1.875v-9A1.875 1.875 0 0 1 7.5 5.625h9A1.875 1.875 0 0 1 18.375 7.5v9A1.875 1.875 0 0 1 16.5 18.375Z" />
  </svg>
);

export const CommandLineIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5 3 12m0 0 3.75 4.5M3 12h18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);


// Section Icons
export const BriefcaseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.075c0 1.313-.964 2.508-2.325 2.775-1.36.266-2.675-.202-3.4-.837a2.33 2.33 0 0 1-3.05 0c-.725.635-2.04.11-3.4.837-1.36.267-2.325-1.462-2.325-2.775V14.15M3 9.375c0-1.036.84-1.875 1.875-1.875h14.25c1.035 0 1.875.84 1.875 1.875v1.5c0 1.036-.84 1.875-1.875 1.875H4.875A1.875 1.875 0 0 1 3 10.875v-1.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.375 2.25c.392 0 .769.155 1.04.434l2.12 2.12c.272.271.435.648.435 1.04V9.375H8.25V5.848c0-.392.163-.769.434-1.04l2.12-2.12A1.47 1.47 0 0 1 12 2.25h-2.625Z" />
  </svg>
);

export const AcademicCapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path d="M12 14.25a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0v-5.25a.75.75 0 0 1 .75-.75Z" />
    <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06L12 15.44l3.97-3.97a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M3 10.5a1.5 1.5 0 0 1 1.5-1.5h15a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3.375a.75.75 0 0 0-.53 1.28l1.72 1.72a.75.75 0 0 1-1.06 1.06l-1.72-1.72a.75.75 0 0 0-1.06 0l-1.72 1.72a.75.75 0 1 1-1.06-1.06l1.72-1.72a.75.75 0 0 0-.53-1.28H4.5A1.5 1.5 0 0 1 3 13.5v-3Z" clipRule="evenodd" />
  </svg>
);

export const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962c.513-.303 1.09-.517 1.71-.635m12.42.385-6.836-6.836a2.25 2.25 0 0 1 0-3.182l6.836-6.836a2.25 2.25 0 0 1 3.182 0l-6.836 6.836a2.25 2.25 0 0 1 0 3.182l6.836 6.836Zm-11.25-11.25a2.25 2.25 0 0 1 3.182 0l6.836 6.836a2.25 2.25 0 0 1 0 3.182l-6.836 6.836a2.25 2.25 0 0 1-3.182 0l-6.836-6.836a2.25 2.25 0 0 1 0-3.182l6.836-6.836a2.25 2.25 0 0 1 3.182 0Z" />
    </svg>
);

// Social Icons
export const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.165 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.82c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
    </svg>
);

export const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5V8h3v11zM6.5 6.73c-.966 0-1.75-.783-1.75-1.75S5.534 3.23 6.5 3.23s1.75.784 1.75 1.75S7.466 6.73 6.5 6.73zM19 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.322c1.401-2.586 7-2.777 7 2.476V19z" />
    </svg>
);

export const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
);


// Chatbot Icons
export const ChatBubbleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 0 1-2.53-.388m-5.383-.948a.75.75 0 0 1 .18-1.06l12.728-9.33a.75.75 0 0 1 1.06.18Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75c-4.97 0-9-3.694-9-8.25s4.03-8.25 9-8.25 9 3.694 9 8.25c0 1.503-.432 2.912-1.18 4.125a9.76 9.76 0 0 1-2.53.388m-5.383-.948a.75.75 0 0 1-.18-1.06l-1.83-2.44a.75.75 0 0 1 .18-1.06l6.63-4.86a.75.75 0 0 1 1.06.18l3.03 4.04a.75.75 0 0 1-.18 1.06l-6.095 4.49Z" />
  </svg>
);

export const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
);
