<?php

use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\MembershipController;
use App\Http\Controllers\Api\OrganizationController;
use Illuminate\Support\Facades\Route;

// Public Auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Current user endpoints
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/dashboard-stats', [OrganizationController::class, 'getDashboardStats']);

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::middleware('role:admin')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        // Admin user management
        Route::get('/users', [AuthController::class, 'allUsers']);
        Route::put('/users/{id}/role', [AuthController::class, 'updateUserRole']);
        Route::delete('/users/{id}', [AuthController::class, 'deleteUser']);
    });

    // Organizations
    Route::get('/organizations', [OrganizationController::class, 'index']);
    Route::get('/organizations/{organization}', [OrganizationController::class, 'show']);
    Route::middleware('role:admin')->group(function () {
        Route::post('/organizations', [OrganizationController::class, 'store']);
        Route::delete('/organizations/{organization}', [OrganizationController::class, 'destroy']);
    });
    // Update is authorized inside the controller (both Admin & Officer of the organization)
    Route::put('/organizations/{organization}', [OrganizationController::class, 'update']);

    // Memberships
    Route::post('/memberships/join', [MembershipController::class, 'joinRequest']);
    Route::get('/memberships/my', [MembershipController::class, 'myMemberships']);
    // Status, role assignment, and delete are authorized in the controller
    Route::put('/memberships/{id}/status', [MembershipController::class, 'updateStatus']);
    Route::put('/memberships/{id}/role', [MembershipController::class, 'assignRole']);
    Route::delete('/memberships/{id}', [MembershipController::class, 'destroy']);
    Route::get('/organizations/{id}/members/report', [MembershipController::class, 'generateReport']);

    // Events
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{event}', [EventController::class, 'show']);
    Route::post('/events/{id}/rsvp', [EventController::class, 'rsvp']);
    // Store, update, delete, attendance, and reports authorized in the controller
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{event}', [EventController::class, 'update']);
    Route::delete('/events/{event}', [EventController::class, 'destroy']);
    Route::post('/events/{id}/attendance', [EventController::class, 'updateAttendance']);
    Route::get('/events/{id}/report', [EventController::class, 'generateReport']);

    // Announcements
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::get('/announcements/{announcement}', [AnnouncementController::class, 'show']);
    // Store, update, delete authorized in the controller
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);
});
