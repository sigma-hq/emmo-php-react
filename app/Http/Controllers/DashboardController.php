<?php

namespace App\Http\Controllers;

use App\Models\Drive;
use App\Models\Inspection;
use App\Models\Maintenance;
use App\Models\Part;
use App\Models\InspectionTask;
use App\Models\InspectionResult;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();
        
        // Get role-specific inspection stats
        if ($isAdmin) {
            // Admin sees all inspections
            $inspectionsStats = [
                'total' => Inspection::count(),
                'active' => Inspection::where('status', 'active')->count(),
                'pending_review' => Inspection::where('is_template', false)
                                          ->whereDoesntHave('tasks.results')
                                          ->where('status', '!=', 'completed')
                                          ->where('status', '!=', 'draft')
                                          ->count(),
                'completed' => Inspection::where('status', 'completed')->count(),
                'draft' => Inspection::where('status', 'draft')->count(),
                'due_soon' => Inspection::where('is_template', false)
                                    ->where('status', '!=', 'completed')
                                    ->whereNotNull('schedule_next_due_date')
                                    ->whereBetween('schedule_next_due_date', [Carbon::now(), Carbon::now()->addDays(7)])
                                    ->count(),
                'overdue' => Inspection::where('is_template', false)
                                   ->where('status', '!=', 'completed')
                                   ->whereNotNull('schedule_next_due_date')
                                   ->where('schedule_next_due_date', '<', Carbon::now())
                                   ->count(),
            ];
        } else {
            // Operator sees only their assigned inspections
            $inspectionsStats = [
                'total' => Inspection::where('operator_id', $user->id)->count(),
                'active' => Inspection::where('operator_id', $user->id)->where('status', 'active')->count(),
                'pending_review' => Inspection::where('operator_id', $user->id)
                                          ->where('is_template', false)
                                          ->whereDoesntHave('tasks.results')
                                          ->where('status', '!=', 'completed')
                                          ->where('status', '!=', 'draft')
                                          ->count(),
                'completed' => Inspection::where('operator_id', $user->id)->where('status', 'completed')->count(),
                'draft' => Inspection::where('operator_id', $user->id)->where('status', 'draft')->count(),
                'due_soon' => Inspection::where('operator_id', $user->id)
                                    ->where('is_template', false)
                                    ->where('status', '!=', 'completed')
                                    ->whereNotNull('schedule_next_due_date')
                                    ->whereBetween('schedule_next_due_date', [Carbon::now(), Carbon::now()->addDays(7)])
                                    ->count(),
                'overdue' => Inspection::where('operator_id', $user->id)
                                   ->where('is_template', false)
                                   ->where('status', '!=', 'completed')
                                   ->whereNotNull('schedule_next_due_date')
                                   ->where('schedule_next_due_date', '<', Carbon::now())
                                   ->count(),
            ];
        }

        // Chart data for inspection status distribution
        $inspectionStatusChart = [
            ['name' => 'Active', 'value' => $inspectionsStats['active']],
            ['name' => 'Pending Review', 'value' => $inspectionsStats['pending_review']],
            ['name' => 'Completed', 'value' => $inspectionsStats['completed']],
            ['name' => 'Draft', 'value' => $inspectionsStats['draft']],
        ];

        // Get role-specific maintenance stats
        if ($isAdmin) {
            // Admin sees all maintenances
            $maintenancesStats = [
                'total' => Maintenance::count(),
                'scheduled' => Maintenance::where('status', 'scheduled')->count(),
                'in_progress' => Maintenance::where('status', 'in_progress')->count(),
                'completed' => Maintenance::where('status', 'completed')->count(),
                'needs_scheduling' => Maintenance::where('status', 'pending')->count(),
            ];
        } else {
            // Operator sees only maintenances they're involved with (if any)
            // For now, operators don't have specific maintenance assignments, so show 0
            $maintenancesStats = [
                'total' => 0,
                'scheduled' => 0,
                'in_progress' => 0,
                'completed' => 0,
                'needs_scheduling' => 0,
            ];
        }

        // Chart data for maintenance status
        $maintenanceStatusChart = [
            ['name' => 'Scheduled', 'value' => $maintenancesStats['scheduled']],
            ['name' => 'In Progress', 'value' => $maintenancesStats['in_progress']],
            ['name' => 'Completed', 'value' => $maintenancesStats['completed']],
            ['name' => 'Needs Scheduling', 'value' => $maintenancesStats['needs_scheduling']],
        ];

        // Get role-specific drives and parts stats
        if ($isAdmin) {
            // Admin sees all drives and parts
            $drivesStats = [
                'total' => Drive::count(),
            ];

            $partsStats = [
                'total' => Part::count(),
                'attached' => Part::whereNotNull('drive_id')->count(),
                'unattached' => Part::whereNull('drive_id')->count(),
            ];
        } else {
            // Operator sees all drives and parts (they need to access them for inspections)
            $drivesStats = [
                'total' => Drive::count(),
            ];

            $partsStats = [
                'total' => Part::count(),
                'attached' => Part::whereNotNull('drive_id')->count(),
                'unattached' => Part::whereNull('drive_id')->count(),
            ];
        }

        // Chart data for parts (attached vs unattached)
        $partsChart = [
            ['name' => 'Attached', 'value' => $partsStats['attached']],
            ['name' => 'Unattached', 'value' => $partsStats['unattached']],
        ];

        // Inspection trend data - last 6 months
        $inspectionTrend = $this->getInspectionTrend();

        // Get role-specific recent activities
        if ($isAdmin) {
            // Admin sees all recent activities
            $recentInspections = Inspection::with(['creator', 'operator'])
                ->where('is_template', false)
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($inspection) {
                    return [
                        'id' => $inspection->id,
                        'name' => $inspection->name,
                        'status' => $inspection->status,
                        'created_at' => $inspection->created_at,
                        'created_by' => $inspection->creator ? $inspection->creator->name : 'System',
                        'operator_name' => $inspection->operator ? $inspection->operator->name : 'N/A',
                    ];
                });
            
            $recentMaintenances = Maintenance::with('user')
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($maintenance) {
                    return [
                        'id' => $maintenance->id,
                        'description' => $maintenance->description,
                        'status' => $maintenance->status,
                        'created_at' => $maintenance->created_at,
                        'created_by' => $maintenance->user ? $maintenance->user->name : 'System',
                    ];
                });
                
            // Get user performance data for admin dashboard
            $userPerformanceData = $this->getUserPerformanceData();
            $overallPerformanceStats = $this->getOverallPerformanceStats();
        } else {
            // Operator sees only their assigned inspections
            $recentInspections = Inspection::with(['creator', 'operator'])
                ->where('is_template', false)
                ->where('operator_id', $user->id)
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($inspection) {
                    return [
                        'id' => $inspection->id,
                        'name' => $inspection->name,
                        'status' => $inspection->status,
                        'created_at' => $inspection->created_at,
                        'created_by' => $inspection->creator ? $inspection->creator->name : 'System',
                        'operator_name' => $inspection->operator ? $inspection->operator->name : 'N/A',
                    ];
                });
            
            // Operators don't see maintenance activities
            $recentMaintenances = collect();
        }

        return Inertia::render('dashboard', [
            'inspectionsStats' => $inspectionsStats,
            'maintenancesStats' => $maintenancesStats,
            'drivesStats' => $drivesStats,
            'partsStats' => $partsStats,
            'inspectionStatusChart' => $inspectionStatusChart,
            'maintenanceStatusChart' => $maintenanceStatusChart,
            'partsChart' => $partsChart,
            'inspectionTrend' => $inspectionTrend,
            'recentInspections' => $recentInspections,
            'recentMaintenances' => $recentMaintenances,
            'userPerformanceData' => $userPerformanceData ?? null,
            'overallPerformanceStats' => $overallPerformanceStats ?? null,
            'isAdmin' => $isAdmin,
            'userRole' => $user->role,
            'userName' => $user->name,
        ]);
    }

    /**
     * Get inspection trend data for the last 6 months
     * 
     * @return array
     */
    private function getInspectionTrend(): array
    {
        $trend = [];
        $endDate = Carbon::now()->endOfMonth();
        $startDate = Carbon::now()->subMonths(5)->startOfMonth();

        // Create array with all months, even if no data
        for ($date = $startDate->copy(); $date->lte($endDate); $date->addMonth()) {
            $monthKey = $date->format('M Y'); // e.g., Jan 2023
            $trend[$monthKey] = [
                'name' => $monthKey,
                'created' => 0,
                'completed' => 0
            ];
        }

        // Get created inspections by month
        // SQLite uses strftime. We'll get YYYY-MM and then format to M Y in PHP.
        $createdByMonth = DB::table('inspections')
            ->select(DB::raw("strftime('%Y-%m', created_at) as year_month"), DB::raw('count(*) as count'))
            ->where('is_template', false)
            ->where('created_at', '>=', $startDate->format('Y-m-d H:i:s'))
            ->where('created_at', '<=', $endDate->format('Y-m-d H:i:s'))
            ->groupBy('year_month')
            ->get();

        foreach ($createdByMonth as $item) {
            $monthKey = Carbon::createFromFormat('Y-m', $item->year_month)->format('M Y');
            if (isset($trend[$monthKey])) {
                $trend[$monthKey]['created'] = $item->count;
            }
        }

        // Get completed inspections by month
        $completedByMonth = DB::table('inspections')
            ->select(DB::raw("strftime('%Y-%m', updated_at) as year_month"), DB::raw('count(*) as count'))
            ->where('is_template', false)
            ->where('status', 'completed')
            ->where('updated_at', '>=', $startDate->format('Y-m-d H:i:s'))
            ->where('updated_at', '<=', $endDate->format('Y-m-d H:i:s'))
            ->groupBy('year_month')
            ->get();

        foreach ($completedByMonth as $item) {
            $monthKey = Carbon::createFromFormat('Y-m', $item->year_month)->format('M Y');
            if (isset($trend[$monthKey])) {
                $trend[$monthKey]['completed'] = $item->count;
            }
        }

        // Convert associative array to indexed array for recharts
        return array_values($trend);
    }
    
    /**
     * Get individual user performance data for dashboard
     */
    private function getUserPerformanceData()
    {
        try {
            $users = \App\Models\User::withCount([
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
     * Get overall performance statistics for dashboard
     */
    private function getOverallPerformanceStats()
    {
        try {
            $users = \App\Models\User::withCount([
                'assignedInspections',
                'assignedInspections as completed_inspections' => function($query) {
                    $query->where('status', 'completed');
                }
            ])->get();
            
            if ($users->isEmpty()) {
                return [
                    'total_users' => 0,
                    'active_performers' => 0,
                    'avg_completion_rate' => 0,
                    'total_inspections_performed' => 0,
                    'total_maintenances_created' => 0,
                ];
            }
            
            $activePerformers = $users->filter(function($user) {
                return $user->assigned_inspections_count > 0 || $user->maintenances_count > 0;
            })->count();
            
            $totalCompletionRate = $users->sum(function($user) {
                if ($user->assigned_inspections_count === 0) {
                    return 0;
                }
                return ($user->completed_inspections / $user->assigned_inspections_count) * 100;
            });
            
            $avgCompletionRate = $users->count() > 0 ? round($totalCompletionRate / $users->count(), 1) : 0;
            
            return [
                'total_users' => $users->count(),
                'active_performers' => $activePerformers,
                'avg_completion_rate' => $avgCompletionRate,
                'total_inspections_performed' => $users->sum('assigned_inspections_count'),
                'total_maintenances_created' => $users->sum('maintenances_count'),
            ];
        } catch (\Exception $e) {
            return [
                'total_users' => 0,
                'active_performers' => 0,
                'avg_completion_rate' => 0,
                'total_inspections_performed' => 0,
                'total_maintenances_created' => 0,
            ];
        }
    }
} 