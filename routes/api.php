<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\OrganizationController as AdminOrganizationController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\AnnouncementController as AdminAnnouncementController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;

use App\Http\Controllers\Member\AuthController as MemberAuthController;
use App\Http\Controllers\Member\ProfileController as MemberProfileController;
use App\Http\Controllers\Member\OrganizationController as MemberOrganizationController;
use App\Http\Controllers\Member\EventController as MemberEventController;
use App\Http\Controllers\Member\AnnouncementController as MemberAnnouncementController;
use App\Http\Controllers\Member\NotificationController as MemberNotificationController;

use Illuminate\Support\Facades\Route;

// ==================== ADMIN PORTAL ====================

// Admin Public Auth (no middleware)
Route::post('/admin/login', [AdminAuthController::class, 'login']);

// Admin Protected Routes
Route::middleware(['auth:sanctum', 'admin.guard'])->group(function () {
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    Route::get('/admin/me', [AdminAuthController::class, 'me']);

    // Admin: Users
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::get('/admin/users/{id}', [AdminUserController::class, 'show']);
    Route::patch('/admin/users/{id}/suspend', [AdminUserController::class, 'suspend']);
    Route::patch('/admin/users/{id}/restore', [AdminUserController::class, 'restore']);
    Route::delete('/admin/users/{id}', [AdminUserController::class, 'destroy']);

    // Admin: Organizations
    Route::get('/admin/departments', [AdminOrganizationController::class, 'departments']);
    Route::get('/admin/organizations', [AdminOrganizationController::class, 'index']);
    Route::post('/admin/organizations', [AdminOrganizationController::class, 'store']);
    Route::get('/admin/organizations/{id}', [AdminOrganizationController::class, 'show']);
    Route::put('/admin/organizations/{id}', [AdminOrganizationController::class, 'update']);
    Route::delete('/admin/organizations/{id}', [AdminOrganizationController::class, 'destroy']);
    Route::post('/admin/organizations/{id}/approve-member/{userId}', [AdminOrganizationController::class, 'approveMember']);
    Route::delete('/admin/organizations/{id}/remove-member/{userId}', [AdminOrganizationController::class, 'removeMember']);

    // Admin: Events
    Route::get('/admin/events', [AdminEventController::class, 'index']);
    Route::post('/admin/events', [AdminEventController::class, 'store']);
    Route::get('/admin/events/{id}', [AdminEventController::class, 'show']);
    Route::put('/admin/events/{id}', [AdminEventController::class, 'update']);
    Route::delete('/admin/events/{id}', [AdminEventController::class, 'destroy']);
    Route::get('/admin/events/{id}/attendance', [AdminEventController::class, 'attendance']);
    Route::post('/admin/events/{id}/attendance', [AdminEventController::class, 'manualCheckin']);
    Route::delete('/admin/events/{id}/attendance/{attendanceId}', [AdminEventController::class, 'removeAttendance']);

    // Admin: Announcements
    Route::get('/admin/announcements', [AdminAnnouncementController::class, 'index']);
    Route::post('/admin/announcements', [AdminAnnouncementController::class, 'store']);
    Route::put('/admin/announcements/{id}', [AdminAnnouncementController::class, 'update']);
    Route::delete('/admin/announcements/{id}', [AdminAnnouncementController::class, 'destroy']);

    // Admin: Reports
    Route::get('/admin/reports/overview', [AdminReportController::class, 'overview']);
    Route::get('/admin/reports/attendance', [AdminReportController::class, 'attendance']);
    Route::get('/admin/activity-logs', [AdminReportController::class, 'activityLogs']);
});

// ==================== MEMBER PORTAL ====================

// Member Public Auth (no middleware)
Route::post('/auth/register', [MemberAuthController::class, 'register']);
Route::post('/auth/login', [MemberAuthController::class, 'login']);
Route::post('/auth/forgot-password', [MemberAuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [MemberAuthController::class, 'resetPassword']);

// Member Protected Routes
Route::middleware(['auth:sanctum', 'member.guard'])->group(function () {
    Route::post('/member/logout', [MemberAuthController::class, 'logout']);
    Route::get('/member/me', [MemberAuthController::class, 'me']);

    // Member: Profile
    Route::get('/member/profile', [MemberProfileController::class, 'show']);
    Route::put('/member/profile', [MemberProfileController::class, 'update']);
    Route::post('/member/profile/avatar', [MemberProfileController::class, 'uploadAvatar']);

    // Member: Organizations
    Route::get('/member/organizations', [MemberOrganizationController::class, 'index']);
    Route::get('/member/organizations/mine', [MemberOrganizationController::class, 'mine']);
    Route::get('/member/organizations/{id}', [MemberOrganizationController::class, 'show']);
    Route::post('/member/organizations/{id}/join', [MemberOrganizationController::class, 'join']);

    // Member: Events
    Route::get('/member/events', [MemberEventController::class, 'index']);
    Route::get('/member/events/{id}', [MemberEventController::class, 'show']);
    Route::post('/member/events/{id}/checkin', [MemberEventController::class, 'checkin']);

    // Member: Announcements
    Route::get('/member/announcements', [MemberAnnouncementController::class, 'index']);
    Route::get('/member/announcements/{id}', [MemberAnnouncementController::class, 'show']);

    // Member: Notifications
    Route::get('/member/notifications', [MemberNotificationController::class, 'index']);
    Route::patch('/member/notifications/{id}/read', [MemberNotificationController::class, 'markAsRead']);
    Route::patch('/member/notifications/read-all', [MemberNotificationController::class, 'markAllAsRead']);
});
