import { apiClient } from '../lib/api';
import type {
  Comment,
  CommentsResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  AddReactionRequest,
  ReportCommentRequest,
  CommentQueryParams,
  ReportedCommentsResponse,
  ReportedCommentsQueryParams,
  ReviewReportRequest,
} from '../types/comment.types';

export class CommentService {
  // Create a new comment
  static async createComment(data: CreateCommentRequest): Promise<Comment> {
    const response = await apiClient.post<Comment>('/comments', data);
    return response;
  }

  // Get comments for a listing
  static async getCommentsByListing(
    listingId: string,
    params?: CommentQueryParams
  ): Promise<CommentsResponse> {
    const response = await apiClient.get<CommentsResponse>(`/comments/listing/${listingId}`, params);
    return response;
  }

  // Get replies for a comment
  static async getCommentReplies(
    commentId: string,
    params?: CommentQueryParams
  ): Promise<Comment[]> {
    const response = await apiClient.get<Comment[]>(`/comments/${commentId}/replies`, params);
    return response;
  }

  // Get a specific comment
  static async getComment(commentId: string): Promise<Comment> {
    const response = await apiClient.get<Comment>(`/comments/${commentId}`);
    return response;
  }

  // Update a comment
  static async updateComment(
    commentId: string,
    data: UpdateCommentRequest
  ): Promise<Comment> {
    const response = await apiClient.patch<Comment>(`/comments/${commentId}`, data);
    return response;
  }

  // Delete a comment
  static async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/comments/${commentId}`);
  }

  // Add or toggle a reaction
  static async addReaction(
    commentId: string,
    data: AddReactionRequest
  ): Promise<any> {
    const response = await apiClient.post<any>(`/comments/${commentId}/reactions`, data);
    return response;
  }

  // Remove a reaction
  static async removeReaction(commentId: string): Promise<void> {
    await apiClient.delete(`/comments/${commentId}/reactions`);
  }

  // Report a comment
  static async reportComment(
    commentId: string,
    data: ReportCommentRequest
  ): Promise<any> {
    const response = await apiClient.post<any>(`/comments/${commentId}/report`, data);
    return response;
  }

  // Pin a comment (seller only)
  static async pinComment(commentId: string): Promise<void> {
    await apiClient.put(`/comments/${commentId}/pin`);
  }

  // Unpin a comment (seller only)
  static async unpinComment(commentId: string): Promise<void> {
    await apiClient.delete(`/comments/${commentId}/pin`);
  }

  // Admin: Get reported comments
  static async getReportedComments(
    params?: ReportedCommentsQueryParams
  ): Promise<ReportedCommentsResponse> {
    const response = await apiClient.get<ReportedCommentsResponse>('/comments/admin/reports', params);
    return response;
  }

  // Admin: Review a report
  static async reviewReport(
    reportId: string,
    data: ReviewReportRequest
  ): Promise<any> {
    const response = await apiClient.put<any>(`/comments/admin/reports/${reportId}/review`, data);
    return response;
  }
}
