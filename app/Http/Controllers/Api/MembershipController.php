<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;

class MembershipController extends Controller
{
    public function joinRequest(Request $request)
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
        ]);

        $user = $request->user();

        // Check if membership already exists
        $existing = Membership::where('user_id', $user->id)
            ->where('organization_id', $validated['organization_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You already have a request or active membership with this organization.',
                'status' => $existing->status
            ], 422);
        }

        $membership = Membership::create([
            'user_id' => $user->id,
            'organization_id' => $validated['organization_id'],
            'role' => 'member',
            'status' => 'pending',
        ]);

        return response()->json($membership, 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $membership = Membership::findOrFail($id);
        $user = $request->user();

        // Check permissions (Admin or Officer of this organization)
        $isOfficer = Membership::where('user_id', $user->id)
            ->where('organization_id', $membership->organization_id)
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        if ($user->role !== 'admin' && !$isOfficer) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:approved,rejected,pending',
        ]);

        $membership->update([
            'status' => $validated['status']
        ]);

        // If approved and status was rejected previously, make sure role is member
        // Also if we reject, we keep the membership record but status is rejected.
        
        return response()->json($membership->load('user'));
    }

    public function assignRole(Request $request, $id)
    {
        $membership = Membership::findOrFail($id);
        $user = $request->user();

        // Check permissions (Admin or Officer of this organization)
        $isOfficer = Membership::where('user_id', $user->id)
            ->where('organization_id', $membership->organization_id)
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        if ($user->role !== 'admin' && !$isOfficer) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'role' => 'required|string|in:member,officer',
            'officer_title' => 'nullable|string|max:100',
        ]);

        $membership->update([
            'role' => $validated['role'],
            'officer_title' => $validated['role'] === 'officer' ? ($validated['officer_title'] ?? 'Officer') : null,
        ]);

        // Elevate user system role to 'officer' if they are assigned as officer,
        // but only if their system role is currently 'student'.
        $memberUser = $membership->user;
        if ($validated['role'] === 'officer' && $memberUser->role === 'student') {
            $memberUser->update(['role' => 'officer']);
        }

        return response()->json($membership->load('user'));
    }

    public function destroy(Request $request, $id)
    {
        $membership = Membership::findOrFail($id);
        $user = $request->user();

        // Admin, Officer of the org, or the member themselves can leave/remove
        $isOfficer = Membership::where('user_id', $user->id)
            ->where('organization_id', $membership->organization_id)
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        $isSelf = $user->id === $membership->user_id;

        if ($user->role !== 'admin' && !$isOfficer && !$isSelf) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // If the officer is leaving, check if they are the only officer
        if ($membership->role === 'officer' && $isSelf) {
            $officersCount = Membership::where('organization_id', $membership->organization_id)
                ->where('role', 'officer')
                ->where('status', 'approved')
                ->count();
            if ($officersCount <= 1) {
                return response()->json([
                    'message' => 'You cannot leave the organization because you are the only officer. Please assign another officer first.'
                ], 422);
            }
        }

        $membership->delete();

        // If system role of user was 'officer', check if they are still an officer in any other organization.
        // If not, demote them to 'student'
        $memberUser = $membership->user;
        if ($memberUser->role === 'officer') {
            $hasOtherOfficerRole = Membership::where('user_id', $memberUser->id)
                ->where('role', 'officer')
                ->where('status', 'approved')
                ->exists();
            if (!$hasOtherOfficerRole) {
                $memberUser->update(['role' => 'student']);
            }
        }

        return response()->json(['message' => 'Member removed/left successfully.']);
    }

    public function myMemberships(Request $request)
    {
        $memberships = Membership::with('organization.category')
            ->where('user_id', $request->user()->id)
            ->get();
        return response()->json($memberships);
    }

    public function generateReport(Request $request, $organizationId)
    {
        $user = $request->user();
        $organization = Organization::findOrFail($organizationId);

        // Verify authorization
        $isOfficer = Membership::where('user_id', $user->id)
            ->where('organization_id', $organizationId)
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        if ($user->role !== 'admin' && !$isOfficer) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $members = Membership::with('user')
            ->where('organization_id', $organizationId)
            ->where('status', 'approved')
            ->get()
            ->map(function ($m) {
                return [
                    'student_id' => $m->user->student_id ?? 'N/A',
                    'name' => $m->user->name,
                    'email' => $m->user->email,
                    'role_in_org' => $m->role,
                    'officer_title' => $m->officer_title ?? 'N/A',
                    'joined_at' => $m->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'organization_name' => $organization->name,
            'acronym' => $organization->acronym,
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'total_members' => count($members),
            'members' => $members
        ]);
    }
}
