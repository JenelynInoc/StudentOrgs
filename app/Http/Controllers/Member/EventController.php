<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\OrganizationMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('member');
        $query = Event::where('status', '!=', 'cancelled')->with('organization');

        if ($request->has('mine') && $request->input('mine') == 'true') {
            $myOrgIds = OrganizationMember::where('user_id', $user->id)
                ->where('status', 'approved')
                ->pluck('organization_id');
            $query->whereIn('organization_id', $myOrgIds);
        }

        $events = $query->orderBy('start_at', 'asc')->get();

        return response()->json([
            'message' => 'Events retrieved successfully',
            'data' => $events,
        ]);
    }

    public function show(string $id, Request $request): JsonResponse
    {
        $event = Event::with('organization')->findOrFail($id);
        $user = $request->user('member');

        $attendance = Attendance::where('event_id', $id)
            ->where('user_id', $user->id)
            ->first();

        return response()->json([
            'message' => 'Event retrieved successfully',
            'data' => [
                'event' => $event,
                'attendance' => $attendance,
            ],
        ]);
    }

    public function checkin(string $id, Request $request): JsonResponse
    {
        $event = Event::findOrFail($id);

        if ($event->status === 'cancelled') {
            return response()->json([
                'message' => 'This event has been cancelled'
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($event->status === 'completed') {
            return response()->json([
                'message' => 'This event has already ended'
            ], Response::HTTP_BAD_REQUEST);
        }

        $user = $request->user('member');

        // Check if user is approved member of the organization
        $isMember = OrganizationMember::where('user_id', $user->id)
            ->where('organization_id', $event->organization_id)
            ->where('status', 'approved')
            ->exists();

        if (!$isMember) {
            return response()->json([
                'message' => 'You must be an approved member of the organization to check in'
            ], Response::HTTP_FORBIDDEN);
        }

        // Check if already checked in
        $existing = Attendance::where('event_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You have already checked in to this event'
            ], Response::HTTP_CONFLICT);
        }

        $attendance = Attendance::create([
            'event_id' => $id,
            'user_id' => $user->id,
            'checked_in_at' => now(),
            'method' => 'self',
        ]);

        return response()->json([
            'message' => 'Attendance confirmed successfully!',
            'data' => $attendance,
        ]);
    }
}
