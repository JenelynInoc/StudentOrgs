<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Event::with(['organization', 'creator']);

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('organization_id')) {
            $query->where('organization_id', $request->input('organization_id'));
        }

        $perPage = (int) $request->input('per_page', 15);
        $events = $query->paginate($perPage);

        return response()->json([
            'message' => 'Events retrieved successfully',
            'data' => $events->items(),
            'meta' => [
                'pagination' => [
                    'total' => $events->total(),
                    'per_page' => $events->perPage(),
                    'current_page' => $events->currentPage(),
                    'last_page' => $events->lastPage(),
                ],
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_at' => 'required|date',
            'end_at' => 'required|date|after:start_at',
            'venue' => 'nullable|string|max:255',
            'status' => 'required|in:upcoming,ongoing,completed,cancelled',
        ]);

        $validated['created_by'] = $request->user('admin')->id;
        
        do {
            $qrToken = strtoupper(\Str::random(6));
        } while (Event::where('qr_token', $qrToken)->exists());
        
        $validated['qr_token'] = $qrToken;

        $event = Event::create($validated);

        \App\Models\ActivityLog::create([
            'action' => 'create_event',
            'model_type' => get_class($event),
            'model_id' => $event->id,
            'user_id' => null,
            'properties' => ['title' => $event->title, 'organization_id' => $event->organization_id],
        ]);

        return response()->json([
            'message' => 'Event created successfully',
            'data' => $event,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $event = Event::with(['organization', 'creator', 'attendance'])->findOrFail($id);

        return response()->json([
            'message' => 'Event retrieved successfully',
            'data' => $event,
        ]);
    }

    public function update(string $id, Request $request): JsonResponse
    {
        $event = Event::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'start_at' => 'sometimes|date',
            'end_at' => 'sometimes|date|after:start_at',
            'venue' => 'nullable|string|max:255',
            'status' => 'sometimes|in:upcoming,ongoing,completed,cancelled',
        ]);

        $event->update($validated);

        return response()->json([
            'message' => 'Event updated successfully',
            'data' => $event,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $event = Event::findOrFail($id);
        $event->delete();

        \App\Models\ActivityLog::create([
            'action' => 'delete_event',
            'model_type' => get_class($event),
            'model_id' => $event->id,
            'user_id' => null,
            'properties' => ['title' => $event->title],
        ]);

        return response()->json(['message' => 'Event deleted successfully']);
    }

    public function attendance(string $id): JsonResponse
    {
        $event = Event::findOrFail($id);
        $attendance = Attendance::where('event_id', $id)
            ->with('user')
            ->get();

        return response()->json([
            'message' => 'Event attendance retrieved successfully',
            'data' => $attendance,
            'meta' => [
                'total' => $attendance->count(),
                'checked_in' => $attendance->whereNotNull('checked_in_at')->count(),
            ],
        ]);
    }

    public function manualCheckin(string $id, Request $request): JsonResponse
    {
        $event = Event::findOrFail($id);

        $validated = $request->validate([
            'student_id' => 'required|string',
        ]);

        $user = \App\Models\User::where('student_id', $validated['student_id'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'User with this student ID not found.'
            ], 422);
        }

        // Check if user is an approved member of the event's organization
        $isMember = \App\Models\OrganizationMember::where('user_id', $user->id)
            ->where('organization_id', $event->organization_id)
            ->where('status', 'approved')
            ->exists();

        if (!$isMember) {
            return response()->json([
                'message' => 'Student is not an approved member of this organization.'
            ], 422);
        }

        $attendance = Attendance::updateOrCreate(
            [
                'event_id' => $event->id,
                'user_id' => $user->id,
            ],
            [
                'checked_in_at' => now(),
                'method' => 'manual',
            ]
        );

        \App\Models\ActivityLog::create([
            'action' => 'manual_checkin',
            'model_type' => get_class($attendance),
            'model_id' => $attendance->id,
            'user_id' => null,
            'properties' => ['event_id' => $event->id, 'student_id' => $user->student_id],
        ]);

        return response()->json([
            'message' => 'Attendance registered successfully',
            'data' => $attendance->load('user'),
        ]);
    }

    public function removeAttendance(string $id, string $attendanceId): JsonResponse
    {
        $attendance = Attendance::where('event_id', $id)->findOrFail($attendanceId);
        $attendance->delete();

        return response()->json([
            'message' => 'Attendance record removed successfully',
        ]);
    }
}
