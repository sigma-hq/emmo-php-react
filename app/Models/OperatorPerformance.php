<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperatorPerformance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'period_start',
        'period_end',
        'total_inspections_assigned',
        'completed_inspections',
        'failed_inspections',
        'pending_inspections',
        'completion_rate',
        'pass_rate',
        'last_activity_at',
        'days_since_last_activity',
        'performance_score',
        'status', // 'active', 'warning', 'critical', 'inactive'
        'notes',
    ];

    protected $casts = [
        'period_start' => 'datetime',
        'period_end' => 'datetime',
        'last_activity_at' => 'datetime',
        'completion_rate' => 'decimal:2',
        'pass_rate' => 'decimal:2',
        'performance_score' => 'decimal:2',
    ];

    /**
     * Get the user this performance record belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Calculate performance metrics for a user
     */
    public static function calculateForUser(User $user, $periodDays = 30): array
    {
        $startDate = now()->subDays($periodDays);
        $endDate = now();

        // Get inspections assigned to this user
        $assignedInspections = Inspection::where('operator_id', $user->id)
            ->where('created_at', '>=', $startDate)
            ->where('is_template', false)
            ->get();

        // Get completed inspections
        $completedInspections = $assignedInspections->where('status', 'completed');
        $failedInspections = $assignedInspections->where('status', 'failed');
        $pendingInspections = $assignedInspections->where('status', 'active');

        // Get last activity
        $lastActivity = InspectionResult::whereHas('task', function($query) use ($user) {
            $query->whereHas('inspection', function($q) use ($user) {
                $q->where('operator_id', $user->id);
            });
        })->latest()->first();

        // Calculate completion rate
        $totalAssigned = $assignedInspections->count();
        $completionRate = $totalAssigned > 0 ? ($completedInspections->count() / $totalAssigned) * 100 : 0;

        // Calculate pass rate from results
        $results = InspectionResult::whereHas('task', function($query) use ($user) {
            $query->whereHas('inspection', function($q) use ($user) {
                $q->where('operator_id', $user->id);
            });
        })->where('created_at', '>=', $startDate)->get();

        $passRate = $results->count() > 0 ? ($results->where('is_passing', true)->count() / $results->count()) * 100 : 0;

        // Calculate performance score (weighted average)
        $performanceScore = ($completionRate * 0.6) + ($passRate * 0.4);

        // Determine status
        $status = 'active';
        if ($performanceScore < 50) {
            $status = 'critical';
        } elseif ($performanceScore < 75) {
            $status = 'warning';
        } elseif ($completionRate < 60) {
            $status = 'warning';
        }

        // Check for inactivity
        $daysSinceLastActivity = $lastActivity ? $lastActivity->created_at->diffInDays(now()) : $periodDays;
        if ($daysSinceLastActivity > 7 && $totalAssigned > 0) {
            $status = 'inactive';
        }

        return [
            'user_id' => $user->id,
            'period_start' => $startDate,
            'period_end' => $endDate,
            'total_inspections_assigned' => $totalAssigned,
            'completed_inspections' => $completedInspections->count(),
            'failed_inspections' => $failedInspections->count(),
            'pending_inspections' => $pendingInspections->count(),
            'completion_rate' => round($completionRate, 2),
            'pass_rate' => round($passRate, 2),
            'last_activity_at' => $lastActivity?->created_at,
            'days_since_last_activity' => $daysSinceLastActivity,
            'performance_score' => round($performanceScore, 2),
            'status' => $status,
            'notes' => self::generateNotes($status, $completionRate, $passRate, $daysSinceLastActivity, $totalAssigned),
        ];
    }

    /**
     * Generate notes based on performance metrics
     */
    private static function generateNotes($status, $completionRate, $passRate, $daysSinceLastActivity, $totalAssigned): string
    {
        $notes = [];

        if ($totalAssigned === 0) {
            $notes[] = 'No inspections assigned in this period.';
        } else {
            if ($completionRate < 60) {
                $notes[] = 'Low completion rate - may need support or training.';
            }
            if ($passRate < 80) {
                $notes[] = 'Low pass rate - may need quality improvement.';
            }
            if ($daysSinceLastActivity > 7) {
                $notes[] = 'No activity for ' . $daysSinceLastActivity . ' days.';
            }
        }

        if ($status === 'critical') {
            $notes[] = 'CRITICAL: Immediate attention required.';
        } elseif ($status === 'warning') {
            $notes[] = 'WARNING: Performance below acceptable levels.';
        } elseif ($status === 'inactive') {
            $notes[] = 'INACTIVE: No recent activity detected.';
        }

        return implode(' ', $notes);
    }

    /**
     * Get users that need admin attention
     */
    public static function getUsersNeedingAttention(): \Illuminate\Database\Eloquent\Collection
    {
        return self::whereIn('status', ['warning', 'critical', 'inactive'])
            ->with('user:id,name,email')
            ->where('period_end', '>=', now()->subDays(1))
            ->orderBy('performance_score', 'asc')
            ->get();
    }
}
