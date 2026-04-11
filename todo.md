# Eyeworld Marketing Approval Workflow - TODO

## Phase 1: Database & Schema
- [x] Design and implement database schema (users, workflow_requests, activity_logs)
- [x] Create Drizzle migrations
- [x] Set up database helper functions

## Phase 2: Backend API & Authentication
- [x] Implement user authentication with role-based access control
- [x] Create access request procedure (request_access)
- [x] Create workflow request procedures (create_request, update_status, add_comment, send_update)
- [x] Implement email notification system
- [ ] Write backend tests for core procedures

## Phase 3: Frontend Authentication & Layout
- [x] Build login/access request page
- [x] Create DashboardLayout with sidebar navigation
- [x] Implement role-based route protection
- [x] Set up global styling with Editorial design system

## Phase 4: Core Pages - Dashboard & Request Management
- [x] Build Dashboard page with request list and status filters
- [x] Build Create Request form page
- [x] Build Request Details page with full request view
- [x] Implement status update controls
- [x] Add comment input and Send Update button

## Phase 5: Admin Features
- [x] Build Settings page for admin user management
- [x] Implement user list with role and access status display
- [x] Add user role/status management controls

## Phase 6: Approval Timeline & Notifications
- [x] Build approval timeline component (vertical activity feed)
- [x] Parse and display history logs
- [x] Implement real-time notification display
- [x] Test notification flow for status changes and team updates

## Phase 7: Design System & Polish
- [x] Apply Editorial design colors and typography
- [ ] Implement glassmorphism navigation bar
- [x] Apply tonal layering without borders
- [x] Ensure 8px border radius throughout
- [ ] Responsive design and accessibility review

## Phase 8: Testing & Delivery
- [ ] Write comprehensive vitest tests
- [ ] Manual testing of all workflows
- [ ] Performance and accessibility review
- [ ] Create final checkpoint and prepare for deployment
