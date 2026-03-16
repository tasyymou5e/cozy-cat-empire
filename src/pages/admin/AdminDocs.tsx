import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DOC_CATEGORIES, ALL_DOCS, type DocEntry } from '@/data/docsRegistry';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, FileText, ChevronRight, ChevronDown, BookOpen, Menu, X, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const docModules = import.meta.glob('/docs/*.md', { query: '?raw', import: 'default' });

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`\[\]()]/g, '').trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      items.push({ id, text, level });
    }
  }
  return items;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

// Custom heading renderer that adds ids for anchor links
function HeadingRenderer({ level, children, ...props }: { level: number; children: React.ReactNode; [key: string]: unknown }) {
  const text = String(children).replace(/[*_`\[\]()]/g, '').trim();
  const id = slugify(text);
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag id={id} {...props}>{children}</Tag>;
}

export default function AdminDocs() {
  const [activeDocId, setActiveDocId] = useState<string>('readme');
  const [docContent, setDocContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(DOC_CATEGORIES.map((c) => c.id))
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tocOpen, setTocOpen] = useState(true);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  const activeDoc = useMemo(() => ALL_DOCS.find((d) => d.id === activeDocId), [activeDocId]);

  const toc = useMemo(() => extractToc(docContent), [docContent]);

  const loadDoc = useCallback(async (fileName: string) => {
    setLoading(true);
    try {
      const key = `/docs/${fileName}`;
      const loader = docModules[key];
      if (loader) {
        const content = (await loader()) as string;
        setDocContent(content);
      } else {
        setDocContent(`# Document Not Found\n\nCould not load \`${fileName}\`.`);
      }
    } catch {
      setDocContent('# Error\n\nFailed to load document.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeDoc) {
      loadDoc(activeDoc.fileName);
      setActiveHeading('');
    }
  }, [activeDoc, loadDoc]);

  // Observe headings for active TOC highlighting
  useEffect(() => {
    if (!contentRef.current || toc.length === 0) return;
    const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4');
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc, docContent, loading]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return DOC_CATEGORIES;
    const q = searchQuery.toLowerCase();
    return DOC_CATEGORIES.map((cat) => ({
      ...cat,
      docs: cat.docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.docs.length > 0);
  }, [searchQuery]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const selectDoc = (doc: DocEntry) => {
    setActiveDocId(doc.id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const scrollToHeading = (id: string) => {
    const el = contentRef.current?.querySelector(`#${CSS.escape(id)}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveHeading(id);
    }
  };

  const markdownComponents = useMemo(() => ({
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => <HeadingRenderer level={1} {...props} />,
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => <HeadingRenderer level={2} {...props} />,
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => <HeadingRenderer level={3} {...props} />,
    h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => <HeadingRenderer level={4} {...props} />,
  }), []);

  const minLevel = toc.length > 0 ? Math.min(...toc.map((t) => t.level)) : 1;

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Documentation</h1>
            <p className="text-xs text-muted-foreground">
              {ALL_DOCS.length} documents across {DOC_CATEGORIES.length} categories
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 min-h-0 mt-4 gap-4">
          {/* Left Sidebar - Doc tree */}
          <div
            className={cn(
              'w-64 shrink-0 flex flex-col border border-border rounded-lg bg-card transition-all',
              'md:relative md:translate-x-0',
              sidebarOpen
                ? 'absolute z-30 left-0 top-0 h-full md:static'
                : 'hidden md:flex'
            )}
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredCategories.map((cat) => {
                  const isExpanded = expandedCategories.has(cat.id);
                  return (
                    <div key={cat.id} className="mb-1">
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-semibold text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                          {cat.docs.length}
                        </Badge>
                      </button>
                      {isExpanded && (
                        <div className="ml-4 border-l border-border pl-2">
                          {cat.docs.map((doc) => (
                            <button
                              key={doc.id}
                              onClick={() => selectDoc(doc)}
                              className={cn(
                                'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors text-left',
                                activeDocId === doc.id
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              )}
                            >
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{doc.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No docs match your search.</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Document content */}
          <div className="flex-1 min-w-0 border border-border rounded-lg bg-card overflow-hidden flex flex-col">
            {/* Doc header */}
            {activeDoc && (
              <div className="px-6 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>
                      {DOC_CATEGORIES.find((c) => c.id === activeDoc.category)?.emoji}{' '}
                      {DOC_CATEGORIES.find((c) => c.id === activeDoc.category)?.label}
                    </span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-medium">{activeDoc.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{activeDoc.description}</p>
                </div>
                {toc.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTocOpen(!tocOpen)}
                    className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <List className="h-3.5 w-3.5" />
                    {tocOpen ? 'Hide TOC' : 'Show TOC'}
                  </Button>
                )}
              </div>
            )}

            {/* Content + TOC */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Markdown */}
              <ScrollArea className="flex-1">
                <div className="p-6" ref={contentRef}>
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <span className="text-4xl animate-bounce">📄</span>
                    </div>
                  ) : (
                    <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-table:border-collapse prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:bg-muted prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-a:text-primary prose-li:text-muted-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {docContent}
                      </ReactMarkdown>
                    </article>
                  )}
                </div>
              </ScrollArea>

              {/* Right sidebar - Table of Contents */}
              {tocOpen && toc.length > 0 && !loading && (
                <div className="hidden lg:flex w-56 shrink-0 flex-col border-l border-border">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <List className="h-3.5 w-3.5" />
                      On this page
                    </p>
                  </div>
                  <ScrollArea className="flex-1">
                    <nav className="p-2">
                      {toc.map((item, i) => (
                        <button
                          key={`${item.id}-${i}`}
                          onClick={() => scrollToHeading(item.id)}
                          className={cn(
                            'block w-full text-left px-2 py-1 text-xs rounded transition-colors truncate',
                            activeHeading === item.id
                              ? 'text-primary font-medium bg-primary/5'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                          )}
                          style={{ paddingLeft: `${(item.level - minLevel) * 12 + 8}px` }}
                          title={item.text}
                        >
                          {item.text}
                        </button>
                      ))}
                    </nav>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
