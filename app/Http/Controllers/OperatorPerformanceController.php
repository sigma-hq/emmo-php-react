<?php

namespace App\Http\Controllers;

use App\Models\OperatorPerformance;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OperatorPerformanceController extends Controller
{
    /**
     * Display the operator performance dashboard.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Only admins can access this
        if (!$user->isAdmin()) {
            abort(403, 'Unauthorized access to operator performance data.');
        }
        
        // Get performance data for all operators
        $performances = OperatorPerformance::with('user:id,name,email')
            ->latest('period_end')
            ->get()
            ->groupBy('user_id')
            ->map(function ($userPerformances) {
                return $userPerformances->first(); // Get the most recent
            })
            ->values();
        
        // Get users that need attention
        $usersNeedingAttention = OperatorPerformance::getUsersNeedingAttention();
        
        // Calculate summary statistics
        $summary = [
            'total_operators' => User::where('role', 'operator')->count(),
            'active_operators' => $performances->where('status', 'active')->count(),
            'warning_operators' => $performances->where('status', 'warning')->count(),
            'critical_operators' => $performances->where('status', 'critical')->count(),
            'inactive_operators' => $performances->where('status', 'inactive')->count(),
            'average_performance_score' => $performances->avg('performance_score'),
            'average_completion_rate' => $performances->avg('completion_rate'),
            'average_pass_rate' => $performances->avg('pass_rate'),
        ];
        
        // Get performance trends (last 30 days)
        $trends = $this->getPerformanceTrends();
        
        return Inertia::render('admin/operator-performance', [
            'performances' => $performances,
            'usersNeedingAttention' => $usersNeedingAttention,
            'summary' => $summary,
            'trends' => $trends,
        ]);
    }
    
    /**
     * Get performance trends over time
     */
    private function getPerformanceTrends(): array
    {
        $trends = [];
        
        // Get data for the last 30 days
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();
            
            $dayPerformances = OperatorPerformance::where('period_start', '<=', $dayEnd)
                ->where('period_end', '>=', $dayStart)
                ->get();
            
            $trends[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $date->format('D'),
                'average_score' => $dayPerformances->avg('performance_score') ?? 0,
                'average_completion_rate' => $dayPerformances->avg('completion_rate') ?? 0,
                'active_operators' => $dayPerformances->where('status', 'active')->count(),
                'warning_operators' => $dayPerformances->where('status', 'warning')->count(),
                'critical_operators' => $dayPerformances->where('status', 'critical')->count(),
                'inactive_operators' => $dayPerformances->where('status', 'inactive')->count(),
            ];
        }
        
        return $trends;
    }
    
    /**
     * Get detailed performance for a specific operator
     */
    public function show(User $operator)
    {
        $user = auth()->user();
        
        // Only admins can access this
        if (!$user->isAdmin()) {
            abort(403, 'Unauthorized access to operator performance data.');
        }
        
        // Get performance history for this operator
        $performances = OperatorPerformance::where('user_id', $operator->id)
            ->orderBy('period_end', 'desc')
            ->get();
        
        // Get recent inspections for this operator
        $recentInspections = $operator->assignedInspections()
            ->with(['tasks.results.performer'])
            ->latest()
            ->take(20)
            ->get();
        
        // Get recent activity
        $recentActivity = \App\Models\InspectionResult::whereHas('task', function($query) use ($operator) {
            $query->whereHas('inspection', function($q) use ($operator) {
                $q->where('operator_id', $operator->id);
            });
        })->with(['task.inspection', 'performer'])
        ->latest()
        ->take(50)
        ->get();
        
        return Inertia::render('admin/operator-performance-detail', [
            'operator' => $operator,
            'performances' => $performances,
            'recentInspections' => $recentInspections,
            'recentActivity' => $recentActivity,
        ]);
    }
    
    /**
     * Manually trigger performance check for all operators
     */
    public function triggerCheck()
    {
        $user = auth()->user();
        
        // Only admins can trigger this
        if (!$user->isAdmin()) {
            abort(403, 'Unauthorized to trigger performance checks.');
        }
        
        try {
            \Artisan::call('operators:check-performance');
            
            return response()->json([
                'success' => true,
                'message' => 'Performance check triggered successfully',
                'output' => \Artisan::output(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to trigger performance check: ' . $e->getMessage(),
            ], 500);
        }
    }
}
