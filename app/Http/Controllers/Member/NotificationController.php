<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('member');

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Notifications retrieved successfully',
            'data' => $notifications,
        ]);
    }

    public function markAsRead(string $id, Request $request): JsonResponse
    {
        $user = $request->user('member');
        $notification = Notification::where('user_id', $user->id)->findOrFail($id);

        $notification->update(['read' => true]);

        return response()->json([
            'message' => 'Notification marked as read',
            'data' => $notification,
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user('member');

        Notification::where('user_id', $user->id)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json([
            'message' => 'All notifications marked as read',
        ]);
    }
}
