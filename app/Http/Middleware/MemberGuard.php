<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class MemberGuard
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::guard('member')->check()) {
            return response()->json(['message' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $user = Auth::guard('member')->user();

        if ($user->is_suspended) {
            return response()->json(['message' => 'Your account is suspended'], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
