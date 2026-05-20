<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('student_id', 'like', "%{$search}%");
        }

        if ($request->has('is_suspended')) {
            $query->where('is_suspended', (bool) $request->input('is_suspended'));
        }

        $perPage = (int) $request->input('per_page', 15);
        $users = $query->paginate($perPage);

        return response()->json([
            'message' => 'Users retrieved successfully',
            'data' => $users->items(),
            'meta' => [
                'pagination' => [
                    'total' => $users->total(),
                    'per_page' => $users->perPage(),
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                ],
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        return response()->json([
            'message' => 'User retrieved successfully',
            'data' => $user,
        ]);
    }

    public function suspend(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['is_suspended' => true]);

        return response()->json([
            'message' => 'User suspended successfully',
            'data' => $user,
        ]);
    }

    public function restore(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['is_suspended' => false]);

        return response()->json([
            'message' => 'User restored successfully',
            'data' => $user,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
