import React, { useState, useEffect } from 'react';
import { BookMarked, ArrowLeft, Feather, Plus, CheckCircle } from 'lucide-react';

interface EgwBookMeta {
  _id: string;
  title: string;
  code: string;
  author: string;
  category: string;
}

export default function EgwWritingsSection() {
  const [works, setWorks] = useState<EgwBookMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSeedForm, setShowSeedForm] = useState(false);

  // Active reading states
  const [readingDoc, setReadingDoc] = useState<{ title: string; text: string } | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);

  // Form input fields
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [fullContent, setFullContent] = useState('');

  const getBaseUrl = () => "https://adventconnect-7jfq.onrender.com";

  const fetchEgwCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/library/egw`);
      if (res.ok) {
        const data = await res.json();
        setWorks(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEgwCatalog(); }, []);

  const handleSeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${getBaseUrl()}/api/library/egw/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, code, fullContent })
      });
      if (res.ok) {
        setTitle(''); setCode(''); setFullContent('');
        setShowSeedForm(false);
        fetchEgwCatalog();
      }
    } catch (err) { console.error(err); }
  };

  const openBookReader = async (id: string) => {
    setReadingLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/library/egw/${id}/read`);
      if (res.ok) {
        const data = await res.json();
        setReadingDoc(data);
      }
    } catch (err) { console.error(err); }
    finally { setReadingLoading(false); }
  };

  const splitPages = (txt: string) => {
    if (!txt) return [];
    // Split on paragraphs or custom explicit line breaks to mimic pages
    return txt.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  };

  if (readingDoc) {
    const blocks = splitPages(readingDoc.text);
    return (
      <div className="flex flex-col h-full bg-[#faf6eb] rounded-xl shadow-md border border-[#e3dac9] overflow-hidden">
        <div className="px-6 py-3 bg-[#eedfaf] border-b border-[#ded2a4] flex items-center justify-between">
          <button onClick={() => setReadingDoc(null)} className="flex items-center gap-1 text-xs font-bold text-amber-950 hover:opacity-80 transition bg-white/40 px-3 py-1 rounded">
            <ArrowLeft size={14} /> Close Text
          </button>
          <span className="text-xs font-serif font-extrabold text-[#42341d] tracking-wide uppercase flex items-center gap-1">
            <Feather size={13} /> {readingDoc.title}
          </span>
          <span className="text-[10px] bg-amber-900 text-amber-100 font-bold px-2 py-0.5 rounded-full">Spirit of Prophecy</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f2ebd9] flex flex-col items-center">
          {blocks.map((para, i) => (
            <div key={i} className="w-full max-w-2xl bg-white shadow-xs border border-[#e0d5be] p-6 md:p-10 mb-5 rounded-sm font-serif text-[#1c160c]">
              <p className="text-base md:text-lg leading-relaxed text-justify indent-8 tracking-wide">
                {para}
              </p>
              <div className="mt-6 text-right text-[10px] text-amber-800/40 font-mono">
                Paragraph {i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
        <div className="flex items-center gap-2 text-amber-800">
          <Feather size={18} />
          <h3 className="font-bold text-gray-800 text-sm">EGW Prophetic Writings</h3>
        </div>
        <button onClick={() => setShowSeedForm(!showSeedForm)} className="text-xs font-bold bg-amber-800 text-white hover:bg-amber-900 px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1">
          {showSeedForm ? 'View Catalog' : <><Plus size={14}/> Seed Content</>}
        </button>
      </div>

      {showSeedForm ? (
        <form onSubmit={handleSeedSubmit} className="space-y-4 max-w-lg mx-auto w-full bg-amber-50/40 p-4 rounded-xl border border-amber-100">
          <div>
            <label className="block text-[11px] font-bold text-amber-900 mb-1">Book / Document Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full text-xs p-2 border rounded-lg bg-white" placeholder="e.g. The Great Controversy" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-amber-900 mb-1">Short Code Acronym</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} required className="w-full text-xs p-2 border rounded-lg bg-white" placeholder="e.g. GC" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-amber-900 mb-1">Raw Text Data Stream</label>
            <textarea value={fullContent} onChange={e => setFullContent(e.target.value)} required rows={8} className="w-full text-xs p-2 border rounded-lg font-serif bg-white" placeholder="Paste chapters or text content blocks here..." />
          </div>
          <button type="submit" className="w-full text-xs font-bold text-white bg-amber-800 p-2 rounded-lg hover:bg-amber-900 transition">
            Save Text to EGW Collection
          </button>
        </form>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {loading || readingLoading ? <p className="text-center text-xs text-gray-400 py-12">Streaming context sheets...</p> : null}
          
          {!loading && !readingLoading && works.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-12">No EGW books loaded yet. Click "Seed Content" above to add text fields.</p>
          )}

          {!loading && !readingLoading && works.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {works.map((work) => (
                <div key={work._id} className="p-3 border border-amber-100 rounded-xl bg-amber-50/20 flex flex-col justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-amber-100 text-amber-900 rounded-lg font-bold text-xs shadow-3xs">
                      {work.code}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[12px] font-bold text-gray-800 truncate">{work.title}</h4>
                      <p className="text-[10px] text-amber-800/80 font-medium">{work.author}</p>
                    </div>
                  </div>
                  <button onClick={() => openBookReader(work._id)} className="w-full mt-1 text-[11px] font-bold bg-amber-800 text-amber-50 py-1.5 rounded-lg hover:bg-amber-900 transition shadow-xs flex items-center justify-center gap-1">
                    <BookMarked size={12} /> Read Text
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
