<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Announcement::with(['organization', 'creator']);

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('title', 'like', "%{$search}%")
                ->orWhere('body', 'like', "%{$search}%");
        }

        if ($request->has('organization_id')) {
            $query->where('organization_id', $request->input('organization_id'));
        }

        $perPage = (int) $request->input('per_page', 15);
        $announcements = $query->paginate($perPage);

        return response()->json([
            'message' => 'Announcements retrieved successfully',
            'data' => $announcements->items(),
            'meta' => [
                'pagination' => [
                    'total' => $announcements->total(),
                    'per_page' => $announcements->perPage(),
                    'current_page' => $announcements->currentPage(),
                    'last_page' => $announcements->lastPage(),
                ],
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'is_pinned' => 'sometimes|boolean',
        ]);

        $validated['created_by'] = $request->user('admin')->id;

        $announcement = Announcement::create($validated);

        return response()->json([
            'message' => 'Announcement created successfully',
            'data' => $announcement,
        ], 201);
    }

    public function update(string $id, Request $request): JsonResponse
    {
        $announcement = Announcement::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'body' => 'sometimes|string',
            'is_pinned' => 'sometimes|boolean',
        ]);

        $announcement->update($validated);

        return response()->json([
            'message' => 'Announcement updated successfully',
            'data' => $announcement,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted successfully']);
    }
}
