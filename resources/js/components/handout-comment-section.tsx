import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import HandoutComment from './handout-comment';
import { usePage } from '@inertiajs/react';

interface Comment {
    id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
    };
}

interface HandoutCommentSectionProps {
    noteId: number;
    comments: Comment[];
    currentUserId: number;
    onCommentAdded: (comment: Comment) => void;
    onCommentUpdated: (commentId: number, newContent: string) => void;
    onCommentDeleted: (commentId: number) => void;
}

export default function HandoutCommentSection({ 
    noteId, 
    comments, 
    currentUserId, 
    onCommentAdded, 
    onCommentUpdated, 
    onCommentDeleted 
}: HandoutCommentSectionProps) {
    const { csrf_token } = usePage().props as { csrf_token: string };
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitComment = async () => {
        if (!newComment.trim() || isSubmitting) return;
        
        setIsSubmitting(true);
        
        // Get CSRF token from Inertia props
        if (!csrf_token) {
            console.error('CSRF token not found in Inertia props');
            setIsSubmitting(false);
            return;
        }
        
        try {
            console.log('Submitting comment:', { noteId, content: newComment, csrf_token });
            
            const response = await fetch(`/handout-notes/${noteId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf_token,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ content: newComment }),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                const result = await response.json();
                console.log('Comment added successfully:', result);
                onCommentAdded(result.comment);
                setNewComment('');
            } else {
                const errorText = await response.text();
                console.error('Failed to add comment:', response.status, errorText);
                
                // Try to parse as JSON for more detailed error info
                try {
                    const errorJson = JSON.parse(errorText);
                    console.error('Error details:', errorJson);
                } catch (e) {
                    console.error('Raw error response:', errorText);
                }
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitComment();
        }
    };

    return (
        <div className="mt-6 border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Comments</h4>
                <Badge variant="secondary" className="ml-auto">
                    {comments.length}
                </Badge>
            </div>

            {/* Add new comment */}
            <div className="mb-6">
                <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="min-h-[80px] resize-none"
                            maxLength={1000}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                                {newComment.length}/1000 characters
                            </span>
                            <Button
                                size="sm"
                                onClick={handleSubmitComment}
                                disabled={isSubmitting || !newComment.trim()}
                                className="h-8 px-3"
                            >
                                <Send className="h-3 w-3 mr-1" />
                                Post Comment
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments list */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <HandoutComment
                            key={comment.id}
                            comment={comment}
                            currentUserId={currentUserId}
                            onCommentUpdated={onCommentUpdated}
                            onCommentDeleted={onCommentDeleted}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
