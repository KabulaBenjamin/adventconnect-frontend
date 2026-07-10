import React, { useState } from 'react';
import { Book, ChevronLeft, ChevronRight, Search, ExternalLink } from 'lucide-react';

interface EgwBookConfig {
  code: string;
  title: string;
  pubNumber: number;
  startPara: number;
  totalChapters: number;
}

export default function EgwSection() {
  // Foundational public domain library mappings from the official online repository engine
  const egwBooks: EgwBookConfig[] = [
    { code: "sc", title: "Steps to Christ", pubNumber: 108, startPara: 9, totalChapters: 13 },
    { code: "gc", title: "The Great Controversy", pubNumber: 132, startPara: 17, totalChapters: 42 },
    { code: "da", title: "The Desire of Ages", pubNumber: 130, startPara: 11, totalChapters: 87 },
    { code: "st", title: "The Sanctified Life", pubNumber: 112, startPara: 7, totalChapters: 11 },
    { code: "kp", title: "Steps to Jesus (Kiswahili)", pubNumber: 1121, startPara: 9, totalChapters: 13 }
  ];

  const [selectedBook, setSelectedBook] = useState<EgwBookConfig>(egwBooks[0]);
  const [chapter, setChapter] = useState<number>(1);

  // Compute the dynamic web target string mapping paragraph markers safely
  const currentTargetPara = selectedBook.startPara + (chapter - 1);
  const embedUrl = `https://text.egwwritings.org/publication.php?pubnumber=${selectedBook.pubNumber}&para=${currentTargetPara}.1`;

  const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = egwBooks.find(b => b.code === e.target.value);
    if (found) {
      setSelectedBook(found);
      setChapter(1); // Safely reset to the beginning chapter
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      {/* 1. Header Navigation Controller */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Book className="text-blue-600" size={18} />
          <h3 className="font-bold text-gray-800 text-sm">EGW Writings</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Book Selector */}
          <select
            value={selectedBook.code}
            onChange={handleBookChange}
            className="text-[12px] border border-gray-200 rounded-lg p-1.5 font-medium text-gray-700 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {egwBooks.map(b => (
              <option key={b.code} value={b.code}>{b.title}</option>
            ))}
          </select>

          {/* Chapter Pager Engine */}
          <div className="flex items-center gap-1">
            <button
              disabled={chapter <= 1}
              onClick={() => setChapter(prev => prev - 1)}
              className="p-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 disabled:opacity-40 hover:bg-gray-100 transition"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[12px] font-bold px-2 text-gray-700 min-w-[70px] text-center">
              Ch. {chapter} / {selectedBook.totalChapters}
            </span>
            <button
              disabled={chapter >= selectedBook.totalChapters}
              onClick={() => setChapter(prev => prev + 1)}
              className="p-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 disabled:opacity-40 hover:bg-gray-100 transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* External Gateway Reference Link */}
          <a 
            href={embedUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 border border-gray-200 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1 text-[11px] font-medium"
            title="Open in official portal window"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* 2. Seamless Sandboxed Reader Viewframe */}
      <div className="flex-1 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 min-h-[500px] relative shadow-inner">
        <iframe
          src={embedUrl}
          sandbox="allow-scripts allow-same-origin allow-popups"
          className="w-full h-full bg-white opacity-95 hover:opacity-100 transition-opacity"
          title={`EGW Read Space: ${selectedBook.title}`}
        />
      </div>
    </div>
  );
}
