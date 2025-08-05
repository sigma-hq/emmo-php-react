# CSV Export Feature for Maintenance Data

## Overview
The application now supports exporting maintenance records to CSV format, allowing users to download and analyze maintenance data in spreadsheet applications like Excel, Google Sheets, or LibreOffice Calc.

## Features

### 1. Global Maintenance Export
- **Location**: Maintenances page (`/maintenances`)
- **Access**: Available to all authenticated users
- **Scope**: Exports all maintenance records the user has access to based on their role
- **Filters**: Respects current search and status filters

### 2. Drive-Specific Maintenance Export
- **Location**: Individual drive maintenance tab
- **Access**: Available to all authenticated users
- **Scope**: Exports only maintenance records for the specific drive
- **Filename**: Includes drive name and reference for easy identification

## CSV Data Fields

The exported CSV file includes the following columns:

1. **ID** - Maintenance record ID
2. **Title** - Maintenance title/description
3. **Description** - Detailed description (if available)
4. **Drive Name** - Name of the drive
5. **Drive Reference** - Drive reference number
6. **Maintenance Date** - Scheduled maintenance date
7. **Technician** - Assigned technician (or "Not assigned")
8. **Status** - Current status (Pending, In Progress, Completed)
9. **Cost** - Maintenance cost (formatted as currency)
10. **Parts Replaced** - List of replaced parts (semicolon-separated)
11. **Created By** - User who created the record
12. **Created At** - Record creation timestamp
13. **Updated At** - Last update timestamp
14. **Total Tasks** - Number of checklist tasks
15. **Completed Tasks** - Number of completed tasks
16. **Failed Tasks** - Number of failed tasks

## Usage

### Exporting All Maintenance Records
1. Navigate to the Maintenances page
2. Apply any desired filters (search, status)
3. Click the "Export CSV" button in the page header or filters bar
4. The CSV file will download automatically

### Exporting Drive-Specific Maintenance Records
1. Navigate to a specific drive's page
2. Go to the Maintenance tab
3. Click the "Export CSV" button
4. The CSV file will download with a filename including the drive information

## Security & Permissions

- **Admin Users**: Can export all maintenance records
- **Operator Users**: Can only export maintenance records they created or are assigned to
- **Authentication Required**: All export features require user authentication
- **Data Filtering**: Export respects the same permission rules as the web interface

## File Format

- **Encoding**: UTF-8
- **Delimiter**: Comma (,)
- **Text Qualifier**: Double quotes (") for fields containing commas, quotes, or newlines
- **Filename Format**: 
  - Global: `maintenance_records_YYYY-MM-DD_HH-MM-SS.csv`
  - Drive-specific: `maintenance_records_[DriveName]_[DriveRef]_YYYY-MM-DD_HH-MM-SS.csv`

## Technical Implementation

### Backend
- **Controller**: `MaintenanceController`
- **Methods**: 
  - `export()` - Global maintenance export
  - `exportForDrive()` - Drive-specific export
- **Routes**:
  - `GET /maintenances/export` - Global export
  - `GET /drives/{drive}/maintenances/export` - Drive-specific export

### Frontend
- **Components**: Updated maintenance pages with export buttons
- **User Feedback**: Success notifications when export is initiated
- **Filter Integration**: Export respects current page filters

## Benefits

1. **Data Analysis**: Easy import into spreadsheet applications for analysis
2. **Reporting**: Generate reports and charts from maintenance data
3. **Backup**: Create local copies of maintenance records
4. **Compliance**: Export data for audit or compliance purposes
5. **Integration**: Import data into other systems or tools

## Future Enhancements

Potential future improvements could include:
- Date range filtering for exports
- Custom field selection
- Export scheduling
- Email delivery of exports
- Additional file formats (Excel, PDF)
- Export templates for different use cases 