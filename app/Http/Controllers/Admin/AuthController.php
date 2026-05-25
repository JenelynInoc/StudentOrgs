<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $admin = Admin::where('email', $request->email)->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $admin->createToken('admin-token', ['admin'])->plainTextToken;

        \App\Models\ActivityLog::create([
            'action' => 'login',
            'model_type' => get_class($admin),
            'model_id' => $admin->id,
            'user_id' => null,
            'properties' => ['email' => $admin->email, 'ip' => $request->ip(), 'guard' => 'admin'],
        ]);

        return response()->json([
            'message' => 'Login successful',
            'data' => [
                'admin' => $admin,
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user('admin')->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout successful']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Current admin',
            'data' => $request->user('admin'),
        ]);
    }
}
