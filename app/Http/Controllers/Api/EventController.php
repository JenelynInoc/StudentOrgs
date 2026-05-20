<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventParticipation;
use App\Models\Membership;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with('organization');

        if ($request->has('organization_id')) {
            $query->where('organization_id', $request->organization_id);
        }

        if ($request->has('upcoming')) {
            $query->where('start_time', '>=', now());
        }

        if ($request->has('past')) {
            $query->where('end_time', '<', now());
        }

        return response()->json($query->orderBy('start_time', 'asc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'status' => 'nullable|string|in:scheduled,cancelled,completed',
        ]);

        $user = $request->user();

        // Check if officer of organization or admin
        $isOfficer = Membership::where('user_id', $user->id)
            ->where('organization_id', $validated['organization_id'])
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        if ($user->role !== 'admin' && !$isOfficer) {
            return response()->json(['message' => 'Unauthorized. Only officers or administrators can create events.'], 403);
        }

        $event = Event::create($validated);

        return response()->json($event, 201);
    }

    public function show($id)
    {
        $event = Event::with('organization')->findOrFail($id);
        $user = auth('sanctum')->user();

        $myParticipation = null;
        if ($user) {
            $myParticipation = EventParticipation::where('event_id', $id)
                ->where('user_id', $user->id)
                ->first();
        }

        // Only officers or admin can see all participations
        $participations = [];
        $isOfficerOrAdmin = false;

        if ($user) {
            $isOfficerOrAdmin = $user->role === 'admin' ||
                Membership::where('user_id', $user->id)
                    ->where('organization_id', $event->organization_id)
                    ->where('role', 'officer')
                    ->where('status', 'approved')
                    ->exists();

            if ($isOfficerOrAdmin) {
                $participations = EventParticipation::with('user')
                    ->where('event_id', $id)
                    ->get();
            }
        }

        return response()->json([
            'event' => $event,
            'my_participation' => $myParticipation,
            'participations' => $participations,
            'is_officer_or_admin' => $isOfficerOrAdmin
        ]);
    }

    public function update(Request $request, Event $event)
    {
        $user = $request->user();

        // Check if officer of organization or admin
        $isOfficer = Membership::where('user_id', $user->id)
            ->where('organization_id', $event->organization_id)
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        if ($user->role !== 'admin' && !$isOfficer) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'status' => 'nullable|string|in:scheduled,cancelled,completed',
        ]);

        $event->update($validated);

        return response()->json($event);
    }

    public function destroy(Event $event)
    {
        $user = auth()->user();

        // Check if officer of organization or admin
        $isOfficer = Membership::where('user_id', $user->id)
            ->where('organization_id', $event->organization_id)
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        if ($user->role !== 'admin' && !$isOfficer) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted successfully.']);
    }

    public function rsvp(Request $request, $id)
    {
        $event = Event::findOrFail($id);
        $user = $request->user();

        // Check if user is approved member of the organization hosting the event (optional, but good for tracking)
        // For public school events, they might allow anyone, but let's check if they belong or just allow RSVP.
        // Let's allow any registered user to RSVP, but check if they are already registered.
        $participation = EventParticipation::where('event_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if ($participation) {
            // Toggle RSVP (if registered, delete or toggle. Let's toggle or set to absent/registered)
            // Let's delete it if they cancel, or update status. Let's allow unsubscribing
            $participation->delete();
            return response()->json(['message' => 'RSVP cancelled successfully.', 'status' => null]);
        }

        $participation = EventParticipation::create([
            'event_id' => $id,
            'user_id' => $user->id,
            'status' => 'registered',
        ]);

        return response()->json([
            'message' => 'RSVP registered successfully.',
            'status' => 'registered',
            'participation' => $participation
        ], 201);
    }

    public function updateAttendance(Request $request, $id)
    {
        $event = Event::findOrFail($id);
        $user = $request->user();

        // Check if officer of organization or admin
        $isOfficer = Membership::where('user_id', $user->id)
            ->where('organization_id', $event->organization_id)
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        if ($user->role !== 'admin' && !$isOfficer) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'status' => 'required|string|in:registered,attended,absent',
        ]);

        $participation = EventParticipation::updateOrCreate(
            ['event_id' => $id, 'user_id' => $validated['user_id']],
            ['status' => $validated['status']]
        );

        return response()->json($participation->load('user'));
    }

    public function generateReport(Request $request, $eventId)
    {
        $event = Event::with('organization')->findOrFail($eventId);
        $user = $request->user();

        // Check if officer of organization or admin
        $isOfficer = Membership::where('user_id', $user->id)
            ->where('organization_id', $event->organization_id)
            ->where('role', 'officer')
            ->where('status', 'approved')
            ->exists();

        if ($user->role !== 'admin' && !$isOfficer) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $participations = EventParticipation::with('user')
            ->where('event_id', $eventId)
            ->get()
            ->map(function ($p) {
                return [
                    'student_id' => $p->user->student_id ?? 'N/A',
                    'name' => $p->user->name,
                    'email' => $p->user->email,
                    'status' => $p->status,
                    'updated_at' => $p->updated_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'event_title' => $event->title,
            'organization_name' => $event->organization->name,
            'start_time' => $event->start_time->format('Y-m-d H:i:s'),
            'location' => $event->location,
            'total_rsvps' => count($participations),
            'total_attended' => $participations->where('status', 'attended')->count(),
            'participations' => $participations
        ]);
    }
}
