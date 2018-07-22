declare module '*.svg';
declare module '*.png';
declare module '*.jpg';

declare module '*.json' {
  const value: any;
  export default value;
}

declare module 'drizzle';
declare module 'drizzle-react';
declare module 'drizzle-react-components';
