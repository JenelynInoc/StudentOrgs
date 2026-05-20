<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\OrganizationMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('member');

        // Fetch announcements from organizations where the user is an approved member
        $myOrgIds = OrganizationMember::where('user_id', $user->id)
            ->where('status', 'approved')
            ->pluck('organization_id');

        $announcements = Announcement::whereIn('organization_id', $myOrgIds)
            ->with(['organization', 'creator'])
            ->orderBy('is_pinned', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Announcements retrieved successfully',
            'data' => $announcements,
        ]);
    }

    public function show(string $id, Request $request): JsonResponse
    {
        $user = $request->user('member');
        $announcement = Announcement::with(['organization', 'creator'])->findOrFail($id);

        // Check if user is approved member of this organization
        $isMember = OrganizationMember::where('user_id', $user->id)
            ->where('organization_id', $announcement->organization_id)
            ->where('status', 'approved')
            ->exists();

        if (!$isMember) {
            return response()->json([
                'message' => 'You must be a member of the organization to view this announcement'
            ], 403);
        }

        return response()->json([
            'message' => 'Announcement retrieved successfully',
            'data' => $announcement,
        ]);
    }
}
