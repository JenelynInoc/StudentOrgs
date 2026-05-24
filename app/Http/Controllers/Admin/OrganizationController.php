<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrganizationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Organization::with(['department'])->withCount([
            'members as approved_members_count' => function ($query) {
                $query->where('organization_members.status', 'approved');
            },
            'members as pending_members_count' => function ($query) {
                $query->where('organization_members.status', 'pending');
            }
        ]);

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $perPage = (int) $request->input('per_page', 15);
        $organizations = $query->paginate($perPage);

        return response()->json([
            'message' => 'Organizations retrieved successfully',
            'data' => $organizations->items(),
            'meta' => [
                'pagination' => [
                    'total' => $organizations->total(),
                    'per_page' => $organizations->perPage(),
                    'current_page' => $organizations->currentPage(),
                    'last_page' => $organizations->lastPage(),
                ],
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'status' => 'required|in:active,inactive',
        ]);

        $organization = Organization::create($validated);

        \App\Models\ActivityLog::create([
            'action' => 'create_organization',
            'model_type' => get_class($organization),
            'model_id' => $organization->id,
            'user_id' => null,
            'properties' => ['name' => $organization->name],
        ]);

        return response()->json([
            'message' => 'Organization created successfully',
            'data' => $organization,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $organization = Organization::with(['members', 'events', 'announcements'])->findOrFail($id);

        return response()->json([
            'message' => 'Organization retrieved successfully',
            'data' => $organization,
        ]);
    }

    public function update(string $id, Request $request): JsonResponse
    {
        $organization = Organization::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'status' => 'sometimes|in:active,inactive',
            'logo' => 'nullable|string',
        ]);

        $organization->update($validated);

        return response()->json([
            'message' => 'Organization updated successfully',
            'data' => $organization,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $organization = Organization::findOrFail($id);
        $organization->delete();

        \App\Models\ActivityLog::create([
            'action' => 'delete_organization',
            'model_type' => get_class($organization),
            'model_id' => $organization->id,
            'user_id' => null,
            'properties' => ['name' => $organization->name],
        ]);

        return response()->json(['message' => 'Organization deleted successfully']);
    }

    public function approveMember(string $organizationId, string $userId): JsonResponse
    {
        $organization = Organization::findOrFail($organizationId);
        $member = OrganizationMember::where('organization_id', $organizationId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $member->update([
            'status' => 'approved',
            'joined_at' => now(),
        ]);

        \App\Models\ActivityLog::create([
            'action' => 'approve_membership',
            'model_type' => get_class($member),
            'model_id' => $member->id,
            'user_id' => null, // Admins aren't in the users table, so this remains null
            'properties' => [
                'organization_id' => $organizationId,
                'target_user_id' => $userId,
            ],
        ]);

        return response()->json([
            'message' => 'Member approved successfully',
            'data' => $member,
        ]);
    }

    public function departments(): JsonResponse
    {
        $departments = \App\Models\Department::all();
        return response()->json([
            'message' => 'Departments retrieved successfully',
            'data' => $departments,
        ]);
    }

    public function removeMember(string $organizationId, string $userId): JsonResponse
    {
        $organization = Organization::findOrFail($organizationId);
        $member = OrganizationMember::where('organization_id', $organizationId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $member->delete();

        return response()->json([
            'message' => 'Member removed from organization successfully',
        ]);
    }
}
