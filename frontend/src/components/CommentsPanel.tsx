import { useState, useRef } from 'react';
import { X, Send, AtSign } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetComments, useAddComment, useGetAllUsers } from '../hooks/useQueries';
import { Comment } from '../backend';

interface CommentsPanelProps {
  videoId: string;
  onClose: () => void;
}

function renderCommentText(text: string) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (/^@\w+$/.test(part)) {
      return <span key={i} className="text-neon-orange font-semibold">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

function timeAgo(ts: bigint): string {
  const diff = Date.now() - Number(ts) / 1_000_000;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function CommentItem({ comment }: { comment: Comment }) {
  const displayName = comment.authorName || 'User';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  return (
    <div className="bg-card/40 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-neon-orange/20 flex items-center justify-center text-xs text-neon-orange font-bold flex-shrink-0">
          {initial}
        </div>
        <span className="text-sm font-semibold text-foreground">{displayName}</span>
      </div>
      <p className="text-sm text-foreground/90 ml-8">{renderCommentText(comment.text)}</p>
      <p className="text-xs text-muted-foreground ml-8 mt-1">{timeAgo(comment.timestamp)}</p>
    </div>
  );
}

export default function CommentsPanel({ videoId, onClose }: CommentsPanelProps) {
  const { identity } = useInternetIdentity();
  const { data: comments, isLoading } = useGetComments(videoId);
  const { data: allUsers } = useGetAllUsers();
  const addComment = useAddComment();
  const [text, setText] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart ?? 0;
    setText(val);
    setCursorPos(pos);

    const textBeforeCursor = val.slice(0, pos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const filteredUsers = (allUsers ?? []).filter(u =>
    mentionQuery === '' || u.username.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  const insertMention = (username: string) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const textAfterCursor = text.slice(cursorPos);
    const newTextBefore = textBeforeCursor.replace(/@\w*$/, `@${username} `);
    const newText = newTextBefore + textAfterCursor;
    setText(newText);
    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !identity) return;
    try {
      await addComment.mutateAsync({ videoId, text: text.trim() });
      setText('');
    } catch (err) {
      console.error(err);
    }
  };

  const sortedComments = comments
    ? [...comments].sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    : [];

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col z-20">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-display font-bold text-foreground">
          Comments {sortedComments.length > 0 && <span className="text-muted-foreground text-sm font-normal">({sortedComments.length})</span>}
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-card/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No comments yet. Be the first!
          </div>
        ) : (
          sortedComments.map(comment => (
            <CommentItem key={String(comment.id)} comment={comment} />
          ))
        )}
      </div>

      {identity ? (
        <div className="p-4 border-t border-border relative">
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-1 bg-card border border-border rounded-lg overflow-hidden shadow-lg z-10">
              {filteredUsers.map(user => (
                <button
                  key={user.id.toString()}
                  onClick={() => insertMention(user.username)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neon-orange/10 transition-colors text-left"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-neon-orange/20 flex items-center justify-center text-xs text-neon-orange">
                      {user.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-foreground">@{user.username}</span>
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={text}
                onChange={handleInputChange}
                placeholder="Add a comment... (use @ to mention)"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-orange/50 pr-8"
              />
              {text.includes('@') && (
                <AtSign className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-orange/50" />
              )}
            </div>
            <button
              type="submit"
              disabled={!text.trim() || addComment.isPending}
              className="bg-neon-orange text-black rounded-lg px-3 py-2 disabled:opacity-50 hover:bg-neon-yellow transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="p-4 border-t border-border text-center text-sm text-muted-foreground">
          Log in to leave a comment
        </div>
      )}
    </div>
  );
}
