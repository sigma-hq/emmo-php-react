# Handout Notes System

## Overview

The Handout Notes system allows team members to create, manage, and collaborate on maintenance notes organized by category. The system automatically archives notes weekly and tracks the most recent activity on each note.

## Features

### 1. Note Management
- Create notes in 5 categories: Electrical, Mechanical, Hydraulic, Workshop, and Utilities
- Edit and delete your own notes
- Rich text content with title and description
- User attribution and timestamps

### 2. Comments System
- Add comments to any note
- Edit and delete your own comments
- Real-time collaboration and discussion
- Comment timestamps and user attribution

### 3. Weekly Archiving
- **Automatic Archiving**: Notes are automatically archived every Sunday at 1 AM
- **Current Week**: Notes from Sunday to Saturday of the current week
- **Archived Notes**: Notes from previous weeks, accessible in a separate tab
- **Reference Access**: Archived notes remain fully functional for viewing and commenting

### 4. Activity Tracking
- **Most Recent Activity**: Notes are ordered by the most recent activity (either note update or latest comment)
- **Recent Activity Badge**: Visual indicator for notes with recent comments
- **Timestamp Display**: Shows creation, update, and last activity times

## Technical Implementation

### Backend

#### Models
- `HandoutNote`: Main note entity with relationships to users and comments
- `HandoutComment`: Comment entity with relationships to notes and users

#### Controllers
- `HandoutNoteController`: Manages note CRUD operations and archiving logic
- `HandoutCommentController`: Handles comment operations

#### Scheduling
- **Command**: `handout-notes:archive` - Archives notes from the previous week
- **Schedule**: Runs every Sunday at 1 AM via Laravel Task Scheduler
- **Logic**: Notes created before the current week's Sunday are considered archived

### Frontend

#### Components
- **Main Page**: `handout-notes.tsx` - Main interface with tabs for current and archived notes
- **Comment Section**: `handout-comment-section.tsx` - Comment display and creation
- **Individual Comment**: `handout-comment.tsx` - Single comment with edit/delete functionality

#### State Management
- Separate state for current and archived notes
- Real-time updates for comments
- Search functionality across both current and archived notes

## Usage

### Creating Notes
1. Navigate to Handout Notes
2. Click "Add Note"
3. Fill in title, category, and content
4. Submit to create the note

### Adding Comments
1. Scroll to the comments section of any note
2. Type your comment in the text area
3. Press Enter or click "Post Comment"

### Viewing Archived Notes
1. Click the "Archived Notes" tab
2. Browse notes by category
3. Archived notes are visually distinguished with a gray background and "Archived" badge

### Searching
1. Use the search bar to find notes by title, content, or author
2. Search works across both current and archived notes
3. Results are highlighted and categorized

## Archiving Schedule

- **Archive Day**: Every Sunday
- **Archive Time**: 1:00 AM
- **Archive Logic**: Notes created before the current week's Sunday are moved to archived view
- **Data Retention**: Notes are not deleted, only moved to archived status

## Activity Ordering

Notes are automatically ordered by the most recent activity:
1. **Note Updates**: When a note is edited
2. **Comment Activity**: When new comments are added
3. **Creation Time**: When the note was originally created

The system calculates the `most_recent_activity` timestamp by comparing:
- Note's `updated_at` timestamp
- Most recent comment's `created_at` timestamp

## Categories

1. **Electrical**: Electrical systems, wiring, and electrical maintenance
2. **Mechanical**: Mechanical systems, machinery, and mechanical maintenance
3. **Hydraulic**: Hydraulic systems, pumps, and fluid systems
4. **Workshop**: General workshop activities and tools
5. **Utilities**: Building utilities, HVAC, and general facility systems

## Permissions

- **Create Notes**: All authenticated users
- **Edit Notes**: Only the note creator
- **Delete Notes**: Only the note creator
- **Add Comments**: All authenticated users
- **Edit Comments**: Only the comment creator
- **Delete Comments**: Only the comment creator

## Maintenance

### Manual Archiving
To manually run the archive command:
```bash
php artisan handout-notes:archive
```

### Scheduler Setup
Ensure the Laravel Task Scheduler is running:
```bash
# Add to crontab
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### Database Considerations
- Notes are not physically moved or deleted during archiving
- Archiving is implemented through date-based filtering
- Consider implementing a cleanup strategy for very old archived notes if needed

## Future Enhancements

- **Note Templates**: Pre-defined templates for common maintenance tasks
- **File Attachments**: Support for images and documents
- **Advanced Search**: Filter by date ranges, categories, and activity levels
- **Export Functionality**: Export notes and comments to PDF or Excel
- **Notification System**: Notify users of new comments on their notes
- **Bulk Operations**: Bulk edit, delete, or archive operations
