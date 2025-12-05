import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email?: string;
  avatarUrl?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionSelect?: (userId: string) => void;
  placeholder?: string;
  users: User[];
  className?: string;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

export const MentionInput = ({
  value,
  onChange,
  onMentionSelect,
  placeholder = "Viết bình luận...",
  users,
  className = "",
  onKeyPress,
  autoFocus,
}: MentionInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Find @ mention
    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space after @ (mention ended)
      if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
        setShowSuggestions(false);
        setMentionStart(null);
        return;
      }

      const query = textAfterAt.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      );

      if (filtered.length > 0) {
        setMentionStart(lastAtIndex);
        setSuggestions(filtered);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
      setMentionStart(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        selectMention(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      } else {
        // Call original onKeyPress for other keys
        if (onKeyPress) {
          onKeyPress(e);
        }
        return;
      }
    } else {
      // Call original onKeyPress if no suggestions
      if (onKeyPress) {
        onKeyPress(e);
      }
    }
  };

  const selectMention = (user: User) => {
    if (mentionStart === null || !inputRef.current) return;

    const textBefore = value.substring(0, mentionStart);
    const textAfter = value.substring(inputRef.current.selectionStart || value.length);
    const newValue = `${textBefore}@${user.fullName} ${textAfter}`;

    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(null);

    // Set cursor position after the mention
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = mentionStart + user.fullName.length + 2; // +2 for @ and space
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);

    if (onMentionSelect) {
      onMentionSelect(user.id);
    }
  };

  // Extract mentioned user IDs from text
  const extractMentionedUserIds = (text: string): string[] => {
    const mentionedIds: string[] = [];
    const mentionRegex = /@([^@\s]+)/g;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionName = match[1].trim();
      const user = users.find(
        (u) => u.fullName.toLowerCase() === mentionName.toLowerCase()
      );
      if (user && !mentionedIds.includes(user.id)) {
        mentionedIds.push(user.id);
      }
    }

    return mentionedIds;
  };

  // Expose extractMentionedUserIds function via ref (if needed)
  useEffect(() => {
    if (inputRef.current) {
      (inputRef.current as any).extractMentionedUserIds = extractMentionedUserIds;
    }
  }, [value, users]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((user, index) => (
            <div
              key={user.id}
              onClick={() => selectMention(user)}
              className={`flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 last:border-0 ${
                index === selectedIndex ? 'bg-brand-50' : 'hover:bg-slate-50'
              }`}
            >
              <img
                src={user.avatarUrl || 'https://via.placeholder.com/32'}
                alt={user.fullName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">
                  {user.fullName}
                </p>
                {user.email && (
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Export helper function to extract mentioned user IDs
export const extractMentionedUserIds = (text: string, users: User[]): string[] => {
  const mentionedIds: string[] = [];
  const mentionRegex = /@([^@\s]+)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionName = match[1].trim();
    const user = users.find(
      (u) => u.fullName.toLowerCase() === mentionName.toLowerCase()
    );
    if (user && !mentionedIds.includes(user.id)) {
      mentionedIds.push(user.id);
    }
  }

  return mentionedIds;
};

