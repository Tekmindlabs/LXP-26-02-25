# Teacher-Campus Relationship UI Implementation

This document outlines the UI implementation for the teacher-campus relationship feature, which establishes a direct many-to-many relationship between teachers and campuses.

## Overview

The UI implementation includes several components that allow users to:
- View and manage teacher assignments to campuses
- Set primary campus for teachers
- Activate/deactivate teachers at specific campuses
- Filter and search for teachers by campus

## Components

### 1. CampusTeacherManagement Component

**Location**: `src/components/dashboard/roles/super-admin/campus/CampusTeacherManagement.tsx`

This component is used in the campus view to manage teachers assigned to a specific campus. It provides functionality to:
- View all teachers assigned to a campus
- Add new teachers to a campus
- Remove teachers from a campus
- Set a teacher's primary campus
- Activate/deactivate teachers at the campus
- Filter to include inactive teachers

**Key Features**:
- Dialog for adding teachers with primary campus option
- Table view of all assigned teachers with status indicators
- Primary campus badge for teachers with this campus as their primary
- Action buttons for managing teacher-campus relationships

### 2. TeacherCampusAssignment Component

**Location**: `src/components/dashboard/roles/super-admin/teacher/TeacherCampusAssignment.tsx`

This component is used in the teacher profile view to manage campus assignments for a specific teacher. It provides functionality to:
- View all campuses assigned to a teacher
- Add new campus assignments
- Remove campus assignments
- Set a primary campus

**Key Features**:
- Form for adding new campus assignments with primary campus option
- List view of all assigned campuses with status indicators
- Primary campus badge for the teacher's primary campus

### 3. TeacherForm Component Updates

**Location**: `src/components/dashboard/roles/super-admin/teacher/TeacherForm.tsx`

The TeacherForm component has been updated to include campus assignment functionality when creating or editing a teacher. It now includes:
- Multi-select for assigning multiple campuses
- Dropdown for selecting a primary campus
- Logic to handle campus assignments during teacher creation/update

**Key Features**:
- Campus assignment section in the form
- Primary campus selection based on assigned campuses
- Automatic handling of campus assignments when saving the form

### 4. TeacherProfileView Component Updates

**Location**: `src/components/dashboard/roles/super-admin/teacher/TeacherProfileView.tsx`

The TeacherProfileView component has been updated to display campus assignments in the teacher profile and to include a new "Campuses" tab. It now includes:
- Display of assigned campuses in the profile tab
- New "Campuses" tab that shows the TeacherCampusAssignment component
- Status and primary campus indicators

## API Integration

The UI components integrate with the following API endpoints:

### Campus Router Endpoints:
- `getTeachers`: Retrieves teachers for a specific campus
- `assignTeacherToCampus`: Assigns a teacher to a campus
- `removeTeacherFromCampus`: Removes a teacher from a campus
- `setPrimaryCampus`: Sets a campus as the primary campus for a teacher
- `updateTeacherCampusStatus`: Updates the status of a teacher at a campus

### Teacher Router Endpoints:
- `getTeacherCampuses`: Retrieves campuses assigned to a specific teacher

## Usage Examples

### Managing Teachers in a Campus:

1. Navigate to the campus view
2. Select the "Teachers" tab
3. Use the "Add Teacher" button to assign new teachers
4. Use the action buttons to set primary campus or remove teachers

### Managing Campuses for a Teacher:

1. Navigate to the teacher profile
2. View assigned campuses in the profile tab
3. Select the "Campuses" tab to manage campus assignments
4. Use the form to add new campus assignments or set primary campus

## Benefits

The UI implementation for the teacher-campus relationship provides several benefits:

1. **Improved User Experience**: Direct management of teacher-campus relationships without navigating through classes
2. **Clearer Visibility**: Easy identification of primary campuses and teacher status at each campus
3. **Streamlined Workflow**: Simplified process for assigning teachers to multiple campuses
4. **Better Data Management**: Clear separation of concerns between teacher-campus and teacher-class relationships

## Future Enhancements

Potential future enhancements to the UI implementation include:

1. **Bulk Operations**: Add functionality to assign or remove multiple teachers at once
2. **Advanced Filtering**: Enhance filtering options for teachers by specialization, type, etc.
3. **Reporting**: Add reporting features to analyze teacher distribution across campuses
4. **Notifications**: Implement notifications for changes to teacher-campus assignments
5. **Mobile Optimization**: Further optimize the UI for mobile devices

## Conclusion

The UI implementation for the teacher-campus relationship provides a comprehensive solution for managing the direct relationship between teachers and campuses. It integrates seamlessly with the existing application structure and provides an intuitive user experience for administrators managing teacher assignments. 