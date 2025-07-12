// /lib/accessHierarchy.ts
export interface AccessEntry {
  key: string;
  label: string;
  href?: string;
  children: AccessEntry[];
}

export const accessHierarchy: AccessEntry[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', children: [] },
  { key: 'todo', label: 'To-Do List', href: '/todo', children: [] },
  {
    key: 'online-relation',
    label: 'Online Relation',
    href: '/online-relation',
    children: [
      { key: 'online-relation/tasks', label: 'Opgaver', href: '/online-relation/tasks', children: [] },
    ],
  },
  { key: 'tasks-couple', label: 'Opgaver', href: '/tasks-couple', children: [] },
  {
    key: 'intim',
    label: 'Intimitet',
    href: '/intimitet',
    children: [
      { key: 'fantasy/fantasier', label: 'Fantasier', href: '/fantasy', children: [] },
      { key: '/sex/positions', label: 'Inspiration', href: '/sex/positions', children: [] },
    ],
  },
 {
  key: 'fantasy',
  label: 'Parforhold',
  href: '/fantasy',
  children: [
    { key: 'fantasy/parquiz', label: 'Parquiz', href: '/quiz/parquiz', children: [] },
    { key: 'fantasy/anbefalinger', label: 'Anbefalinger', href: '/fantasy/anbefalinger', children: [] },
    { key: 'fantasy/udfordringskort', label: 'Sandhedens time', href: '/fantasy/udfordringskort', children: [] }, // <-- NYT
    { key: 'dates', label: 'Date Ideas', href: '/dates', children: [] },
  ],
},

  {
    key: 'indtjekning',
    label: 'Indtjekning',
    href: '/indtjekning',
    children: [
      { key: 'indtjekning/sex', label: 'Sex', href: '/indtjekning/sex', children: [] },
      { key: 'indtjekning/kompliment', label: 'Kompliment', href: '/indtjekning/kompliment', children: [] },
      { key: 'indtjekning/hverdag', label: 'Hverdag', href: '/indtjekning/hverdag', children: [] },
    ],
  },
  { key: 'bucketlist-couple', label: 'Bucketlist', href: '/bucketlist-couple', children: [] },
  {
    key: 'checkin',
    label: 'Check-in',
    href: '/checkin',
    children: [
      { key: 'checkin/oversigt', label: 'Oversigt', href: '/checkin/oversigt', children: [] },
      { key: 'checkin/mine-behov', label: 'Mine behov', href: '/checkin/mine-behov', children: [] },
      { key: 'checkin/historik', label: 'Historik', href: '/checkin/historik', children: [] },
      { key: 'checkin/evaluering', label: 'Evaluering', href: '/checkin/evaluering', children: [] },
    ],
  },
  { key: 'kalender', label: 'Kalender', href: '/kalender', children: [] },
  {
    key: 'spil',
    label: 'Spil',
    href: '/spil/sellerk',
    children: [
      { key: 'spil/sellerk', label: 'S eller K', href: '/spil/sellerk', children: [] },
      { key: 'spil/memorygaver', label: 'Memory', href: '/spil/memorygaver', children: [] },
      { key: 'spil/quiz', label: 'Quiz', href: '/spil/quizzen', children: [] },
      { key: '/spil/knob', label: 'Min knap', href: '/spil/knob', children: [] },
    ],
  },
  {
    key: 'kommunikation',
    label: 'Kommunikation',
    href: '/kommunikation/kompliment',
    children: [
      { key: 'kommunikation/spoergsmaal', label: 'Spørgsmål', href: '/kommunikation/spoergsmaal', children: [] },
      { key: 'kommunikation/random', label: 'Random', href: '/kommunikation/random', children: [] },
    ],
  },
  {
    key: 'personlighed',
    label: 'Personlighed',
    href: '/personlighed',
    children: [
      { key: 'personlighed/manifestation', label: 'Manifestation', href: '/personlighed/manifestation', children: [] },
      { key: 'personlighed/career', label: 'Karriere', href: '/personlighed/career', children: [] },
      { key: 'personlighed/tanker', label: 'Tanker', href: '/personlighed/tanker', children: [] },
    ],
  },
  {
    key: 'data',
    label: 'Data',
    href: '/data',
    children: [
      { key: 'data/sex', label: 'Sex', href: '/data/sex', children: [] },
      { key: 'data/hverdag', label: 'Hverdag', href: '/data/hverdag', children: [] },
      { key: 'data/tanker', label: 'Tanker', href: '/data/tanker', children: [] },
    ],
  },
  { key: 'profile', label: 'Profil', href: '/profile', children: [] },
  {
    key: 'settings',
    label: 'Indstillinger',
    href: '/settings',
    children: [
      { key: 'settings/widgets/layout', label: 'Layout', href: '/settings/widgets/layout', children: [] },
      { key: 'settings/widgets', label: 'Widgets', href: '/settings/widgets', children: [] },
      { key: 'settings/recommendation', label: 'Anbefaling', href: '/settings/recommendation', children: [] },
      { key: 'settings/points', label: 'Points', href: '/settings/points', children: [] },
      { key: 'settings/rewards', label: 'Rewards', href: '/settings/rewards', children: [] },
      { key: 'settings/categories', label: 'Categories', href: '/settings/categories', children: [] },
      { key: 'settings/game-themes', label: 'Temaer', href: '/settings/game-themes', children: [] },
      { key: 'settings/access', label: 'Profiladgange', href: '/settings/access', children: [] },
      { key: 'settings/quiz-admin', label: 'Quiz admin', href: '/settings/quiz-admin', children: [] },
      { key: 'settings/couple-background', label: 'Baggrund', href: '/settings/couple-background', children: [] },
      { key: 'settings/tables', label: 'Tables', href: '/settings/tables', children: [] },
      { key: 'settings/notifications', label: 'Notifikationer', href: '/settings/notifications', children: [] },
      { key: '/settings/error-log', label: 'Error-log', href: '/settings/error-log', children: [] },
      { key: '/settings/idebank', label: 'Idebank', href: '/settings/idebank', children: [] },

      
      
      { key: 'settings/activity', label: 'Activity', href: '/settings/activity', children: [] },
      {
        key: 'settings/gpt',
        label: 'Gpt',
        href: '/settings/gpt/api',
        children: [
          { key: 'settings/gpt/api', label: 'API kald', href: '/settings/gpt/api', children: [] },
        ],
      },
    ],
  },
];
