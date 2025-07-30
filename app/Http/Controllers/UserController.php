<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        // Count total users to handle first admin creation
        $totalUsers = User::count();
        
        $users = User::when($request->input('search'), function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
        
        // Get performance data for admin users
        $overallStats = null;
        $recentActivity = null;
        
        if (auth()->user()->isAdmin()) {
            // Calculate overall stats
            $overallStats = [
                'total_users' => User::count(),
                'total_inspections' => \App\Models\Inspection::count(),
                'total_maintenances' => \App\Models\Maintenance::count(),
                'average_completion_rate' => $this->calculateAverageCompletionRate(),
            ];
            
            // Get individual user performance data
            $userPerformanceData = $this->getUserPerformanceData();
            
            // Get recent activity
            $recentActivity = $this->getRecentActivity();
        }
        
        return Inertia::render('users', [
            'users' => $users,
            'overallStats' => $overallStats,
            'userPerformanceData' => $userPerformanceData ?? null,
            'recentActivity' => $recentActivity,
            'dateRange' => 30,
            'isAdmin' => auth()->user()->isAdmin(),
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $totalUsers = User::count();
        
        // Base validation rules
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ];
        
        // If this is the first user, make them an admin regardless of what was selected
        if ($totalUsers === 0) {
            $validated = $request->validate($rules);
            $validated['role'] = 'admin';
        } else {
            // For subsequent users, validate the role field
            $rules['role'] = ['required', Rule::in(['admin', 'operator'])];
            $validated = $request->validate($rules);
        }
        
        // Always hash the password
        $validated['password'] = Hash::make($validated['password']);
        
        $user = User::create($validated);
        
        return redirect()->route('users')->with('success', 'User created successfully');
    }

    /**
     * Display the specified user.
     */
    public function show(User $user)
    {
        return Inertia::render('user/show', [
            'user' => $user,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        // Basic validation for required fields
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', Rule::in(['admin', 'operator'])],
        ]);
        
        // Check if current user is trying to change their own admin status
        $currentUser = auth()->user();
        if ($currentUser->id === $user->id && $currentUser->isAdmin() && $validated['role'] !== 'admin') {
            return redirect()->back()->with('error', 'You cannot remove your own admin privileges');
        }
        
        // Ensure there's at least one admin user in the system
        if ($user->isAdmin() && $validated['role'] !== 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return redirect()->back()->with('error', 'Cannot remove the last admin user');
            }
        }
        
        // Only update password if provided
        if ($request->filled('password')) {
            $request->validate([
                'password' => 'required|string|min:8|confirmed',
            ]);
            
            $validated['password'] = Hash::make($request->password);
        }
        
        $user->update($validated);
        
        return redirect()->route('users')->with('success', 'User updated successfully');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return redirect()->route('users')->with('error', 'You cannot delete your own account');
        }
        
        // Prevent deleting the last admin
        if ($user->isAdmin()) {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return redirect()->route('users')->with('error', 'Cannot delete the last admin user');
            }
        }
        
        $user->delete();
        
        return redirect()->route('users')->with('success', 'User deleted successfully');
    }
    

    /**
     * Calculate average completion rate across all users
     */
    private function calculateAverageCompletionRate()
    {
        try {
            $users = User::withCount(['assignedInspections', 'assignedInspections as completed_inspections' => function($query) {
                $query->where('status', 'completed');
            }])->get();
            
            if ($users->isEmpty()) {
                return 0;
            }
            
            $totalCompletionRate = $users->sum(function($user) {
                if ($user->assigned_inspections_count === 0) {
                    return 0;
                }
                return ($user->completed_inspections / $user->assigned_inspections_count) * 100;
            });
            
            return round($totalCompletionRate / $users->count(), 1);
        } catch (\Exception $e) {
            return 0;
        }
    }
    
    /**
     * Get individual user performance data
     */
    private function getUserPerformanceData()
    {
        try {
            $users = User::withCount([
                // Inspections assigned to this user as operator (what they actually perform)
                'assignedInspections',
                'assignedInspections as completed_inspections' => function($query) {
                    $query->where('status', 'completed');
                },
                'assignedInspections as failed_inspections' => function($query) {
                    $query->where('status', 'failed');
                },
                // Maintenances created by this user (since we can't track who performs them)
                'maintenances',
                'maintenances as completed_maintenances' => function($query) {
                    $query->where('status', 'completed');
                },
                'maintenances as pending_maintenances' => function($query) {
                    $query->where('status', 'pending');
                }
            ])->get();
            
            return $users->map(function($user) {
                $completionRate = $user->assigned_inspections_count > 0 
                    ? round(($user->completed_inspections / $user->assigned_inspections_count) * 100, 1)
                    : 0;
                
                $failureRate = $user->assigned_inspections_count > 0 
                    ? round(($user->failed_inspections / $user->assigned_inspections_count) * 100, 1)
                    : 0;
                
                $maintenanceCompletionRate = $user->maintenances_count > 0 
                    ? round(($user->completed_maintenances / $user->maintenances_count) * 100, 1)
                    : 0;
                
                return [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                    'role' => $user->role,
                    'total_inspections' => $user->assigned_inspections_count,
                    'completed_inspections' => $user->completed_inspections,
                    'failed_inspections' => $user->failed_inspections,
                    'completion_rate' => $completionRate,
                    'failure_rate' => $failureRate,
                    'total_maintenances' => $user->maintenances_count,
                    'completed_maintenances' => $user->completed_maintenances,
                    'pending_maintenances' => $user->pending_maintenances,
                    'maintenance_completion_rate' => $maintenanceCompletionRate,
                    'created_at' => $user->created_at->toISOString(),
                ];
            })->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }
    
    /**
     * Get recent activity across the system
     */
    private function getRecentActivity()
    {
        $activities = collect();
        
        // Get recent inspections (simplified)
        try {
            $recentInspections = \App\Models\Inspection::with('creator')
                ->whereNotNull('created_by')
                ->latest()
                ->limit(5)
                ->get()
                ->map(function($inspection) {
                    return [
                        'user_name' => $inspection->creator ? $inspection->creator->name : 'Unknown User',
                        'action' => 'created inspection',
                        'target' => $inspection->name,
                        'created_at' => $inspection->created_at->toISOString(),
                    ];
                });
            
            $activities = $activities->merge($recentInspections);
        } catch (\Exception $e) {
            // Skip inspections if there's an error
        }
        
        // Get recent maintenances (simplified)
        try {
            $recentMaintenances = \App\Models\Maintenance::with('user')
                ->whereNotNull('user_id')
                ->latest()
                ->limit(5)
                ->get()
                ->map(function($maintenance) {
                    return [
                        'user_name' => $maintenance->user ? $maintenance->user->name : 'Unknown User',
                        'action' => 'created maintenance',
                        'target' => $maintenance->title,
                        'created_at' => $maintenance->created_at->toISOString(),
                    ];
                });
            
            $activities = $activities->merge($recentMaintenances);
        } catch (\Exception $e) {
            // Skip maintenances if there's an error
        }
        
        // Sort by created_at and take the most recent 10
        return $activities->sortByDesc('created_at')->take(10)->values()->all();
    }
}
