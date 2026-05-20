<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use App\Models\Event;
use App\Models\Category;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function index(Request $request)
    {
        $query = Organization::with('category')->withCount(['memberships' => function ($q) {
            $q->where('status', 'approved');
        }]);

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('acronym', 'like', "%{$search}%");
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:organizations',
            'acronym' => 'required|string|max:20|unique:organizations',
            'description' => 'required|string',
            'logo_path' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        $organization = Organization::create($validated);

        return response()->json($organization, 201);
    }

    public function show($id)
    {
        $organization = Organization::with(['category'])->findOrFail($id);
        
        // Members count
        $membersCount = $organization->memberships()->where('status', 'approved')->count();

        // Get members list
        $members = $organization->memberships()
            ->with('user')
            ->where('status', 'approved')
            ->get();

        // Get pending requests (visible only to admin or officers of this org)
        $pendingMembers = [];
        $user = auth('sanctum')->user();
        $isOfficerOrAdmin = false;

        if ($user) {
            $isOfficerOrAdmin = $user->role === 'admin' || 
                $organization->memberships()
                    ->where('user_id', $user->id)
                    ->where('role', 'officer')
                    ->where('status', 'approved')
                    ->exists();

            if ($isOfficerOrAdmin) {
                $pendingMembers = $organization->memberships()
                    ->with('user')
                    ->where('status', 'pending')
                    ->get();
            }
        }

        // Get events
        $events = $organization->events()->orderBy('start_time', 'desc')->get();

        // Get announcements
        $announcements = $organization->announcements()->with('author')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'organization' => $organization,
            'members_count' => $membersCount,
            'members' => $members,
            'pending_members' => $pendingMembers,
            'events' => $events,
            'announcements' => $announcements,
            'is_officer_or_admin' => $isOfficerOrAdmin
        ]);
    }

    public function update(Request $request, Organization $organization)
    {
        $user = $request->user();
        
        // Check permission (Admin or Officer of this organization)
        $isOfficer = $organization->memberships()
            ->where('user_id', $user->id)
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        if ($user->role !== 'admin' && !$isOfficer) {
            return response()->json(['message' => 'Unauthorized. Only admins or organization officers can update this profile.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:organizations,name,' . $organization->id,
            'acronym' => 'required|string|max:20|unique:organizations,acronym,' . $organization->id,
            'description' => 'required|string',
            'logo_path' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        $organization->update($validated);

        return response()->json($organization);
    }

    public function destroy(Organization $organization)
    {
        $organization->delete();

        return response()->json(['message' => 'Organization deleted successfully.']);
    }

    public function getDashboardStats(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            return response()->json([
                'total_users' => User::count(),
                'total_organizations' => Organization::count(),
                'total_categories' => Category::count(),
                'total_events' => Event::count(),
                'upcoming_events' => Event::where('start_time', '>=', now())->orderBy('start_time', 'asc')->take(5)->get(),
                'organization_stats' => Organization::withCount(['memberships' => function($q) {
                    $q->where('status', 'approved');
                }])->get(['name', 'acronym']),
            ]);
        } 
        
        if ($user->role === 'officer') {
            // Find all organizations where this user is an officer
            $myOrgIds = $user->memberships()
                ->where('role', 'officer')
                ->where('status', 'approved')
                ->pluck('organization_id');

            $myOrganizations = Organization::whereIn('id', $myOrgIds)->get(['id', 'name', 'acronym']);

            if ($myOrganizations->isEmpty()) {
                return response()->json(['message' => 'No active officer assignment found.'], 404);
            }

            // Determine which organization to show
            $orgId = $request->query('organization_id');
            if (!$orgId || !$myOrgIds->contains($orgId)) {
                $orgId = $myOrgIds->first();
            }

            $org = Organization::with('category')->find($orgId);

            return response()->json([
                'organization' => $org,
                'my_organizations' => $myOrganizations,
                'total_members' => $org->memberships()->where('status', 'approved')->count(),
                'pending_requests' => $org->memberships()->where('status', 'pending')->count(),
                'total_events' => $org->events()->count(),
                'upcoming_events' => $org->events()->where('start_time', '>=', now())->orderBy('start_time', 'asc')->take(5)->get(),
                'total_announcements' => $org->announcements()->count(),
            ]);
        }

        // Student stats
        $myMembershipsCount = $user->memberships()->where('status', 'approved')->count();
        $pendingMembershipsCount = $user->memberships()->where('status', 'pending')->count();
        
        // Find events in organizations the student belongs to
        $myOrgIds = $user->memberships()->where('status', 'approved')->pluck('organization_id');
        
        $upcomingEvents = Event::whereIn('organization_id', $myOrgIds)
            ->where('start_time', '>=', now())
            ->orderBy('start_time', 'asc')
            ->take(5)
            ->get();

        return response()->json([
            'my_memberships_count' => $myMembershipsCount,
            'pending_memberships_count' => $pendingMembershipsCount,
            'upcoming_events' => $upcomingEvents,
            'total_organizations' => Organization::where('status', 'active')->count(),
        ]);
    }
}
