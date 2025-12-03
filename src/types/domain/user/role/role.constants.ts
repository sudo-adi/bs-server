// System modules for permission management
export const SYSTEM_MODULES = [
  'Dashboard',
  'Workers',
  'Employers',
  'Projects',
  'Training',
  'Verification',
  'Analytics',
  'Content Management',
  'AI Tools',
  'Notifications',
  'Roles',
  'Settings',
] as const;

export type SystemModule = (typeof SYSTEM_MODULES)[number];
