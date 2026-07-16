import React, { useState } from 'react';
import { MoreHorizontal, Send, CornerDownRight, Edit3, Trash2, X, Check } from 'lucide-react';
import { apiFetch } from '../lib/api';

// ==========================================
// UNIFIED HOVER METRIC BREAKDOWN TOOLTIP
// ==========================================
const InteractionTooltip = ({ items, title, fallbackText = 'Someone' }: { items: any[], title: string, fallbackText?: string }) => {
  if (!items || items.length === 0) return null;

  const names = items.map(item => {
    if (typeof item === 'object' && item !== null) {
      if (item.user) return item.user.name || item.user.username || fallbackText;
      if (item.author) return item.author.name || item.author.username || fallbackText;
      if (item.name) return item.name;
      if (item.username) return item.username;
    }
    return fallbackText;
  });

  return (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-[10px] rounded-xl px-3 py-1.5 whitespace-nowrap shadow-xl z-50 pointer-events-none group-hover/metric:block hidden animate-in fade-in slide-in-from-bottom-1 duration-150">
      <div className="font-bold border-b border-gray-700 pb-0.5 mb-1 text-blue-400">{title}</div>
      <div className="space-y-0.5 max-h-24 overflow-y-auto pr-1">
        {names.map((name, idx) => (
          <div key={idx}>{name}</div>
        ))}
      </div>
    </div>
  );
};

const countTotalTreeNodes = (comments: any[]): number => {
  if (!comments) return 0;
  let count = comments.length;
  comments.forEach(c => {
    if (c.replies && c.replies.length > 0) {
      count += countTotalTreeNodes(c.replies);
    }
  });
  return count;
};

const collectTreeAuthors = (comments: any[]): any[] => {
  if (!comments) return [];
  let authors: any[] = [];
  comments.forEach(c => {
    if (c.author) authors.push(c.author);
    if (c.replies && c.replies.length > 0) {
      authors = [...authors, ...collectTreeAuthors(c.replies)];
    }
  });
  return authors;
};

// ==========================================
// RECURSIVE COMMENT/REPLY NODE COMPONENT
// ==========================================
const CommentNode = ({ comment, postId, user, onReplySubmit, onCommentReact, onCommentEdit, onCommentDelete, onCommentPray }: any) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const commentAuthorId = comment.author?._id || comment.author;
  const currentUserId = user?.id || user?._id;
  const isMyComment = commentAuthorId && currentUserId && commentAuthorId.toString() === currentUserId.toString();

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReplySubmit(comment._id, replyText);
    setReplyText('');
    setShowReplyForm(false);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    onCommentEdit(comment._id, editText);
    setIsEditing(false);
    setShowOptions(false);
  };

  const hasReacted = comment.reactions?.some((r: any) => {
    const rUserId = r?.user?._id || r?.user;
    return rUserId && currentUserId && rUserId.toString() === currentUserId.toString();
  });

  const buttonEmoji = comment.reactions?.find((r: any) => {
    const rUserId = r?.user?._id || r?.user;
    return rUserId && currentUserId && rUserId.toString() === currentUserId.toString();
  })?.type || '❤️';

  const hasPrayedComment = comment.prayers?.some((p: any) => {
    const pId = p._id || p;
    return pId && currentUserId && pId.toString() === currentUserId.toString();
  });

  const totalSubReplies = countTotalTreeNodes(comment.replies || []);
  const subReplyAuthors = collectTreeAuthors(comment.replies || []);

  return (
    <div className="mt-3 group/node w-full relative">
      <div className="bg-gray-50/80 p-4 rounded-[24px] border border-gray-100/60 transition-all hover:bg-gray-100/50 shadow-sm relative text-left">
        <div className="flex justify-between items-start mb-1">
          <span className="font-black text-xs text-blue-600">
            {comment.author?.name || comment.author?.username || 'Fellow Believer'}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
              {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ''}
            </span>
            {isMyComment && (
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <MoreHorizontal size={12} />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="flex gap-2 items-center mt-1">
            <input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 text-sm font-medium bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none"
            />
            <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded-md cursor-pointer">
              <Check size={14} />
            </button>
            <button onClick={() => setIsEditing(false)} className="p-1 text-red-600 hover:bg-red-50 rounded-md cursor-pointer">
              <X size={14} />
            </button>
          </div>
        ) : (
          <p className="text-gray-700 text-sm font-medium leading-relaxed">{comment.text}</p>
        )}

        {showOptions && isMyComment && (
          <div className="absolute right-4 top-8 bg-white border border-gray-100 rounded-xl shadow-lg p-1 flex gap-1 z-30">
            <button
              onClick={() => { setIsEditing(true); setShowOptions(false); }}
              className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-blue-600 cursor-pointer"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={() => { onCommentDelete(comment._id); setShowOptions(false); }}
              className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-red-600 cursor-pointer"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 mt-2">
          <div className="relative group/metric" onMouseLeave={() => setShowEmojiTray(false)}>
            <button
              type="button"
              onClick={() => setShowEmojiTray(!showEmojiTray)}
              className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer ${
                hasReacted ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span>{buttonEmoji}</span> {comment.reactions?.length || 0}
            </button>
            <InteractionTooltip items={comment.reactions || []} title="Reactions By:" fallbackText="Believer" />

            {showEmojiTray && (
              <div className="absolute bottom-5 left-0 pt-2 z-50">
                <div className="bg-white border border-gray-100 shadow-xl px-2 py-1 rounded-xl flex gap-2 items-center">
                  {['❤️', '🙌', '🙏', '👍'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { onCommentReact(comment._id, emoji); setShowEmojiTray(false); }}
                      className="text-sm hover:scale-120 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative group/metric">
            <button
              type="button"
              onClick={() => onCommentPray(comment._id)}
              className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-0.5 transition-colors cursor-pointer ${
                hasPrayedComment ? 'text-orange-600 font-extrabold' : 'text-gray-400 hover:text-orange-500'
              }`}
            >
              <span>🙏</span> {comment.prayers?.length || 0}
            </button>
            <InteractionTooltip items={comment.prayers || []} title="Prayed By:" fallbackText="Prayer Warrior" />
          </div>

          <div className="relative group/metric">
            <button
              type="button"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 flex items-center gap-1 cursor-pointer"
            >
              <CornerDownRight size={10} /> Reply <span className="text-blue-500 font-bold">({totalSubReplies})</span>
            </button>
            <InteractionTooltip items={subReplyAuthors} title="Replied By:" fallbackText="Replier" />
          </div>
        </div>
      </div>

      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="flex gap-2 mt-2 ml-4 pl-3 border-l-2 border-blue-500/30">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply to this thread..."
            className="flex-1 bg-white border border-gray-100 rounded-xl px-3 py-1.5 font-medium text-xs outline-none"
          />
          <button type="submit" className="p-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer">
            <Send size={12}/>
          </button>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 pl-3 border-l-2 border-gray-100 space-y-1 mt-1">
          {comment.replies.map((reply: any) => (
            <CommentNode
              key={reply._id || reply.text}
              comment={reply}
              postId={postId}
              user={user}
              onReplySubmit={onReplySubmit}
              onCommentReact={onCommentReact}
              onCommentEdit={onCommentEdit}
              onCommentDelete={onCommentDelete}
              onCommentPray={onCommentPray}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN POST ITEM CORE COMPONENT
// ==========================================
const PostItem = ({ post, user, fetchPosts }: any) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);

  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostContent, setEditPostContent] = useState(post.content);

  const postAuthorId = post.author?._id || post.author;
  const currentUserId = user?.id || user?._id;
  const isMyPost = postAuthorId && currentUserId && postAuthorId.toString() === currentUserId.toString();

  const handleAction = async (path: string, method = 'POST', body = {}) => {
    try {
      await apiFetch(`/posts/${post._id}/${path}`.replace(/\/$/, ""), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      });
      fetchPosts();
    } catch (err) {
      console.error(`Action failed:`, err);
    }
  };

  const handleUpdatePost = () => {
    handleAction('', 'PUT', { content: editPostContent });
    setIsEditingPost(false);
    setShowPostMenu(false);
  };

  const handleDeletePost = () => {
    if (window.confirm("Remove this post timeline record completely?")) handleAction('', 'DELETE');
  };

  const handleCommentEdit = (commentId: string, text: string) => {
    handleAction(`comment/${commentId}`, 'PUT', { text });
  };

  const handleCommentDelete = (commentId: string) => {
    if (window.confirm("Delete this comment thread?")) handleAction(`comment/${commentId}`, 'DELETE');
  };

  const handleCommentPray = (commentId: string) => {
    handleAction(`comment/${commentId}/pray`, 'POST');
  };

  const handleNestedReply = (parentId: string, text: string) => {
    handleAction('comment', 'POST', { parentId, text });
  };

  const handleCommentReaction = (commentId: string, emoji: string) => {
    handleAction(`comment/${commentId}/react`, 'POST', { type: emoji });
  };

  const hasReacted = post.reactions?.some((r: any) => {
    const rUserId = r?.user?._id || r?.user;
    return rUserId && currentUserId && rUserId.toString() === currentUserId.toString();
  });

  const buttonEmoji = post.reactions?.find((r: any) => {
    const rUserId = r?.user?._id || r?.user;
    return rUserId && currentUserId && rUserId.toString() === currentUserId.toString();
  })?.type || '❤️';

  const hasPrayedPost = post.prayers?.some((p: any) => {
    const pId = p._id || p;
    return pId && currentUserId && pId.toString() === currentUserId.toString();
  });

  const ultimateTotalCommentsCount = countTotalTreeNodes(post.comments || []);
  const cumulativeThreadAuthors = collectTreeAuthors(post.comments || []);

  const displayName = post.author?.name || post.author?.username || 'Fellow Believer';

  return (
    <div className="bg-white rounded-[40px] p-8 border border-gray-100 mb-6 shadow-sm relative text-left">

      {/* Post Header */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            {displayName[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <h4 className="font-black text-gray-900 leading-none">{displayName}</h4>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 inline-block">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {isMyPost && (
          <button onClick={() => setShowPostMenu(!showPostMenu)} className="text-gray-300 hover:text-gray-900 cursor-pointer">
            <MoreHorizontal size={20}/>
          </button>
        )}

        {showPostMenu && isMyPost && (
          <div className="absolute right-0 top-12 bg-white border border-gray-100 shadow-xl rounded-2xl p-2 flex flex-col gap-1 z-40 w-36 font-bold text-xs">
            <button onClick={() => { setIsEditingPost(true); setShowPostMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-xl cursor-pointer">
              <Edit3 size={14}/> Edit Post
            </button>
            <button onClick={handleDeletePost} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-xl text-red-600 cursor-pointer">
              <Trash2 size={14}/> Delete Post
            </button>
          </div>
        )}
      </div>

      {isEditingPost ? (
        <div className="mb-6 flex flex-col gap-2">
          <textarea
            value={editPostContent}
            onChange={(e) => setEditPostContent(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-medium outline-none"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditingPost(false)} className="px-4 py-2 border rounded-xl text-xs font-black text-gray-500 cursor-pointer">Cancel</button>
            <button onClick={handleUpdatePost} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black cursor-pointer">Save</button>
          </div>
        </div>
      ) : post.content && post.content.includes("/meeting/") ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
          <p className="text-gray-700 font-medium text-sm mb-4 whitespace-pre-wrap leading-relaxed">
            {post.content.split("👉")[0]}
          </p>
          {(() => {
            const match = post.content.match(/https://adventconnect-7jfq.onrender.com/meeting/[a-zA-Z0-9_-]+/);
            const url = match ? match[0] : "#";
            return (
              <a
                href={url}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-md hover:shadow-lg"
              >
                🎥 Join Live Gathering Room
              </a>
            );
          })()}
        </div>
      ) : (
        <p className="text-gray-700 font-medium text-sm leading-relaxed mb-6 whitespace-pre-wrap">{post.content}</p>
      )}

      {post.media && (
        <div className="mb-6 rounded-[32px] overflow-hidden border">
          <img src={post.media} alt="Post Media" className="w-full object-cover max-h-96" />
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-4 pt-6 border-t border-gray-50">
        <div className="relative group/metric" onMouseLeave={() => setShowEmojiTray(false)}>
          <button
            type="button"
            onClick={() => setShowEmojiTray(!showEmojiTray)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
              hasReacted ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'
            }`}
          >
            <span className="text-sm">{buttonEmoji}</span> {post.reactions?.length || 0}
          </button>
          <InteractionTooltip items={post.reactions || []} title="Reacted By:" fallbackText="Believer" />

          {showEmojiTray && (
            <div className="absolute bottom-10 left-0 pt-4 z-50">
              <div className="bg-white border border-gray-100 shadow-2xl px-4 py-2.5 rounded-2xl flex gap-3.5 items-center">
                {['❤️', '🙌', '🙏', '👍'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { handleAction('react', 'POST', { type: emoji }); setShowEmojiTray(false); }}
                    className="text-xl hover:scale-130 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative group/metric">
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs cursor-pointer"
          >
            <span className="text-sm">💬</span> {ultimateTotalCommentsCount}
          </button>
          <InteractionTooltip items={cumulativeThreadAuthors} title="Commented By:" fallbackText="Contributor" />
        </div>

        <div className="relative group/metric">
          <button
            type="button"
            onClick={() => handleAction('pray', 'POST')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
              hasPrayedPost ? 'bg-orange-100 text-orange-600 shadow-sm' : 'bg-orange-50 text-orange-600 hover:scale-105'
            }`}
          >
            <span className="text-sm">🙏</span> {post.prayers?.length || 0}
          </button>
          <InteractionTooltip items={post.prayers || []} title="Praying For This:" fallbackText="Prayer Warrior" />
        </div>
      </div>

      {showComments && (
        <div className="mt-6 pt-6 border-t border-gray-50 space-y-4">
          <div className="max-h-[450px] overflow-y-auto space-y-3 pr-1">
            {post.comments && post.comments.map((comment: any) => (
              <CommentNode
                key={comment._id || comment.text}
                comment={comment}
                postId={post._id}
                user={user}
                onReplySubmit={handleNestedReply}
                onCommentReact={handleCommentReaction}
                onCommentEdit={handleCommentEdit}
                onCommentDelete={handleCommentDelete}
                onCommentPray={handleCommentPray}
              />
            ))}
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (commentText.trim()) {
              handleAction('comment', 'POST', { text: commentText });
              setCommentText('');
            }
          }} className="flex gap-2 pt-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write an encouraging message..."
              className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2.5 font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button type="submit" className="p-2.5 bg-blue-600 text-white rounded-xl cursor-pointer">
              <Send size={16}/>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostItem;
