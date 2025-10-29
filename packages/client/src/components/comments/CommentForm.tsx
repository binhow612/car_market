import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Send, X } from 'lucide-react';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  initialContent?: string;
  isEditing?: boolean;
}

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  initialContent = '',
  isEditing = false,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent || (placeholder.startsWith('@') ? placeholder : ''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      
      // If placeholder starts with @, set cursor position after @mention
      if (placeholder && placeholder.startsWith('@')) {
        const mentionLength = placeholder.trim().length;
        textareaRef.current.setSelectionRange(mentionLength, mentionLength);
      }
    }
  }, [content, placeholder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      if (!isEditing) {
        setContent('');
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const remainingChars = 2000 - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isOverLimit ? 'border-red-300' : 'border-gray-300'
          }`}
          rows={3}
          maxLength={2000}
          disabled={isSubmitting}
        />
        
          <div className="flex justify-between items-center mt-2">
            <div className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
              {remainingChars} characters remaining
            </div>
            
            <div className="flex space-x-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="flex items-center min-h-[44px]"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={!content.trim() || isSubmitting || isOverLimit}
                className="flex items-center bg-blue-600 text-white hover:bg-blue-700 min-h-[44px]"
              >
                <Send className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Posting...' : isEditing ? 'Update' : 'Post'}
              </Button>
            </div>
          </div>
      </div>
    </form>
  );
}
