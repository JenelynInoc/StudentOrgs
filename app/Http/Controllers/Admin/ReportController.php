<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Organization;
use App\Models\Event;
use App\Models\Attendance;
use App\Models\ActivityLog;
use App\Models\OrganizationMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function overview(): JsonResponse
    {
        $totalUsers = User::count();
        $totalOrganizations = Organization::count();
        $totalEvents = Event::count();
        $pendingApprovals = OrganizationMember::where('status', 'pending')->count();
        $suspendedUsers = User::where('is_suspended', true)->count();

        // Events by status
        $eventsByStatus = Event::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Organizations by status
        $organizationsByStatus = Organization::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        return response()->json([
            'message' => 'Overview report retrieved successfully',
            'data' => [
                'total_users' => $totalUsers,
                'total_organizations' => $totalOrganizations,
                'total_events' => $totalEvents,
                'pending_approvals' => $pendingApprovals,
                'suspended_users' => $suspendedUsers,
                'events_by_status' => $eventsByStatus,
                'organizations_by_status' => $organizationsByStatus,
            ],
        ]);
    }

    public function attendance(Request $request): JsonResponse
    {
        $query = Attendance::with(['event', 'user']);

        if ($request->has('event_id')) {
            $query->where('event_id', $request->input('event_id'));
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $perPage = (int) $request->input('per_page', 15);
        $attendance = $query->paginate($perPage);

        $summary = [
            'total_records' => $attendance->total(),
            'checked_in' => Attendance::whereNotNull('checked_in_at')->count(),
            'not_checked_in' => Attendance::whereNull('checked_in_at')->count(),
            'qr_method' => Attendance::whereIn('method', ['qr', 'self'])->count(),
            'manual_method' => Attendance::where('method', 'manual')->count(),
        ];

        return response()->json([
            'message' => 'Attendance report retrieved successfully',
            'data' => $attendance->items(),
            'meta' => [
                'summary' => $summary,
                'pagination' => [
                    'total' => $attendance->total(),
                    'per_page' => $attendance->perPage(),
                    'current_page' => $attendance->currentPage(),
                    'last_page' => $attendance->lastPage(),
                ],
            ],
        ]);
    }

    public function activityLogs(Request $request): JsonResponse
    {
        $query = ActivityLog::with('user');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->has('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $perPage = (int) $request->input('per_page', 15);
        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'message' => 'Activity logs retrieved successfully',
            'data' => $logs->items(),
            'meta' => [
                'pagination' => [
                    'total' => $logs->total(),
                    'per_page' => $logs->perPage(),
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                ],
            ],
        ]);
    }

    public function clearActivityLogs(): JsonResponse
    {
        ActivityLog::truncate();

        return response()->json([
            'message' => 'All activity logs have been cleared successfully',
        ]);
    }
}
