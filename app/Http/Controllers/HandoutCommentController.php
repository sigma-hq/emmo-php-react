<?php

namespace App\Http\Controllers;

use App\Models\HandoutComment;
use App\Models\HandoutNote;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class HandoutCommentController extends Controller
{
    public function store(Request $request, HandoutNote $handoutNote): JsonResponse
    {
        \Log::info('HandoutCommentController::store called', [
            'request_data' => $request->all(),
            'handout_note_id' => $handoutNote->id,
            'user_id' => auth()->id(),
        ]);

        $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        try {
            $comment = $handoutNote->comments()->create([
                'content' => $request->content,
                'user_id' => auth()->id(),
            ]);

            // Load the user relationship for the response
            $comment->load('user:id,name');

            \Log::info('Comment created successfully', ['comment_id' => $comment->id]);

            return response()->json([
                'comment' => $comment,
                'message' => 'Comment added successfully.'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to create comment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to create comment: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, HandoutComment $comment): JsonResponse
    {
        // Ensure user can only update their own comments
        if ($comment->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $comment->update([
            'content' => $request->content,
        ]);

        return response()->json([
            'comment' => $comment,
            'message' => 'Comment updated successfully.'
        ]);
    }

    public function destroy(HandoutComment $comment): JsonResponse
    {
        // Ensure user can only delete their own comments
        if ($comment->user_id !== auth()->id()) {
            abort(403);
        }

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully.'
        ]);
    }
}
