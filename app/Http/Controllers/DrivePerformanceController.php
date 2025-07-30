<?php

namespace App\Http\Controllers;

use App\Models\Drive;
use App\Models\Inspection;
use App\Models\InspectionResult;
use App\Models\Maintenance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DrivePerformanceController extends Controller
{
    /**
     * Display the drive performance dashboard.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();
        
        $selectedDriveId = $request->input('drive_id');
        $dateRange = $request->input('date_range', '30'); // days
        
        $drives = Drive::withCount(['parts', 'maintenances'])->get();
        
        if ($selectedDriveId) {
            $selectedDrive = Drive::with(['parts', 'maintenances'])->findOrFail($selectedDriveId);
            $drivePerformance = $this->getDrivePerformance($selectedDrive, $dateRange);
        } else {
            $drivePerformance = null;
            $selectedDrive = null;
        }

        $overallStats = $this->getOverallDriveStats($dateRange);
        $recentActivity = $this->getRecentDriveActivity($dateRange);

        return Inertia::render('drive/performance', [
            'drives' => $drives,
            'selectedDrive' => $selectedDrive,
            'drivePerformance' => $drivePerformance,
            'overallStats' => $overallStats,
            'recentActivity' => $recentActivity,
            'dateRange' => $dateRange,
            'selectedDriveId' => $selectedDriveId,
            'isAdmin' => $isAdmin,
        ]);
    }

    /**
     * Get performance data for a specific drive.
     */
    private function getDrivePerformance(Drive $drive, int $days): array
    {
        $startDate = Carbon::now()->subDays($days);
        
        // Get inspections related to this drive
        $inspections = Inspection::whereHas('tasks', function ($query) use ($drive) {
            $query->where('target_type', 'drive')->where('target_id', $drive->id);
        })->where('created_at', '>=', $startDate)
        ->where('is_template', false)
        ->get();

        // Get results for this drive
        $results = InspectionResult::whereHas('task', function ($query) use ($drive) {
            $query->where('target_type', 'drive')->where('target_id', $drive->id);
        })->where('created_at', '>=', $startDate)
        ->get();

        // Get maintenances for this drive
        $maintenances = Maintenance::where('drive_id', $drive->id)
            ->where('created_at', '>=', $startDate)
            ->get();

        // Calculate statistics
        $totalInspections = $inspections->count();
        $completedInspections = $inspections->where('status', 'completed')->count();
        $totalResults = $results->count();
        $passedResults = $results->where('is_passing', true)->count();
        $failedResults = $results->where('is_passing', false)->count();
        $totalMaintenances = $maintenances->count();
        $completedMaintenances = $maintenances->where('status', 'completed')->count();
        $pendingMaintenances = $maintenances->where('status', 'pending')->count();

        // Calculate completion rate
        $completionRate = $totalInspections > 0 ? round(($completedInspections / $totalInspections) * 100, 1) : 0;
        
        // Calculate pass rate
        $passRate = $totalResults > 0 ? round(($passedResults / $totalResults) * 100, 1) : 0;

        // Calculate health score (based on pass rate and maintenance status)
        $healthScore = $this->calculateHealthScore($passRate, $pendingMaintenances, $totalResults);

        // Get daily activity for chart
        $dailyActivity = $this->getDailyDriveActivity($drive, $days);

        // Get recent issues
        $recentIssues = $this->getRecentDriveIssues($drive, $days);

        return [
            'drive' => [
                'id' => $drive->id,
                'name' => $drive->name,
                'drive_ref' => $drive->drive_ref,
                'location' => $drive->location,
                'parts_count' => $drive->parts_count,
                'maintenances_count' => $drive->maintenances_count,
            ],
            'stats' => [
                'total_inspections' => $totalInspections,
                'completed_inspections' => $completedInspections,
                'completion_rate' => $completionRate,
                'total_results' => $totalResults,
                'passed_results' => $passedResults,
                'failed_results' => $failedResults,
                'pass_rate' => $passRate,
                'total_maintenances' => $totalMaintenances,
                'completed_maintenances' => $completedMaintenances,
                'pending_maintenances' => $pendingMaintenances,
                'health_score' => $healthScore,
            ],
            'daily_activity' => $dailyActivity,
            'recent_issues' => $recentIssues,
            'recent_inspections' => $inspections->take(5)->map(function ($inspection) {
                return [
                    'id' => $inspection->id,
                    'name' => $inspection->name,
                    'status' => $inspection->status,
                    'created_at' => $inspection->created_at,
                    'operator_name' => $inspection->operator ? $inspection->operator->name : 'Unassigned',
                ];
            }),
            'recent_maintenances' => $maintenances->take(5)->map(function ($maintenance) {
                return [
                    'id' => $maintenance->id,
                    'title' => $maintenance->title,
                    'status' => $maintenance->status,
                    'created_at' => $maintenance->created_at,
                    'created_from_inspection' => $maintenance->created_from_inspection,
                ];
            }),
        ];
    }

    /**
     * Get overall drive statistics.
     */
    private function getOverallDriveStats(int $days): array
    {
        $startDate = Carbon::now()->subDays($days);
        
        $totalDrives = Drive::count();
        $drivesWithIssues = Drive::whereHas('maintenances', function ($query) use ($startDate) {
            $query->where('status', 'pending')->where('created_at', '>=', $startDate);
        })->count();

        $totalInspections = Inspection::whereHas('tasks', function ($query) {
            $query->where('target_type', 'drive');
        })->where('created_at', '>=', $startDate)
        ->where('is_template', false)
        ->count();

        $totalResults = InspectionResult::whereHas('task', function ($query) {
            $query->where('target_type', 'drive');
        })->where('created_at', '>=', $startDate)
        ->count();

        $passedResults = InspectionResult::whereHas('task', function ($query) {
            $query->where('target_type', 'drive');
        })->where('is_passing', true)
        ->where('created_at', '>=', $startDate)
        ->count();

        $totalMaintenances = Maintenance::where('created_at', '>=', $startDate)->count();
        $pendingMaintenances = Maintenance::where('status', 'pending')
            ->where('created_at', '>=', $startDate)
            ->count();

        return [
            'total_drives' => $totalDrives,
            'drives_with_issues' => $drivesWithIssues,
            'total_inspections' => $totalInspections,
            'total_results' => $totalResults,
            'passed_results' => $passedResults,
            'pass_rate' => $totalResults > 0 ? round(($passedResults / $totalResults) * 100, 1) : 0,
            'total_maintenances' => $totalMaintenances,
            'pending_maintenances' => $pendingMaintenances,
        ];
    }

    /**
     * Get recent activity across all drives.
     */
    private function getRecentDriveActivity(int $days): array
    {
        $startDate = Carbon::now()->subDays($days);
        
        $recentInspections = Inspection::with(['operator', 'tasks'])
            ->whereHas('tasks', function ($query) {
                $query->where('target_type', 'drive');
            })
            ->where('created_at', '>=', $startDate)
            ->where('is_template', false)
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($inspection) {
                $driveTask = $inspection->tasks->where('target_type', 'drive')->first();
                $drive = $driveTask ? \App\Models\Drive::find($driveTask->target_id) : null;
                
                return [
                    'type' => 'inspection',
                    'id' => $inspection->id,
                    'name' => $inspection->name,
                    'status' => $inspection->status,
                    'drive_name' => $drive ? $drive->name : 'Unknown Drive',
                    'operator_name' => $inspection->operator ? $inspection->operator->name : 'Unassigned',
                    'created_at' => $inspection->created_at,
                ];
            });

        $recentResults = InspectionResult::with(['performer', 'task'])
            ->whereHas('task', function ($query) {
                $query->where('target_type', 'drive');
            })
            ->where('created_at', '>=', $startDate)
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($result) {
                $drive = \App\Models\Drive::find($result->task->target_id);
                
                return [
                    'type' => 'result',
                    'id' => $result->id,
                    'name' => $result->task->name ?? 'Unknown Task',
                    'status' => $result->is_passing ? 'Passed' : 'Failed',
                    'drive_name' => $drive ? $drive->name : 'Unknown Drive',
                    'operator_name' => $result->performer->name,
                    'created_at' => $result->created_at,
                ];
            });

        $recentMaintenances = Maintenance::with(['user', 'drive'])
            ->where('created_at', '>=', $startDate)
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($maintenance) {
                return [
                    'type' => 'maintenance',
                    'id' => $maintenance->id,
                    'name' => $maintenance->title,
                    'status' => $maintenance->status,
                    'drive_name' => $maintenance->drive ? $maintenance->drive->name : 'Unknown Drive',
                    'operator_name' => $maintenance->user->name,
                    'created_at' => $maintenance->created_at,
                ];
            });

        // Combine and sort by date
        $allActivities = $recentInspections->concat($recentResults)->concat($recentMaintenances);
        $allActivities = $allActivities->sortByDesc('created_at')->take(15);

        return $allActivities->values()->toArray();
    }

    /**
     * Get daily activity data for charts.
     */
    private function getDailyDriveActivity(Drive $drive, int $days): array
    {
        $startDate = Carbon::now()->subDays($days);
        $activity = [];

        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i);
            
            $inspectionsCount = Inspection::whereHas('tasks', function ($query) use ($drive) {
                $query->where('target_type', 'drive')->where('target_id', $drive->id);
            })->where('is_template', false)
            ->whereDate('created_at', $date)
            ->count();

            $resultsCount = InspectionResult::whereHas('task', function ($query) use ($drive) {
                $query->where('target_type', 'drive')->where('target_id', $drive->id);
            })->whereDate('created_at', $date)
            ->count();

            $maintenancesCount = Maintenance::where('drive_id', $drive->id)
                ->whereDate('created_at', $date)
                ->count();

            $activity[] = [
                'date' => $date->format('Y-m-d'),
                'inspections' => $inspectionsCount,
                'results' => $resultsCount,
                'maintenances' => $maintenancesCount,
            ];
        }

        return $activity;
    }

    /**
     * Get recent issues for a drive.
     */
    private function getRecentDriveIssues(Drive $drive, int $days): array
    {
        $startDate = Carbon::now()->subDays($days);
        
        $failedResults = InspectionResult::whereHas('task', function ($query) use ($drive) {
            $query->where('target_type', 'drive')->where('target_id', $drive->id);
        })->where('is_passing', false)
        ->where('created_at', '>=', $startDate)
        ->with(['task', 'performer'])
        ->latest()
        ->take(10)
        ->get()
        ->map(function ($result) {
            return [
                'type' => 'failed_inspection',
                'id' => $result->id,
                'task_name' => $result->task->name ?? 'Unknown Task',
                'performed_by' => $result->performer->name,
                'created_at' => $result->created_at,
                'notes' => $result->notes,
            ];
        });

        $pendingMaintenances = Maintenance::where('drive_id', $drive->id)
            ->where('status', 'pending')
            ->where('created_at', '>=', $startDate)
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($maintenance) {
                return [
                    'type' => 'pending_maintenance',
                    'id' => $maintenance->id,
                    'title' => $maintenance->title,
                    'created_by' => $maintenance->user->name,
                    'created_at' => $maintenance->created_at,
                    'created_from_inspection' => $maintenance->created_from_inspection,
                ];
            });

        return $failedResults->concat($pendingMaintenances)->sortByDesc('created_at')->values()->toArray();
    }

    /**
     * Calculate health score for a drive.
     */
    private function calculateHealthScore(float $passRate, int $pendingMaintenances, int $totalResults): int
    {
        $score = 100;
        
        // Reduce score based on pass rate
        $score -= (100 - $passRate) * 0.5;
        
        // Reduce score based on pending maintenances
        $score -= $pendingMaintenances * 10;
        
        // Ensure score doesn't go below 0
        return max(0, min(100, round($score)));
    }
} 