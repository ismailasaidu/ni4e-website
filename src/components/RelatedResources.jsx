import React, { useEffect, useState } from 'react';
import { ArrowDownToLine, ExternalLink, FileText, RefreshCw } from 'lucide-react';
import { supabase, supabaseConfigured } from '../firebase/config';

const asList = value => Array.isArray(value) ? value : (typeof value === 'string' && value.trim() ? value.split(',').map(x => x.trim()) : []);
const getUrl = item => item.metadata?.file_url || item.metadata?.resource_url || item.metadata?.url || '';
const normalizeType = value => {
  const raw = String(value || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  const aliases = { events: 'event', news_and_announcements: 'news', announcements: 'news', publications: 'publication', chapters: 'chapter', executives: 'executive', leadership: 'executive', past_presidents: 'past_president', technical_divisions: 'technical_division', projects: 'project', committees: 'committee', documents: 'document' };
  return aliases[raw] || raw;
};

/** Loads resources from published `site_content` rows of type `document`.
 * Admins manage these from Admin > Documents. No page-specific resource links are hardcoded here.
 * Document metadata: resource_for (array/string of page types), related_to_slug (optional), format, author, year, file_url/resource_url.
 */
export default function RelatedResources({ contentType, contentSlug = '', title = 'Related resources', compact = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = async () => {
    setLoading(true); setFailed(false);
    if (!supabaseConfigured || !supabase) { setRows([]); setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('site_content').select('id,title,slug,summary,body,metadata,created_at').eq('content_type', 'document').eq('published', true).order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      const matching = (data || []).filter(row => {
        const meta = row.metadata || {};
        const pageTypes = asList(meta.resource_for || meta.related_pages || meta.page_types).map(normalizeType);
        const relatedSlug = String(meta.related_to_slug || meta.related_slug || '').trim();
        const matchesPage = pageTypes.includes(normalizeType(contentType));
        const matchesRecord = Boolean(contentSlug && relatedSlug && relatedSlug === contentSlug);
        // A record-specific resource must not leak into every card on the same page.
        return relatedSlug ? matchesRecord : matchesPage;
      });
      setRows(matching);
    } catch (e) { console.error('NI4E related resources query failed:', e); setRows([]); setFailed(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [contentType, contentSlug]);
  if (loading) return <section className={`relatedResources ${compact ? 'compact' : ''}`} aria-label={title}><div className="relatedResourcesHead"><FileText size={18}/><h3>{title}</h3></div><p className="relatedResourcesStatus">Loading published resources…</p></section>;
  if (failed) return <section className={`relatedResources ${compact ? 'compact' : ''}`} aria-label={title}><div className="relatedResourcesHead"><FileText size={18}/><h3>{title}</h3></div><p className="relatedResourcesStatus">Resources could not be loaded right now. This may mean the related-resources database migration or public-read policy has not been applied yet.</p><button className="textbtn" onClick={load} disabled={loading}><RefreshCw size={15}/> Try again</button></section>;
  if (!rows.length) return null;
  return <section className={`relatedResources ${compact ? 'compact' : ''}`} aria-label={title}>
    <div className="relatedResourcesHead"><FileText size={18}/><div><h3>{title}</h3><p>Published files and links maintained by NI4E.</p></div></div>
    <div className="relatedResourcesGrid">{rows.map(item => { const url = getUrl(item); const meta = item.metadata || {}; return <article className="relatedResourceCard" key={item.id}>
      <span className="relatedResourceType">{meta.format || meta.resource_type || 'Resource'}</span><h4>{item.title}</h4>{item.summary && <p>{item.summary}</p>}<div className="relatedResourceMeta">{meta.author && <span>{meta.author}</span>}{meta.year && <span>{meta.year}</span>}</div>
      {url ? <a href={url} target="_blank" rel="noreferrer" className="relatedResourceLink"><ArrowDownToLine size={15}/> Open resource <ExternalLink size={14}/></a> : <span className="relatedResourceNoFile">Resource details available; file link not yet attached.</span>}
    </article>; })}</div>
  </section>;
}
