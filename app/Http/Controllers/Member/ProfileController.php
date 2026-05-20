<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Profile retrieved successfully',
            'data' => $request->user('member'),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user('member');

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'student_id' => 'sometimes|nullable|string|unique:users,student_id,' . $user->id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->update($request->only(['name', 'email', 'student_id']));

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => $user,
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $user = $request->user('member');

        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = Storage::url($path);
            $user->save();

            return response()->json([
                'message' => 'Avatar uploaded successfully',
                'data' => $user,
            ]);
        }

        return response()->json([
            'message' => 'No file uploaded',
        ], Response::HTTP_BAD_REQUEST);
    }
}
