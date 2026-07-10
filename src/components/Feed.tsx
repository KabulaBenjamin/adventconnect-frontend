import React, { useState, useEffect, useRef } from 'react';
import PostItem from './PostItem';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { Image as ImageIcon, X, Loader, Sparkles, Search, Bold, Italic, Strikethrough, ArrowDownToLine, ArrowUpToLine } from 'lucide-react';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchPosts = async () => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch('/posts');
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (err: any) {
      console.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (file) formData.append('media', file);
      await apiFetch('/posts', { method: 'POST', body: formData });
      setContent('');
      setFile(null);
      setPreview(null);
      fetchPosts();
    } catch (err: any) {
      alert('Error sharing: ' + err.message);
    } finally {
      setPosting(false);
    }
  };

  // High-fidelity selection formatting mechanism without changing original wrapper fonts
  const applyTextFormat = (type: 'bold' | 'italic' | 'strike' | 'sub' | 'super') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let formatted = '';
    switch (type) {
      case 'bold':
        formatted = `**${selected || 'bold text'}**`;
        break;
      case 'italic':
        formatted = `*${selected || 'italic text'}*`;
        break;
      case 'strike':
        formatted = `~~${selected || 'strikethrough'}~~`;
        break;
      case 'sub':
        formatted = `<sub>${selected || 'subscript'}</sub>`;
        break;
      case 'super':
        formatted = `<sup>${selected || 'superscript'}</sup>`;
        break;
    }

    const newContent = text.substring(0, start) + formatted + text.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + (selected || type).length);
    }, 0);
  };

  const filteredPosts = posts.filter(post => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const postContent = post.content?.toLowerCase() || '';
    const authorName = post.author?.username?.toLowerCase() || '';
    return postContent.includes(query) || authorName.includes(query);
  });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-10 text-left">
      {/* Frosted Integrated Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search within feed posts..."
          className="w-full bg-white/70 backdrop-blur-md border border-slate-200/40 py-3 pl-12 pr-5 rounded-2xl shadow-xs outline-none focus:bg-white focus:border-blue-400/50 transition-all text-xs font-bold text-slate-700 placeholder:text-slate-400"
        />
      </div>

      {/* Frosted Glass Post Writing Panel */}
      <form onSubmit={handlePostSubmit} className="bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-white shadow-xs focus-within:bg-white transition-all duration-300">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/10 shrink-0 text-sm select-none">
            {user?.username?.[0] || 'U'}
          </div>
          <div className="flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your heart, ${user?.username?.split(' ')[0] || 'Friend'}?`}
              className="w-full border-none focus:ring-0 text-xs resize-none outline-none bg-transparent pt-2.5 placeholder:text-slate-300 font-medium text-slate-700"
              rows={3}
            />
            
            {/* Realtime Inline Micro Formatting Toolbar */}
            <div className="flex flex-wrap gap-1.5 mt-2 pb-2 border-b border-slate-100/60">
              <button type="button" onClick={() => applyTextFormat('bold')} title="Bold text" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer">
                <Bold size={13} />
              </button>
              <button type="button" onClick={() => applyTextFormat('italic')} title="Italic text" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer">
                <Italic size={13} />
              </button>
              <button type="button" onClick={() => applyTextFormat('strike')} title="Strikethrough" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer">
                <Strikethrough size={13} />
              </button>
              <button type="button" onClick={() => applyTextFormat('sub')} title="Subscript" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition flex items-center gap-0.5 cursor-pointer text-[10px] font-black">
                <ArrowDownToLine size={13} />
              </button>
              <button type="button" onClick={() => applyTextFormat('super')} title="Superscript" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition flex items-center gap-0.5 cursor-pointer text-[10px] font-black">
                <ArrowUpToLine size={13} />
              </button>
            </div>
          </div>
        </div>

        {preview && (
          <div className="relative mt-3 group">
            <img src={preview} alt="Preview" className="rounded-2xl max-h-72 w-full object-cover border-2 border-white shadow-inner" />
            <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="absolute top-3 right-3 bg-slate-900/60 hover:bg-slate-900 text-white p-1.5 rounded-full transition cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
          <div className="flex gap-1.5">
            <label className="p-2 rounded-xl bg-slate-100/50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer flex items-center justify-center">
              <ImageIcon size={15} />
              <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => {
                const s = e.target.files?.[0];
                if(s) { setFile(s); setPreview(URL.createObjectURL(s)); }
              }} />
            </label>
            <button type="button" className="p-2 rounded-xl bg-slate-100/50 text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all flex items-center justify-center cursor-pointer">
              <Sparkles size={15} />
            </button>
          </div>
          <button type="submit" disabled={posting || (!content.trim() && !file)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black hover:bg-blue-600 transition disabled:opacity-20 shadow-xs text-xs tracking-wide cursor-pointer">
            {posting ? <Loader size={14} className="animate-spin" /> : 'Share Post'}
          </button>
        </div>
      </form>

      {/* POSTS LIST HUB */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-40 bg-white/50 backdrop-blur-md rounded-3xl animate-pulse border border-white" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-white/40 backdrop-blur-md rounded-3xl border border-white">
              <p className="text-xs text-slate-400 font-bold italic">No matching posts found</p>
            </div>
          ) : (
            filteredPosts.map((post) => <PostItem key={post._id} post={post} user={user} fetchPosts={fetchPosts} />)
          )}
        </div>
      )}
    </div>
  );
};

export default Feed;
