<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'student_id' => 'nullable|string|max:50',
            'role' => 'nullable|string|in:student,officer'
        ]);

        // Default role is student; admin accounts cannot be created via registration
        $role = $validated['role'] ?? 'student';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'student_id' => $validated['student_id'] ?? null,
            'role' => $role,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid login credentials.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Load memberships so user roles inside organizations are accessible
        $user->load(['memberships.organization']);

        return response()->json([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out.'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $user->load(['memberships.organization']);

        return response()->json($user);
    }

    // Admin: List all users
    public function allUsers(Request $request)
    {
        $users = User::withCount('memberships')->orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    // Admin: Update a user's role
    public function updateUserRole(Request $request, $id)
    {
        $validated = $request->validate([
            'role' => 'required|string|in:student,officer,admin',
        ]);

        $targetUser = User::findOrFail($id);
        $targetUser->update(['role' => $validated['role']]);

        return response()->json(['message' => 'User role updated successfully.', 'user' => $targetUser]);
    }

    // Admin: Delete a user
    public function deleteUser($id)
    {
        $targetUser = User::findOrFail($id);

        // Prevent deleting yourself
        if (auth()->id() === $targetUser->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        $targetUser->memberships()->delete();
        $targetUser->tokens()->delete();
        $targetUser->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
