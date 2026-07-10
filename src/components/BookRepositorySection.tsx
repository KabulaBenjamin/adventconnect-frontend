import React, { useState, useEffect } from 'react';
import { BookOpen, FolderOpen, ArrowLeft, Plus, UploadCloud, ClipboardList, BookMarked, FileText, Minimize2 } from 'lucide-react';

interface RepositoryBook {
  _id: string;
  title: string;
  author: string;
  category: string;
  formatType: string;
}

export default function BookRepositorySection() {
  const [books, setBooks] = useState<RepositoryBook[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  
  // Reading Mode States
  const [readingBook, setReadingBook] = useState<{ title: string; text: string } | null>(null);
  const [readingLoading, setReadingLoading] = useState<boolean>(false);

  // Form States
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('General');
  const [formatType, setFormatType] = useState('pdf');
  const [pastedData, setPastedData] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');

  const getBaseUrl = () => window.location.origin.includes('localhost') ? 'http://localhost:4000' : window.location.origin;

  const loadRepository = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/library/books`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRepository(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFileBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title, author, category, formatType, inputMethod,
      pastedData: inputMethod === 'paste' ? pastedData : '',
      fileBuffer: inputMethod === 'upload' ? fileBase64 : ''
    };

    try {
      const res = await fetch(`${getBaseUrl()}/api/library/books/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setTitle(''); setAuthor(''); setPastedData(''); setSelectedFile(null); setFileBase64('');
        setShowUploadForm(false);
        loadRepository();
      }
    } catch (err) { console.error(err); }
  };

  const launchReader = async (bookId: string) => {
    setReadingLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/library/books/${bookId}/read`);
      if (res.ok) {
        const data = await res.json();
        setReadingBook(data);
      }
    } catch (err) { console.error(err); }
    finally { setReadingLoading(false); }
  };

  // Clean up messy text artifacts caused by raw PDF layout streaming engines
  const formatBookContent = (txt: string) => {
    if (!txt) return [];
    return txt
      .split(/-------+Page\s*\(\w+\)\s*Break-------+/gi) // Split cleanly at page breaks if present
      .map(p => p.trim())
      .filter(p => p.length > 0);
  };

  if (readingBook) {
    const pages = formatBookContent(readingBook.text);

    return (
      <div className="flex flex-col h-full bg-[#fcf9f2] rounded-xl shadow-inner border border-[#e6dfce] overflow-hidden select-text">
        {/* Sleek, Immersive Reader Header Toolbar */}
        <div className="px-6 py-3 border-b border-[#e8e2d4] bg-[#f4eeda] flex items-center justify-between shadow-sm">
          <button 
            onClick={() => setReadingBook(null)} 
            className="flex items-center gap-1.5 text-xs font-bold text-[#5c4a33] hover:text-amber-900 bg-white/60 hover:bg-white px-3 py-1.5 rounded-md transition shadow-2xs border border-[#decfa7]"
          >
            <ArrowLeft size={14} /> Back to Catalog
          </button>
          
          <div className="text-center">
            <h4 className="text-xs font-extrabold text-[#3a2e1f] tracking-wide uppercase flex items-center justify-center gap-1.5">
              <BookMarked size={14} className="text-amber-800" /> {readingBook.title}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-800 text-amber-50 font-bold px-2.5 py-1 rounded-full shadow-2xs uppercase tracking-wider">
              Book View
            </span>
          </div>
        </div>
        
        {/* Main View Area mimicking a real physical page */}
        <div className="flex-1 overflow-y-auto px-4 py-8 bg-[#f5f1e6] flex flex-col items-center">
          {pages.length > 0 ? (
            pages.map((pageText, idx) => (
              <div 
                key={idx} 
                className="w-full max-w-2xl bg-white shadow-md border border-[#e3dac9] rounded-sm p-8 md:p-14 mb-8 relative font-serif text-[#2e251a]"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                {/* Visual Watermark line imitating realistic margins */}
                <div className="absolute top-0 bottom-0 left-6 border-l border-amber-100/40 pointer-events-none hidden md:block"></div>
                
                {/* Main Content Body Paragraph */}
                <div className="text-base md:text-lg leading-relaxed text-justify whitespace-pre-wrap tracking-wide antialiased">
                  {pageText}
                </div>

                {/* Subtle Book Page Footer Indicator */}
                <div className="mt-12 pt-4 border-t border-[#f2edd9] text-center text-[11px] text-amber-800/60 font-sans tracking-widest font-semibold uppercase">
                  — Page {idx + 1} —
                </div>
              </div>
            ))
          ) : (
            <div className="w-full max-w-2xl bg-white shadow-md border border-[#e3dac9] rounded-sm p-12 text-center text-gray-400 font-serif">
              No printable character content discovered in this specific document.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="text-blue-600" size={18} />
          <h3 className="font-bold text-gray-800 text-sm">Book Repository</h3>
        </div>

        <button onClick={() => setShowUploadForm(!showUploadForm)} className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition px-3 py-1.5 rounded-lg shadow-sm">
          {showUploadForm ? 'View Catalog' : <span className="flex items-center gap-1"><Plus size={14}/> Extract New Book</span>}
        </button>
      </div>

      {showUploadForm ? (
        <form onSubmit={handleFormSubmit} className="space-y-4 max-w-xl bg-gray-50/50 p-4 rounded-xl border border-gray-100 mx-auto w-full">
          <div className="flex border-b border-gray-200 mb-2">
            <button type="button" onClick={() => { setInputMethod('upload'); setFormatType('pdf'); }} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition ${inputMethod === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              <UploadCloud size={14} /> Extract Local File (PDF)
            </button>
            <button type="button" onClick={() => { setInputMethod('paste'); setFormatType('markdown'); }} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition ${inputMethod === 'paste' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              <ClipboardList size={14} /> Paste Text Material
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Book Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full text-xs p-2 border rounded-lg" placeholder="e.g. Church Manual" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Author</label>
              <input type="text" value={author} onChange={e => setAuthor(e.target.value)} required className="w-full text-xs p-2 border rounded-lg" placeholder="e.g. Ellen G. White" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Category</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full text-xs p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Format</label>
              <select value={formatType} onChange={e => setFormatType(e.target.value)} className="w-full text-xs p-2 border rounded-lg font-bold text-gray-700">
                {inputMethod === 'upload' ? <option value="pdf">PDF Document Extractor (.pdf)</option> : <option value="markdown">Plain Text / Markdown</option>}
              </select>
            </div>
          </div>

          <div className="p-4 bg-white border border-dashed rounded-xl border-gray-200">
            {inputMethod === 'upload' ? (
              <div className="text-center py-2">
                <input type="file" id="local-file-picker" accept=".pdf" onChange={handleFileChange} className="hidden" required />
                <label htmlFor="local-file-picker" className="cursor-pointer inline-flex flex-col items-center gap-2 text-xs font-medium text-gray-500">
                  <UploadCloud size={28} className="text-blue-500" />
                  <span>{selectedFile ? `Selected: ${selectedFile.name}` : 'Click to select local book file'}</span>
                </label>
              </div>
            ) : (
              <textarea value={pastedData} onChange={e => setPastedData(e.target.value)} required rows={5} className="w-full text-xs p-2 border rounded-lg font-mono" placeholder="Paste your book text contents here..." />
            )}
          </div>

          <button type="submit" className="w-full text-xs font-bold text-white bg-blue-600 p-2.5 rounded-lg hover:bg-blue-700 transition">
            Run Text Extractor & Add to Catalog
          </button>
        </form>
      ) : (
        <div>
          {loading || readingLoading ? <p className="text-center text-xs text-gray-400 py-12">Loading reading content stream...</p> : null}
          
          {!loading && !readingLoading && books.length === 0 && <p className="text-center text-xs text-gray-400 py-12">No books found. Use the extract button above to add one.</p>}
          
          {!loading && !readingLoading && books.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {books.map((book) => (
                <div key={book._id} className="p-3 border border-gray-100 rounded-xl flex flex-col justify-between gap-3 bg-gray-50/30">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[12px] font-bold text-gray-800 truncate">{book.title}</h4>
                      <p className="text-[10px] text-gray-500 font-medium truncate">{book.author}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => launchReader(book._id)}
                    className="w-full mt-1 flex items-center justify-center gap-1 text-[11px] font-bold bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
                  >
                    <BookOpen size={12} /> Read Book
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
