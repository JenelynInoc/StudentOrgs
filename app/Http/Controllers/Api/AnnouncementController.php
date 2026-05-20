<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Membership;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $query = Announcement::with(['organization', 'author']);

        if ($request->has('organization_id')) {
            $query->where('organization_id', $request->organization_id);
        } else {
            // If viewing all, limit to organizations where the user is a member, 
            // or just list all active ones if not specified.
            $user = auth('sanctum')->user();
            if ($user && $user->role !== 'admin') {
                $myOrgIds = $user->memberships()->where('status', 'approved')->pluck('organization_id');
                $query->whereIn('organization_id', $myOrgIds);
            }
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $user = $request->user();

        // Check if officer of organization or admin
        $isOfficer = Membership::where('user_id', $user->id)
            ->where('organization_id', $validated['organization_id'])
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        if ($user->role !== 'admin' && !$isOfficer) {
            return response()->json(['message' => 'Unauthorized. Only officers or administrators can create announcements.'], 403);
        }

        $announcement = Announcement::create([
            'organization_id' => $validated['organization_id'],
            'title' => $validated['title'],
            'content' => $validated['content'],
            'posted_by' => $user->id,
        ]);

        return response()->json($announcement->load('author'), 201);
    }

    public function show(Announcement $announcement)
    {
        return response()->json($announcement->load(['organization', 'author']));
    }

    public function update(Request $request, Announcement $announcement)
    {
        $user = $request->user();

        // Check if officer of organization or admin
        $isOfficer = Membership::where('user_id', $user->id)
            ->where('organization_id', $announcement->organization_id)
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        if ($user->role !== 'admin' && !$isOfficer) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $announcement->update($validated);

        return response()->json($announcement->load('author'));
    }

    public function destroy(Announcement $announcement)
    {
        $user = auth()->user();

        // Check if officer of organization or admin
        $isOfficer = Membership::where('user_id', $user->id)
            ->where('organization_id', $announcement->organization_id)
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        if ($user->role !== 'admin' && !$isOfficer) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted successfully.']);
    }
}
