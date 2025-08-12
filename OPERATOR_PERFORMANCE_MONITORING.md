# Operator Performance Monitoring System

## Overview

The Operator Performance Monitoring System is a comprehensive solution that tracks operator performance and automatically alerts system administrators when operators are not completing their assigned inspections or performing below acceptable levels.

## Features

### 1. **Automatic Performance Tracking**
- **Daily Analysis**: Runs automatically every day at 8:00 AM
- **30-Day Periods**: Analyzes performance over rolling 30-day periods
- **Real-time Metrics**: Tracks completion rates, pass rates, and activity levels

### 2. **Performance Metrics**
- **Completion Rate**: Percentage of assigned inspections completed
- **Pass Rate**: Percentage of inspection results that pass
- **Performance Score**: Weighted average (60% completion + 40% pass rate)
- **Activity Tracking**: Days since last inspection activity

### 3. **Status Classification**
- **Active**: Performance score ≥75% and completion rate ≥60%
- **Warning**: Performance score 50-74% or completion rate <60%
- **Critical**: Performance score <50%
- **Inactive**: No activity for >7 days with assigned inspections

### 4. **Admin Alerts**
- **Dashboard Notifications**: Prominent alerts for operators needing attention
- **Email Alerts**: Automatic notifications to admin users (configurable)
- **Performance Reports**: Detailed breakdowns and trends

## How It Works

### 1. **Data Collection**
The system automatically collects data from:
- Inspection assignments (`operator_id` field)
- Inspection results (`performed_by` field)
- Inspection completion status
- Task and sub-task completion rates

### 2. **Performance Calculation**
```php
// Performance Score = (Completion Rate × 0.6) + (Pass Rate × 0.4)
$performanceScore = ($completionRate * 0.6) + ($passRate * 0.4);

// Status determination based on thresholds
if ($performanceScore < 50) $status = 'critical';
elseif ($performanceScore < 75) $status = 'warning';
elseif ($completionRate < 60) $status = 'warning';
else $status = 'active';
```

### 3. **Alert Generation**
- **Warning Level**: Operators with performance issues
- **Critical Level**: Operators requiring immediate attention
- **Inactive Level**: Operators with no recent activity

## Setup Instructions

### 1. **Run Migration**
```bash
php artisan migrate
```

### 2. **Schedule the Command**
The system automatically runs daily at 8:00 AM. To test manually:
```bash
php artisan operators:check-performance
```

### 3. **Access the Dashboard**
Navigate to `/admin/operator-performance` (admin users only)

## Usage

### For Administrators

#### **Dashboard Overview**
- View summary statistics for all operators
- Identify operators needing attention
- Monitor performance trends over time
- Trigger manual performance checks

#### **Performance Details**
- Individual operator performance breakdowns
- Historical performance data
- Recent inspection activity
- Detailed metrics and notes

#### **Alert Management**
- Review operators flagged for attention
- Understand performance issues
- Take appropriate action (training, support, etc.)

### For Operators
- **No additional action required**
- Performance is automatically tracked
- Continue normal inspection activities
- System will flag issues automatically

## Configuration

### **Performance Thresholds**
Default thresholds can be adjusted in `app/Models/OperatorPerformance.php`:
```php
// Performance score thresholds
if ($performanceScore < 50) $status = 'critical';
elseif ($performanceScore < 75) $status = 'warning';

// Completion rate threshold
elseif ($completionRate < 60) $status = 'warning';

// Inactivity threshold
if ($daysSinceLastActivity > 7 && $totalAssigned > 0) $status = 'inactive';
```

### **Analysis Period**
Change the default 30-day analysis period:
```bash
php artisan operators:check-performance --days=14
```

### **Schedule Timing**
Modify the daily schedule in `app/Console/Kernel.php`:
```php
$schedule->command('operators:check-performance')
    ->daily()
    ->at('08:00')
    ->withoutOverlapping();
```

## Monitoring and Maintenance

### **Daily Checks**
- Review the performance dashboard
- Address critical alerts immediately
- Monitor warning-level operators
- Track performance trends

### **Weekly Reviews**
- Analyze performance patterns
- Identify training needs
- Review operator assignments
- Update performance thresholds if needed

### **Monthly Analysis**
- Review 30-day performance trends
- Assess system effectiveness
- Plan operator development
- Update processes based on insights

## Troubleshooting

### **Common Issues**

#### **No Performance Data**
- Ensure operators have assigned inspections
- Check if the scheduled command is running
- Verify database permissions

#### **Incorrect Status Classification**
- Review threshold settings
- Check data completeness
- Verify calculation logic

#### **Missing Alerts**
- Confirm admin user roles
- Check email configuration
- Review alert generation logic

### **Debug Commands**
```bash
# Check command status
php artisan schedule:list

# Test performance calculation
php artisan operators:check-performance --days=7

# View command output
php artisan operators:check-performance -v
```

## Benefits

### **For Management**
- **Proactive Monitoring**: Identify issues before they become problems
- **Performance Insights**: Data-driven decision making
- **Resource Optimization**: Better operator allocation
- **Quality Assurance**: Maintain inspection standards

### **For Operators**
- **Clear Expectations**: Understand performance requirements
- **Support Identification**: Get help when needed
- **Performance Recognition**: Acknowledge good work
- **Development Opportunities**: Identify training needs

### **For the Organization**
- **Improved Efficiency**: Better resource utilization
- **Quality Maintenance**: Consistent inspection standards
- **Risk Reduction**: Early problem identification
- **Compliance Support**: Track inspection completion

## Future Enhancements

### **Planned Features**
- **Real-time Notifications**: Instant alerts for critical issues
- **Performance Trends**: Advanced analytics and forecasting
- **Training Recommendations**: AI-powered development suggestions
- **Integration**: Slack, Teams, and other notification systems

### **Customization Options**
- **Role-based Thresholds**: Different standards for different roles
- **Department-specific Metrics**: Tailored performance criteria
- **Custom Alert Rules**: Flexible notification conditions
- **Performance Goals**: Individual and team targets

## Support

For technical support or feature requests:
1. Check the troubleshooting section above
2. Review the system logs
3. Contact the development team
4. Submit enhancement requests through the appropriate channels

---

**Note**: This system is designed to support operators, not punish them. Use the insights to provide training, support, and resources that help operators succeed.
