📋 PK SERVIZI - API Routes & RBAC Documentation
🏗️ System Architecture
Tech Stack:

Mobile App: Flutter
Admin Portal: React
Backend API: NestJS + PostgreSQL
Authentication: JWT (Access + Refresh Tokens)
Payments: Stripe
Storage: S3-compatible


🔐 RBAC (Role-Based Access Control) System
Roles Hierarchy
┌─────────────────────────────────────────────────────────┐
│                      SUPER ADMIN                         │
│  • Full system access                                    │
│  • Manage all users, roles, permissions                  │
│  • System configuration                                  │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼────────┐
│     ADMIN      │                    │    OPERATOR     │
│  • View all    │                    │  • Assigned     │
│  • Assign      │                    │    requests     │
│  • Reports     │                    │  • Update       │
│  • User mgmt   │                    │    status       │
└────────────────┘                    │  • Documents    │
                                      └─────────────────┘
                                              │
                                      ┌───────▼───────┐
                                      │   CUSTOMER    │
                                      │  • Own data   │
                                      │  • Requests   │
                                      │  • Documents  │
                                      └───────────────┘
Permission Structure
Permissions follow the pattern: resource:action
Examples:

users:read - View users
users:write - Create/update users
users:delete - Delete users
service_requests:read - View service requests
service_requests:assign - Assign requests to operators
payments:refund - Process refunds


🔄 User Flow Diagrams
Customer Flow
┌─────────────┐
│   REGISTER  │ → Email verification
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    LOGIN    │ → JWT tokens issued
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  SELECT PLAN        │ → Choose subscription
│  (Monthly/Annual)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  STRIPE PAYMENT     │ → Pay via Stripe
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  ACTIVE ACCOUNT     │
└──────┬──────────────┘
       │
       ├────→ Create Service Request (ISEE/730/IMU)
       │      │
       │      ├─→ Fill form data
       │      ├─→ Upload documents
       │      ├─→ Submit request
       │      └─→ Track status
       │
       ├────→ Book Appointments
       │      │
       │      ├─→ Select date/time
       │      ├─→ Choose service type
       │      └─→ Confirm booking
       │
       ├────→ Enroll in Courses
       │
       ├────→ View Notifications
       │
       └────→ Manage Profile & Family Members
Admin/Operator Flow
┌─────────────┐
│    LOGIN    │ → JWT with role-based permissions
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   DASHBOARD         │
│  • Pending requests │
│  • Appointments     │
│  • Notifications    │
└──────┬──────────────┘
       │
       ├────→ MANAGE SERVICE REQUESTS
       │      │
       │      ├─→ View all requests (Admin) / Assigned requests (Operator)
       │      ├─→ Assign to operators (Admin only)
       │      ├─→ Review documents
       │      ├─→ Approve/Reject documents
       │      ├─→ Request additional documents
       │      ├─→ Update status
       │      ├─→ Add internal notes
       │      └─→ Mark as completed
       │
       ├────→ MANAGE USERS
       │      │
       │      ├─→ View all users
       │      ├─→ View user details
       │      ├─→ Manage subscriptions
       │      ├─→ Assign roles/permissions
       │      └─→ Activate/deactivate accounts
       │
       ├────→ MANAGE APPOINTMENTS
       │      │
       │      ├─→ View calendar
       │      ├─→ Create slots
       │      ├─→ Assign operators
       │      └─→ Reschedule/Cancel
       │
       ├────→ MANAGE COURSES
       │      │
       │      ├─→ Create/edit courses
       │      ├─→ View enrollments
       │      └─→ Issue certificates
       │
       ├────→ REPORTS & ANALYTICS
       │      │
       │      ├─→ Service request metrics
       │      ├─→ Revenue reports
       │      ├─→ User activity
       │      └─→ Export data
       │
       └────→ MANAGE CONTENT (CMS)
              │
              ├─→ Create/edit FAQs
              ├─→ Post news/updates
              └─→ Manage pages

📍 API Routes Documentation
Base URL: https://api.pkservizi.com/api/v1

🔐 1. AUTHENTICATION & AUTHORIZATION
Public Routes
MethodEndpointDescriptionRequest BodyPOST/auth/registerRegister new user{ email, password, full_name, fiscal_code, phone, gdpr_consent, privacy_consent }POST/auth/loginUser login{ email, password }POST/auth/refreshRefresh access token{ refresh_token }POST/auth/forgot-passwordRequest password reset{ email }POST/auth/reset-passwordReset password{ token, new_password }POST/auth/verify-emailVerify email address{ token }POST/auth/resend-verificationResend verification email{ email }
Protected Routes
MethodEndpointDescriptionPermission RequiredPOST/auth/logoutLogout userAuthenticatedPOST/auth/change-passwordChange passwordAuthenticatedGET/auth/meGet current user infoAuthenticated

👥 2. USER MANAGEMENT
Customer Routes (Mobile App)
MethodEndpointDescriptionPermissionGET/users/profileGet own profileusers:read_ownPUT/users/profileUpdate own profileusers:write_ownGET/users/profile/extendedGet extended profileusers:read_ownPUT/users/profile/extendedUpdate extended profileusers:write_ownPOST/users/avatarUpload avatarusers:write_ownDELETE/users/avatarDelete avatarusers:write_own
Admin Routes (Admin Portal)
MethodEndpointDescriptionPermissionGET/usersList all usersusers:readGET/users/:idGet user by IDusers:readPUT/users/:idUpdate userusers:writeDELETE/users/:idDelete userusers:deletePATCH/users/:id/activateActivate userusers:writePATCH/users/:id/deactivateDeactivate userusers:writeGET/users/:id/activityGet user activityusers:readGET/users/:id/subscriptionsGet user subscriptionssubscriptions:read

👨‍👩‍👧‍👦 3. FAMILY MEMBERS
Customer Routes
MethodEndpointDescriptionPermissionGET/family-membersList own family membersfamily_members:read_ownPOST/family-membersAdd family memberfamily_members:write_ownGET/family-members/:idGet family memberfamily_members:read_ownPUT/family-members/:idUpdate family memberfamily_members:write_ownDELETE/family-members/:idDelete family memberfamily_members:delete_own
Admin Routes
MethodEndpointDescriptionPermissionGET/family-members/user/:userIdList user's family membersfamily_members:read

🔑 4. ROLES & PERMISSIONS
Admin Routes Only
MethodEndpointDescriptionPermissionGET/rolesList all rolesroles:readPOST/rolesCreate roleroles:writeGET/roles/:idGet role detailsroles:readPUT/roles/:idUpdate roleroles:writeDELETE/roles/:idDelete roleroles:deleteGET/permissionsList all permissionspermissions:readPOST/roles/:id/permissionsAssign permissions to roleroles:writeDELETE/roles/:roleId/permissions/:permissionIdRemove permission from roleroles:writePOST/users/:id/rolesAssign role to userusers:writePOST/users/:id/permissionsAssign direct permission to userusers:write

💳 5. SUBSCRIPTIONS & PAYMENTS
Customer Routes
MethodEndpointDescriptionPermissionGET/subscription-plansList available plansPublicGET/subscriptions/myGet my active subscriptionsubscriptions:read_ownPOST/subscriptions/checkoutCreate checkout sessionsubscriptions:write_ownPOST/subscriptions/cancelCancel subscriptionsubscriptions:write_ownPOST/subscriptions/upgradeUpgrade plansubscriptions:write_ownGET/payments/myList my paymentspayments:read_ownGET/payments/:id/receiptDownload receiptpayments:read_own
Admin Routes
MethodEndpointDescriptionPermissionGET/subscription-plans/allList all plans (including inactive)subscription_plans:readPOST/subscription-plansCreate plansubscription_plans:writePUT/subscription-plans/:idUpdate plansubscription_plans:writeDELETE/subscription-plans/:idDelete plansubscription_plans:deleteGET/subscriptionsList all subscriptionssubscriptions:readGET/subscriptions/:idGet subscription detailssubscriptions:readPATCH/subscriptions/:id/statusUpdate subscription statussubscriptions:writePOST/payments/:id/refundProcess refundpayments:refundGET/paymentsList all paymentspayments:read
Webhook Routes
MethodEndpointDescriptionPOST/webhooks/stripeStripe webhook handler

🛎️ 6. SERVICE TYPES & REQUESTS
Public/Customer Routes
MethodEndpointDescriptionPermissionGET/service-typesList active service typesPublicGET/service-types/:idGet service type detailsPublicGET/service-types/:id/schemaGet form schemaPublic
Customer Service Request Routes
MethodEndpointDescriptionPermissionGET/service-requests/myList my service requestsservice_requests:read_ownPOST/service-requestsCreate service requestservice_requests:write_ownGET/service-requests/:idGet request detailsservice_requests:read_ownPUT/service-requests/:idUpdate draft requestservice_requests:write_ownPOST/service-requests/:id/submitSubmit requestservice_requests:write_ownDELETE/service-requests/:idDelete draft requestservice_requests:delete_ownGET/service-requests/:id/status-historyGet status historyservice_requests:read_ownPOST/service-requests/:id/notesAdd user noteservice_requests:write_own
Admin/Operator Routes
MethodEndpointDescriptionPermissionGET/service-requestsList all requests (filtered)service_requests:readGET/service-requests/assigned-to-meList assigned requestsservice_requests:read_assignedPATCH/service-requests/:id/statusUpdate statusservice_requests:writePOST/service-requests/:id/assignAssign to operatorservice_requests:assignPUT/service-requests/:id/internal-notesUpdate internal notesservice_requests:writePATCH/service-requests/:id/priorityChange priorityservice_requests:writePOST/service-requests/:id/request-documentsRequest additional documentsservice_requests:write
Admin Service Type Management
MethodEndpointDescriptionPermissionPOST/service-typesCreate service typeservice_types:writePUT/service-types/:idUpdate service typeservice_types:writeDELETE/service-types/:idDelete service typeservice_types:deletePATCH/service-types/:id/activateActivate service typeservice_types:write

📄 7. DOCUMENTS
Customer Routes
MethodEndpointDescriptionPermissionPOST/documents/uploadUpload documentdocuments:write_ownGET/documents/request/:requestIdList request documentsdocuments:read_ownGET/documents/:idGet document detailsdocuments:read_ownGET/documents/:id/downloadDownload documentdocuments:read_ownPUT/documents/:idReplace documentdocuments:write_ownDELETE/documents/:idDelete documentdocuments:delete_own
Admin/Operator Routes
MethodEndpointDescriptionPermissionGET/documents/request/:requestId/allList all request documentsdocuments:readPATCH/documents/:id/approveApprove documentdocuments:approvePATCH/documents/:id/rejectReject documentdocuments:approvePOST/documents/:id/notesAdd admin notesdocuments:writeGET/documents/:id/previewPreview documentdocuments:read

📅 8. APPOINTMENTS
Customer Routes
MethodEndpointDescriptionPermissionGET/appointments/myList my appointmentsappointments:read_ownGET/appointments/available-slotsGet available time slotsPublicPOST/appointmentsBook appointmentappointments:write_ownGET/appointments/:idGet appointment detailsappointments:read_ownPATCH/appointments/:id/rescheduleReschedule appointmentappointments:write_ownDELETE/appointments/:idCancel appointmentappointments:delete_own
Admin/Operator Routes
MethodEndpointDescriptionPermissionGET/appointmentsList all appointmentsappointments:readGET/appointments/calendarGet calendar viewappointments:readPOST/appointments/createCreate appointment (admin)appointments:writePATCH/appointments/:id/assignAssign operatorappointments:assignPATCH/appointments/:id/statusUpdate statusappointments:writePOST/appointments/slotsCreate time slotsappointments:writeGET/appointments/operator/:operatorIdGet operator appointmentsappointments:read

🎓 9. COURSES
Customer Routes
MethodEndpointDescriptionPermissionGET/coursesList active coursesPublicGET/courses/:idGet course detailsPublicPOST/courses/:id/enrollEnroll in coursecourses:enrollGET/courses/my-enrollmentsList my enrollmentscourses:read_ownDELETE/courses/:id/unenrollUnenroll from coursecourses:enrollGET/courses/:id/certificateDownload certificatecourses:read_own
Admin Routes
MethodEndpointDescriptionPermissionGET/courses/allList all coursescourses:readPOST/coursesCreate coursecourses:writePUT/courses/:idUpdate coursecourses:writeDELETE/courses/:idDelete coursecourses:deleteGET/courses/:id/enrollmentsList course enrollmentscourses:readPATCH/courses/:id/publishPublish coursecourses:writePOST/courses/:id/certificate/issueIssue certificatecourses:write

🔔 10. NOTIFICATIONS
Customer Routes
MethodEndpointDescriptionPermissionGET/notifications/myList my notificationsnotifications:read_ownGET/notifications/unread-countGet unread countnotifications:read_ownPATCH/notifications/:id/readMark as readnotifications:write_ownPATCH/notifications/mark-all-readMark all as readnotifications:write_ownDELETE/notifications/:idDelete notificationnotifications:delete_own
Admin Routes
MethodEndpointDescriptionPermissionPOST/notifications/sendSend notificationnotifications:writePOST/notifications/broadcastBroadcast to all usersnotifications:broadcastPOST/notifications/send-to-roleSend to rolenotifications:write

📰 11. CMS CONTENT
Public Routes
MethodEndpointDescriptionGET/cms/pages/:slugGet page by slugGET/cms/newsList published newsGET/cms/news/:idGet news articleGET/cms/faqsList FAQs
Admin Routes
MethodEndpointDescriptionPermissionGET/cms/contentList all contentcms:readPOST/cms/contentCreate contentcms:writeGET/cms/content/:idGet contentcms:readPUT/cms/content/:idUpdate contentcms:writeDELETE/cms/content/:idDelete contentcms:deletePATCH/cms/content/:id/publishPublish contentcms:write

📊 12. REPORTS & ANALYTICS
Admin Routes Only
MethodEndpointDescriptionPermissionGET/reports/dashboardGet dashboard statsreports:readGET/reports/service-requestsService request metricsreports:readGET/reports/revenueRevenue reportsreports:readGET/reports/usersUser statisticsreports:readGET/reports/appointmentsAppointment analyticsreports:readGET/reports/exportExport report datareports:export

🔍 13. AUDIT LOGS
Admin Routes Only
MethodEndpointDescriptionPermissionGET/audit-logsList audit logsaudit_logs:readGET/audit-logs/user/:userIdGet user audit logsaudit_logs:readGET/audit-logs/resource/:type/:idGet resource audit logsaudit_logs:read

🔒 Authentication Flow
1. Registration & Login
1. POST /auth/register
   Response: { message, userId }

2. User verifies email via link
   POST /auth/verify-email

3. POST /auth/login
   Response: { 
     access_token, 
     refresh_token, 
     user: { id, email, role, permissions } 
   }

4. Store tokens securely:
   - Mobile: Secure Storage
   - Web: HttpOnly cookies (recommended) or secure localStorage
2. Making Authenticated Requests
Headers:
Authorization: Bearer {access_token}
3. Token Refresh
When access_token expires (401 response):

POST /auth/refresh
Body: { refresh_token }
Response: { access_token, refresh_token }
4. Logout
POST /auth/logout
Body: { refresh_token }

🛡️ Permission Checking Logic
Backend Middleware Flow
typescript// Example permission check
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('service_requests:read')
@Get('service-requests')
async getServiceRequests() {
  // Only users with 'service_requests:read' permission can access
}
Permission Resolution
User has permission IF:
1. User's role has the permission, OR
2. User has direct permission assigned

Permission check: 
- Exact match: 'service_requests:read'
- Wildcard: 'service_requests:*' (all actions on resource)
- Super admin: '*:*' (all permissions)

📱 Mobile App Route Structure
Bottom Navigation
Home (Dashboard)
  └─ /home

Services
  ├─ /services
  ├─ /services/isee
  ├─ /services/730
  └─ /services/imu

Appointments
  ├─ /appointments
  └─ /appointments/book

Profile
  ├─ /profile
  ├─ /profile/edit
  ├─ /profile/family-members
  ├─ /profile/subscription
  └─ /profile/settings
Service Request Flow Routes
/services/:type
  └─ /services/:type/new
      ├─ /services/:type/new/form
      ├─ /services/:type/new/documents
      ├─ /services/:type/new/review
      └─ /services/:type/new/success

/requests/:id
  ├─ /requests/:id/details
  ├─ /requests/:id/documents
  └─ /requests/:id/history

💻 Admin Portal Route Structure
Main Navigation
/admin
  ├─ /admin/dashboard
  ├─ /admin/service-requests
  │   ├─ /admin/service-requests/:id
  │   └─ /admin/service-requests/:id/edit
  ├─ /admin/users
  │   ├─ /admin/users/:id
  │   └─ /admin/users/:id/edit
  ├─ /admin/appointments
  │   ├─ /admin/appointments/calendar
  │   └─ /admin/appointments/:id
  ├─ /admin/courses
  │   ├─ /admin/courses/new
  │   ├─ /admin/courses/:id
  │   └─ /admin/courses/:id/enrollments
  ├─ /admin/subscriptions
  │   ├─ /admin/subscriptions/plans
  │   └─ /admin/subscriptions/payments
  ├─ /admin/reports
  │   ├─ /admin/reports/service-requests
  │   ├─ /admin/reports/revenue
  │   └─ /admin/reports/users
  ├─ /admin/cms
  │   ├─ /admin/cms/pages
  │   ├─ /admin/cms/news
  │   └─ /admin/cms/faqs
  └─ /admin/settings
      ├─ /admin/settings/roles
      ├─ /admin/settings/permissions
      └─ /admin/settings/service-types

🚀 Quick Start Examples
Customer - Create Service Request
javascript// 1. Get service type schema
GET /service-types/isee

// 2. Create draft request
POST /service-requests
{
  "service_type_id": "uuid",
  "form_data": {
    "nucleo_familiare": [...],
    "abitazione": {...},
    ...
  }
}

// 3. Upload documents
POST /documents/upload
FormData: {
  service_request_id: "uuid",
  category: "carta_identita",
  file: File
}

// 4. Submit request
POST /service-requests/{id}/submit
Admin - Process Service Request
javascript// 1. Get pending requests
GET /service-requests?status=submitted

// 2. Assign to operator
POST /service-requests/{id}/assign
{
  "operator_id": "uuid"
}

// 3. Review documents
GET /documents/request/{requestId}/all

// 4. Approve/Reject document
PATCH /documents/{id}/approve
// or
PATCH /documents/{id}/reject
{
  "admin_notes": "Need clearer photo"
}

// 5. Update status
PATCH /service-requests/{id}/status
{
  "status": "in_review",
  "notes": "Processing documents"
}

📝 Status Values Reference
Service Request Statuses

draft - Not yet submitted
submitted - Awaiting review
in_review - Being processed
missing_documents - Additional documents required
completed - Successfully processed
rejected - Request rejected
closed - Archived

Document Statuses

pending - Awaiting review
approved - Document accepted
rejected - Document rejected
replaced - New version uploaded

Appointment Statuses

scheduled - Confirmed
confirmed - Confirmed by user
cancelled - Cancelled
completed - Finished
no_show - User didn't attend

Payment Statuses

pending - Awaiting payment
processing - Being processed
succeeded - Payment successful
failed - Payment failed
refunded - Payment refunded


🔧 Environment Variables
env# App
NODE_ENV=production
PORT=3000
API_URL=https://api.pkservizi.com
FRONTEND_URL=https://app.pkservizi.com
ADMIN_URL=https://admin.pkservizi.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pk_servizi
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_API_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_SUCCESS_URL=https://app.pkservizi.com/payment/success
STRIPE_CANCEL_URL=https://app.pkservizi.com/payment/cancel

# S3/Storage
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=eu-south-1
AWS_S3_BUCKET=pk-servizi-documents

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@pkservizi.com
SMTP_PASSWORD=xxx
EMAIL_FROM=PK SERVIZI <noreply@pkservizi.com>

# Redis (Optional - for caching)
REDIS_HOST=localhost
REDIS_PORT=6379

📞 Support
For API support and questions:

Email: dev@pkservizi.com
Documentation: https://docs.pkservizi.com
Status Page: https://status.pkservizi.com


📄 License
Proprietary - © 2024 PK SERVIZI. All rights reserved.