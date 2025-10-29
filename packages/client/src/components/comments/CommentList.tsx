import type { Comment } from '../../types/comment.types';
import { CommentItem } from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  loading: boolean;
  onUpdateComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onReaction: (commentId: string, reactionType: 'like' | 'helpful' | 'dislike') => void;
  onPinComment: (commentId: string, isPinned: boolean) => void;
  onCreateReply: (content: string, parentCommentId: string) => void;
  onLoadReplies?: (commentId: string) => Promise<void>; // Callback to load replies for a comment
  currentUserId?: string;
  isAuthenticated: boolean;
  sellerId?: string; // Seller ID for pinning permissions
  newlyCreatedCommentIds?: Set<string>; // IDs of comments that were just created
}

export function CommentList({
  comments,
  loading,
  onUpdateComment,
  onDeleteComment,
  onReaction,
  onPinComment,
  onCreateReply,
  onLoadReplies,
  currentUserId,
  isAuthenticated,
  sellerId,
  newlyCreatedCommentIds = new Set(),
}: CommentListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onReaction={onReaction}
          onPinComment={onPinComment}
          onCreateReply={onCreateReply}
          onLoadReplies={onLoadReplies}
          currentUserId={currentUserId}
          isAuthenticated={isAuthenticated}
          isSeller={currentUserId === sellerId}
          isNewlyCreated={newlyCreatedCommentIds.has(comment.id)}
        />
      ))}
    </div>
  );
}
