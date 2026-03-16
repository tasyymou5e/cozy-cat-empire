// Registry of all documentation files with metadata for the admin docs viewer
// Organized in Doctave-style categories

export interface DocEntry {
  id: string;
  title: string;
  category: string;
  description: string;
  fileName: string;
}

export interface DocCategory {
  id: string;
  label: string;
  emoji: string;
  docs: DocEntry[];
}

export const DOC_CATEGORIES: DocCategory[] = [
  {
    id: 'overview',
    label: 'Overview',
    emoji: '📖',
    docs: [
      { id: 'readme', title: 'Documentation Index', category: 'overview', description: 'Main documentation index and file listing', fileName: 'README.md' },
      { id: 'tech-stack', title: 'Tech Stack', category: 'overview', description: 'Technology stack, dependencies, file structure', fileName: 'TECH_STACK.md' },
      { id: 'architecture-diagrams', title: 'Architecture Diagrams', category: 'overview', description: 'Visual architecture diagrams', fileName: 'ARCHITECTURE_DIAGRAMS.md' },
      { id: 'architecture-audit', title: 'Architecture Audit', category: 'overview', description: 'Architecture audit findings and resolutions', fileName: 'ARCHITECTURE_AUDIT.md' },
    ],
  },
  {
    id: 'game-mechanics',
    label: 'Game Mechanics',
    emoji: '🎮',
    docs: [
      { id: 'game-logic', title: 'Game Logic', category: 'game-mechanics', description: 'Core game mechanics, breeding, training, relationships', fileName: 'GAME_LOGIC.md' },
      { id: 'breeding', title: 'Breeding Compatibility', category: 'game-mechanics', description: 'Breeding panel compatibility indicators', fileName: 'BREEDING_COMPATIBILITY.md' },
      { id: 'cat-relationships', title: 'Cat Relationships', category: 'game-mechanics', description: 'Dedicated relationships page implementation', fileName: 'CAT_RELATIONSHIPS_PAGE.md' },
      { id: 'gamification', title: 'Gamification Plan', category: 'game-mechanics', description: '8 gamification systems plan', fileName: 'GAMIFICATION_IMPROVEMENTS_PLAN.md' },
      { id: 'codebase-improvement', title: 'Codebase Improvement Plan', category: 'game-mechanics', description: 'Overall codebase improvement plan', fileName: 'codebaseimprovementplan.md' },
    ],
  },
  {
    id: 'ui-components',
    label: 'UI & Components',
    emoji: '🧩',
    docs: [
      { id: 'components', title: 'Components', category: 'ui-components', description: 'Component architecture (85+ game components)', fileName: 'COMPONENTS.md' },
      { id: 'pages-components', title: 'Pages & Components', category: 'ui-components', description: 'Page and component reference', fileName: 'PAGES_AND_COMPONENTS.md' },
      { id: 'navigation', title: 'Navigation Improvements', category: 'ui-components', description: '8-phase UI navigation improvement plan', fileName: 'NAVIGATION_IMPROVEMENTS.md' },
      { id: 'mobile-tablet', title: 'Mobile & Tablet UI', category: 'ui-components', description: 'Mobile & tablet responsive UI system', fileName: 'MOBILE_TABLET_UI.md' },
      { id: 'parallax', title: 'Parallax System', category: 'ui-components', description: 'Parallax scrolling system', fileName: 'PARALLAX_SYSTEM.md' },
      { id: 'graphics-settings', title: 'Graphics Settings', category: 'ui-components', description: 'Graphics settings panel (14 configurable options)', fileName: 'GRAPHICS_SETTINGS.md' },
    ],
  },
  {
    id: 'cat-visuals',
    label: 'Cat Visuals',
    emoji: '🐱',
    docs: [
      { id: 'cat-visual-system', title: 'Cat Visual System', category: 'cat-visuals', description: 'Unified cat visual architecture', fileName: 'CAT_VISUAL_SYSTEM.md' },
      { id: 'unified-cat-visuals', title: 'Unified Cat Visuals', category: 'cat-visuals', description: 'UnifiedCatCard component system', fileName: 'UNIFIED_CAT_VISUALS.md' },
      { id: 'cat-visuals-gallery', title: 'Cat Visuals & Gallery', category: 'cat-visuals', description: 'Cat display, portraits, photo booth, gallery', fileName: 'CAT_VISUALS_AND_GALLERY.md' },
      { id: 'empire-rendering', title: 'Empire AI Rendering', category: 'cat-visuals', description: 'Empire AI rendering system', fileName: 'EMPIRE_AI_RENDERING.md' },
      { id: 'empire-graphics-todo', title: 'Empire Graphics TODO', category: 'cat-visuals', description: 'Empire graphics improvement tasks', fileName: 'EMPIRE_GRAPHICS_TODO.md' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend & Database',
    emoji: '🗄️',
    docs: [
      { id: 'database', title: 'Database Design', category: 'backend', description: 'Database schema (30+ tables), JSONB structures', fileName: 'DATABASE_DESIGN.md' },
      { id: 'hooks-architecture', title: 'Hooks Architecture', category: 'backend', description: 'Hooks architecture, progress tracking, state management', fileName: 'HOOKS_ARCHITECTURE.md' },
      { id: 'panel-data', title: 'Panel Data Fetching', category: 'backend', description: 'Panel data fetching patterns (props vs hooks)', fileName: 'PANEL_DATA_FETCHING.md' },
      { id: 'cat-data-sync', title: 'Cat Data Sync', category: 'backend', description: 'Cat data synchronization system', fileName: 'CAT_DATA_SYNC.md' },
      { id: 'cron-jobs', title: 'Cron Jobs', category: 'backend', description: 'Scheduled cron job documentation', fileName: 'CRON_JOBS.md' },
      { id: 'performance', title: 'Performance Optimizations', category: 'backend', description: 'Performance optimization strategies', fileName: 'PERFORMANCE_OPTIMIZATIONS.md' },
    ],
  },
  {
    id: 'social',
    label: 'Social Features',
    emoji: '👥',
    docs: [
      { id: 'social-features', title: 'Social Features', category: 'social', description: 'Friends, trading, gifting, relationships', fileName: 'SOCIAL_FEATURES.md' },
    ],
  },
  {
    id: 'audio',
    label: 'Audio & Sound',
    emoji: '🔊',
    docs: [
      { id: 'sound-system', title: 'Sound System', category: 'audio', description: 'Audio system architecture', fileName: 'SOUND_SYSTEM.md' },
      { id: 'sound-library', title: 'Sound Library', category: 'audio', description: 'Sound library reference', fileName: 'SOUND_LIBRARY.md' },
      { id: 'game-event-sounds', title: 'Game Event Sounds', category: 'audio', description: 'Game event to sound mapping', fileName: 'GAME_EVENT_SOUNDS.md' },
      { id: 'executive-summary-sounds', title: 'Sound Executive Summary', category: 'audio', description: 'Executive summary of cat sounds', fileName: 'executivesummarycatsounds.md' },
    ],
  },
  {
    id: 'admin-security',
    label: 'Admin & Security',
    emoji: '🔒',
    docs: [
      { id: 'admin-dashboard', title: 'Admin Dashboard', category: 'admin-security', description: 'Admin panel features, 15+ admin pages', fileName: 'ADMIN_DASHBOARD.md' },
      { id: 'admin-user-management', title: 'Admin User Management', category: 'admin-security', description: 'Admin user management architecture and RLS', fileName: 'ADMIN_USER_MANAGEMENT.md' },
      { id: 'security', title: 'Security', category: 'admin-security', description: 'RLS policies, authentication, admin roles', fileName: 'SECURITY.md' },
      { id: 'error-logging', title: 'Error Logging', category: 'admin-security', description: 'Error tracking and logging system', fileName: 'ERROR_LOGGING.md' },
      { id: 'ai-portrait-credits', title: 'AI Portrait Credits', category: 'admin-security', description: 'AI portrait credit system', fileName: 'AI_PORTRAIT_CREDITS.md' },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    emoji: '📚',
    docs: [
      { id: 'jsdoc', title: 'JSDoc Reference', category: 'reference', description: 'Catalog of modules and hooks', fileName: 'JSDOC_REFERENCE.md' },
    ],
  },
];

export const ALL_DOCS = DOC_CATEGORIES.flatMap((cat) => cat.docs);

export function getDocById(id: string): DocEntry | undefined {
  return ALL_DOCS.find((d) => d.id === id);
}
