<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class CheckSessionExpiry
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if (Auth::check()) {
            // Check if session has expired
            $lastActivity = Session::get('last_activity');
            $sessionLifetime = config('session.lifetime') * 60; // Convert to seconds
            
            if ($lastActivity && (time() - $lastActivity) > $sessionLifetime) {
                // Session has expired, logout user
                Auth::logout();
                Session::flush();
                
                // For AJAX requests, return JSON response
                if ($request->expectsJson() || $request->ajax()) {
                    return response()->json([
                        'error' => 'Session expired',
                        'message' => 'Your session has expired. Please log in again.',
                        'redirect' => route('login')
                    ], 401);
                }
                
                // For regular requests, redirect to login with message
                return redirect()->route('login')->with('error', 'Your session has expired. Please log in again.');
            }
            
            // Update last activity timestamp
            Session::put('last_activity', time());
        }
        
        return $next($request);
    }
} 