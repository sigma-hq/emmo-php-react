import { useState } from 'react';
import { MessageSquare, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { router, usePage } from '@inertiajs/react';

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

interface HandoutCommentProps {
    comment: Comment;
    currentUserId: number;
    onCommentUpdated: (commentId: number, newContent: string) => void;
    onCommentDeleted: (commentId: number) => void;
}

export default function HandoutComment({ comment, currentUserId, onCommentUpdated, onCommentDeleted }: HandoutCommentProps) {
    const { csrf_token } = usePage().props as { csrf_token: string };
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canManageComment = comment.user.id === currentUserId;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditContent(comment.content);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditContent(comment.content);
    };

    const handleSave = async () => {
        if (!editContent.trim()) return;
        
        setIsSubmitting(true);
        try {
            const response = await fetch(`/handout-comments/${comment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf_token,
                },
                body: JSON.stringify({ content: editContent }),
            });

            if (response.ok) {
                const result = await response.json();
                onCommentUpdated(comment.id, editContent);
                setIsEditing(false);
            } else {
                console.error('Failed to update comment');
            }
        } catch (error) {
            console.error('Error updating comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        
        try {
            const response = await fetch(`/handout-comments/${comment.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrf_token,
                },
            });

            if (response.ok) {
                onCommentDeleted(comment.id);
            } else {
                console.error('Failed to delete comment');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    if (isEditing) {
        return (
            <div className="border-l-4 border-blue-200 pl-4 py-3 bg-blue-50 rounded-r-lg">
                <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                                {comment.user.name}
                            </Badge>
                            <span className="text-xs text-gray-500">
                                {formatDate(comment.updated_at)}
                            </span>
                        </div>
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="Write your comment..."
                            className="min-h-[80px] resize-none"
                            maxLength={1000}
                        />
                        <div className="flex items-center gap-2 mt-2">
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSubmitting || !editContent.trim()}
                                className="h-8 px-3"
                            >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="h-8 px-3"
                            >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border-l-4 border-gray-200 pl-4 py-3 hover:border-gray-300 transition-colors">
            <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {comment.user.name}
                            </Badge>
                            <span className="text-xs text-gray-500">
                                {formatDate(comment.created_at)}
                                {comment.updated_at !== comment.created_at && ' (edited)'}
                            </span>
                        </div>
                        {canManageComment && (
                            <div className="flex items-center gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleEdit}
                                    className="h-6 w-6 p-0 hover:bg-gray-100"
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleDelete}
                                    className="h-6 w-6 p-0 hover:bg-gray-100 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
            </div>
        </div>
    );
}
