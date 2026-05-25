<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OrganizationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Organization::where('status', 'active');

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $organizations = $query->get();

        return response()->json([
            'message' => 'Organizations retrieved successfully',
            'data' => $organizations,
        ]);
    }

    public function mine(Request $request): JsonResponse
    {
        $user = $request->user('member');

        $memberships = OrganizationMember::where('user_id', $user->id)
            ->whereHas('organization')
            ->with(['organization'])
            ->get();

        return response()->json([
            'message' => 'Your organizations retrieved successfully',
            'data' => $memberships,
        ]);
    }

    public function show(string $id, Request $request): JsonResponse
    {
        $organization = Organization::where('status', 'active')
            ->findOrFail($id);

        $user = $request->user('member');
        $membership = OrganizationMember::where('user_id', $user->id)
            ->where('organization_id', $id)
            ->first();

        return response()->json([
            'message' => 'Organization retrieved successfully',
            'data' => [
                'organization' => $organization,
                'membership_status' => $membership ? $membership->status : null,
                'joined_at' => $membership ? $membership->joined_at : null,
            ],
        ]);
    }

    public function join(string $id, Request $request): JsonResponse
    {
        $user = $request->user('member');
        $organization = Organization::where('status', 'active')->findOrFail($id);

        // Check if user is already a member
        $existing = OrganizationMember::where('user_id', $user->id)
            ->where('organization_id', $id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You have already requested or joined this organization',
                'data' => $existing,
            ], Response::HTTP_BAD_REQUEST);
        }

        $member = OrganizationMember::create([
            'user_id' => $user->id,
            'organization_id' => $id,
            'status' => 'pending',
            'joined_at' => null,
        ]);

        return response()->json([
            'message' => 'Join request submitted successfully',
            'data' => $member,
        ], Response::HTTP_CREATED);
    }
}
