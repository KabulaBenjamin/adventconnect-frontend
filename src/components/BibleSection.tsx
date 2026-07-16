import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

interface Verse {
  chapter: number;
  verse: number;
  text: string;
}

export default function BibleSection({ isCompact }: { isCompact: boolean }) {
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(3);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const books = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ];

  useEffect(() => {
    async function fetchScripture() {
      setLoading(true);
      setError('');
      try {
        // Fallback to local address if window origin isn't available
        const baseUrl = "https://adventconnect-7jfq.onrender.com";

        const res = await fetch(`${baseUrl}/api/library/bible/chapter?book=${encodeURIComponent(book)}&chapter=${chapter}`);
        
        if (!res.ok) {
          throw new Error("Failed to fetch scripture data");
        }

        const data = await res.json();
        
        if (data && data.verses) {
          setVerses(data.verses);
        } else if (Array.isArray(data)) {
          setVerses(data);
        } else {
          throw new Error("Invalid structure returned");
        }
      } catch (err: any) {
        console.error("Bible fetch error:", err);
        setError('Could not load scripture data.');
      } finally {
        setLoading(false);
      }
    }

    fetchScripture();
  }, [book, chapter]);

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="text-blue-600" size={18} />
          <h3 className="font-bold text-gray-800 text-sm">Bible Module</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={book} 
            onChange={(e) => { setBook(e.target.value); setChapter(1); }}
            className="text-[12px] border border-gray-200 rounded-lg p-1.5 font-medium text-gray-700 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {books.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <div className="flex items-center gap-1">
            <button 
              disabled={chapter <= 1}
              onClick={() => setChapter(prev => prev - 1)}
              className="p-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 disabled:opacity-40 hover:bg-gray-100 transition"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[12px] font-bold px-2 text-gray-700">Chapter {chapter}</span>
            <button 
              onClick={() => setChapter(prev => prev + 1)}
              className="p-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 max-h-[450px]">
        {loading && <p className="text-center text-xs font-medium text-gray-400 py-12">Loading scripture text...</p>}
        {error && <p className="text-center text-xs font-bold text-red-400 py-12">{error}</p>}
        
        {!loading && !error && verses.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-12">No data found.</p>
        )}

        {!loading && !error && verses.length > 0 && (
          <div className="space-y-3 text-gray-700 text-[13px] leading-relaxed font-normal">
            {verses.map((v) => (
              <p key={v.verse} className="hover:bg-blue-50/40 p-1 rounded transition">
                <span className="font-bold text-blue-600 mr-2 select-none text-[11px] align-super">{v.verse}</span>
                {v.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
