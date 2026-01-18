# Maintenance Ticketing System V3 - Complete Design Document

## Table of Contents
1. [Sitemap](#1-sitemap)
2. [Ticket Lifecycle State Machine](#2-ticket-lifecycle-state-machine)
3. [User Journeys](#3-user-journeys)
4. [Screen Specifications](#4-screen-specifications)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [SLA/Reminders/Escalations](#7-slaremindersescalations)
8. [KPI Definitions](#8-kpi-definitions)
9. [V3 Pro Upgrades](#9-v3-pro-upgrades)

---

## 1. Sitemap

### 1.1 Customer Portal
```
/                           → Portal Selector (Customer / Employee)
/customer                   → Customer Portal Home
├── /customer/dashboard     → Customer Dashboard (My Tickets)
├── /customer/create        → Create Ticket Wizard (3 Steps)
└── /customer/track         → Track Ticket (Public via Token)
    └── /customer/track/[token]
```

### 1.2 Admin/Dispatcher Portal
```
/admin                      → Admin Dashboard
├── /admin/tickets          → Tickets Management (Grid + Map)
│   └── /admin/tickets/[id] → Ticket Details
├── /admin/technicians      → Technicians Management
├── /admin/escalations      → Escalations Center
├── /admin/reports          → Reports & Analytics
│   ├── /admin/reports/kpi  → KPI Dashboard
│   └── /admin/reports/sla  → SLA Compliance
├── /admin/settings         → System Settings
└── /admin/users            → Users Management
```

### 1.3 Technician Portal
```
/technician                 → Technician Dashboard
├── /technician/tasks       → My Tasks (List + Map)
│   └── /technician/tasks/[id] → Task Details & Actions
├── /technician/schedule    → My Schedule (Calendar)
├── /technician/performance → My Performance Stats
└── /technician/profile     → Profile & Settings
```

### 1.4 Supervisor Portal (Optional)
```
/supervisor                 → Supervisor Dashboard
├── /supervisor/team        → Team Overview
├── /supervisor/tickets     → Team Tickets
└── /supervisor/escalations → Team Escalations
```

---

## 2. Ticket Lifecycle State Machine

### 2.1 Status Definitions

| Status | Arabic | Description | Portal Display |
|--------|--------|-------------|----------------|
| `new` | جديدة | Ticket just created | Customer: تم استلام طلبك |
| `assigned` | تم الإسناد | Technician assigned | Customer: تم تعيين فني |
| `scheduled` | مجدولة | Visit scheduled | Customer: تم تحديد موعد الزيارة |
| `on_route` | في الطريق | Tech traveling | Customer: الفني في الطريق إليك |
| `arrived` | وصل الموقع | Tech arrived | Customer: الفني وصل |
| `inspecting` | جاري الفحص | Inspection started | Customer: جاري فحص الجهاز |
| `diagnosed` | تم التشخيص | Diagnosis complete | Customer: تم تحديد المشكلة |
| `repairing` | جاري الإصلاح | Repair in progress | Customer: جاري الإصلاح |
| `waiting_parts` | بانتظار قطع | Parts ordered | Customer: بانتظار قطع الغيار |
| `pickup_device` | سحب الجهاز | Device picked up | Customer: تم سحب الجهاز للورشة |
| `in_workshop` | في الورشة | At workshop | Customer: الجهاز في الورشة |
| `ready_delivery` | جاهز للتسليم | Ready for return | Customer: جاهز للتسليم |
| `completed` | مكتملة | Successfully done | Customer: تم الإصلاح بنجاح |
| `not_fixed` | لم يتم الإصلاح | Could not fix | Customer: تعذر الإصلاح |
| `cancelled` | ملغاة | Cancelled | Customer: تم إلغاء الطلب |

### 2.2 State Transition Diagram (Text)

```
                                    ┌─────────────┐
                                    │    NEW      │
                                    └──────┬──────┘
                                           │ assign
                                    ┌──────▼──────┐
                              ┌─────│  ASSIGNED   │─────┐
                              │     └──────┬──────┘     │
                              │            │ schedule   │ cancel
                              │     ┌──────▼──────┐     │
                              │     │  SCHEDULED  │─────┤
                              │     └──────┬──────┘     │
                              │            │ start_trip │
                              │     ┌──────▼──────┐     │
                              │     │  ON_ROUTE   │─────┤
                              │     └──────┬──────┘     │
                              │            │ arrive     │
                              │     ┌──────▼──────┐     │
                              │     │   ARRIVED   │     │
                              │     └──────┬──────┘     │
                              │            │ start_inspection
                              │     ┌──────▼──────┐     │
                              │     │ INSPECTING  │     │
                              │     └──────┬──────┘     │
                              │            │ complete_diagnosis
                              │     ┌──────▼──────┐     │
                              │     │  DIAGNOSED  │     │
                              │     └──────┬──────┘     │
                              │            │            │
              ┌───────────────┼────────────┼────────────┼───────────────┐
              │               │            │            │               │
              ▼               ▼            ▼            ▼               ▼
       ┌──────────┐    ┌──────────┐ ┌──────────┐ ┌──────────┐    ┌──────────┐
       │ REPAIRING│    │WAIT_PARTS│ │NOT_FIXED │ │ PICKUP   │    │CANCELLED │
       └────┬─────┘    └────┬─────┘ └──────────┘ └────┬─────┘    └──────────┘
            │               │                         │
            │               │ parts_received          │
            │               ▼                         ▼
            │        ┌──────────┐              ┌──────────┐
            │        │ REPAIRING│              │IN_WORKSHOP│
            │        └────┬─────┘              └────┬─────┘
            │             │                         │
            ▼             ▼                         ▼
       ┌──────────┐                          ┌──────────┐
       │COMPLETED │                          │READY_DEL │
       └──────────┘                          └────┬─────┘
                                                  │
                                                  ▼
                                            ┌──────────┐
                                            │COMPLETED │
                                            └──────────┘
```

### 2.3 Transition Rules Table

| From | To | Action | Actor | Requirements |
|------|-----|--------|-------|--------------|
| new | assigned | assign | Admin/Supervisor | technician_id required |
| new | cancelled | cancel | Admin/Customer | reason required |
| assigned | scheduled | schedule | Admin/Tech | date + time_slot required |
| assigned | cancelled | cancel | Admin | reason required |
| scheduled | on_route | start_trip | Technician | GPS location required |
| scheduled | cancelled | cancel | Admin/Customer | reason, >24h notice |
| on_route | arrived | arrive | Technician | GPS location required |
| arrived | inspecting | start_inspection | Technician | min 1 photo required |
| inspecting | diagnosed | complete_diagnosis | Technician | diagnosis notes required |
| diagnosed | repairing | start_repair | Technician | - |
| diagnosed | waiting_parts | request_parts | Technician | parts request required |
| diagnosed | not_fixed | mark_not_fixed | Technician | reasons checklist required |
| diagnosed | pickup_device | pickup_device | Technician | reason + optional photos |
| repairing | completed | mark_completed | Technician | min 3 photos + customer sign/OTP |
| repairing | not_fixed | mark_not_fixed | Technician | reasons required |
| repairing | waiting_parts | request_parts | Technician | parts request required |
| waiting_parts | repairing | parts_received | Admin/Tech | - |
| waiting_parts | cancelled | cancel | Admin | reason required |
| pickup_device | in_workshop | check_in_workshop | Workshop | - |
| in_workshop | ready_delivery | repair_complete | Workshop | - |
| in_workshop | not_fixed | mark_not_fixed | Workshop | reasons required |
| ready_delivery | completed | deliver_device | Technician | customer sign/OTP required |

### 2.4 Role Permissions per Transition

```typescript
const TRANSITION_PERMISSIONS = {
  assign: ['admin', 'supervisor'],
  cancel: ['admin', 'supervisor', 'customer'],
  schedule: ['admin', 'supervisor', 'technician'],
  start_trip: ['technician'],
  arrive: ['technician'],
  start_inspection: ['technician'],
  complete_diagnosis: ['technician'],
  start_repair: ['technician'],
  request_parts: ['technician'],
  mark_not_fixed: ['technician', 'workshop'],
  pickup_device: ['technician'],
  mark_completed: ['technician'],
  parts_received: ['admin', 'technician'],
  check_in_workshop: ['workshop', 'admin'],
  repair_complete: ['workshop'],
  deliver_device: ['technician'],
};
```

---

## 3. User Journeys

### 3.1 Customer Journey: Create & Track Ticket

```
1. Customer lands on Homepage
   └── Clicks "Customer Portal"

2. Customer Portal Home
   ├── If logged in → Dashboard with tickets
   └── If guest → Options: "Create Ticket" or "Track Ticket"

3. Create Ticket Wizard
   ├── Step 1: Customer Info
   │   ├── Enter: Name, Phone, City, Address
   │   ├── Pick location on map
   │   └── Click "Next"
   │
   ├── Step 2: Device & Problem
   │   ├── Select device type (cards)
   │   ├── Enter: Brand, Model, Problem description
   │   ├── Select preferred time slot
   │   └── Click "Next"
   │
   └── Step 3: Warranty Info
       ├── Select warranty status (Yes/No/Unknown)
       ├── If Yes: Enter invoice/serial, upload photo
       ├── If No: See fee disclaimer
       └── Click "Submit"

4. Success Page
   ├── See Ticket ID & Tracking Token
   ├── Copy tracking token
   └── Click "Track Ticket" or "Home"

5. Tracking Page
   ├── Enter tracking token
   ├── See ticket summary card
   ├── See status timeline with updates
   ├── If "On Route": See technician on map
   └── Optional: Add more info if requested
```

### 3.2 Technician Journey: Execute Task

```
1. Technician logs in
   └── Redirect to Technician Dashboard

2. Dashboard
   ├── See KPI tiles (Assigned, In Progress, Completed...)
   ├── See today's tasks list
   └── Click task card to open details

3. Task Details Page
   ├── See customer info (Name, Phone, Address)
   ├── Action buttons: Call, Navigate (Maps/Waze)
   ├── See device & problem info
   ├── See attachments section
   ├── See communication section
   └── See action bar at bottom

4. Workflow Execution
   ├── Status: SCHEDULED
   │   └── Click "Start Trip" → Opens trip modal
   │       └── Confirm → Status changes to ON_ROUTE
   │
   ├── Status: ON_ROUTE
   │   └── Auto-tracking enabled
   │   └── Click "Arrived" → Status changes to ARRIVED
   │
   ├── Status: ARRIVED
   │   └── Click "Start Inspection" → Opens modal
   │       ├── Upload min 1 photo (before inspection)
   │       ├── Optional notes
   │       └── Submit → Status changes to INSPECTING
   │
   ├── Status: INSPECTING
   │   └── Perform physical inspection
   │   └── Click "Complete Diagnosis" → Opens modal
   │       ├── Enter diagnosis notes
   │       ├── Optional: Fill device checklist
   │       └── Submit → Status changes to DIAGNOSED
   │
   ├── Status: DIAGNOSED → Decision Point
   │   ├── Option A: "Start Repair"
   │   │   └── Status → REPAIRING
   │   │
   │   ├── Option B: "Need Parts"
   │   │   └── Opens Parts Request modal
   │   │       ├── Upload model/serial photo (required)
   │   │       ├── Enter part name (required)
   │   │       ├── Optional notes + photos
   │   │       └── Submit → Status → WAITING_PARTS
   │   │
   │   ├── Option C: "Cannot Fix"
   │   │   └── Opens Not Fixed modal
   │   │       ├── Select reasons (checklist)
   │   │       ├── Optional notes + evidence photo
   │   │       └── Submit → Status → NOT_FIXED
   │   │
   │   └── Option D: "Pickup Device"
   │       └── Opens Pickup modal
   │           ├── Enter reason
   │           ├── Optional documentation photos
   │           └── Submit → Status → PICKUP_DEVICE
   │
   └── Status: REPAIRING
       └── Click "Repair Complete" → Opens completion modal
           ├── Upload min 3 after-repair photos
           ├── Optional notes
           ├── Get customer signature OR enter OTP
           ├── Customer rates service (1-5 stars)
           └── Submit → Status → COMPLETED
```

### 3.3 Admin Journey: Manage & Monitor

```
1. Admin logs in
   └── Redirect to Admin Dashboard

2. Dashboard
   ├── See KPI summary cards
   ├── See active escalations alert
   ├── See tickets distribution chart
   └── Quick actions: New tickets, Unassigned

3. Tickets Management
   ├── View Options: Grid / Map
   ├── Filters: Status, Priority, City, Technician, Date
   ├── Search: Name, Phone, Ticket ID
   │
   ├── Ticket Card Actions:
   │   ├── Click card → Open details
   │   ├── Assign button → Opens technician selector
   │   ├── Schedule button → Opens date/time picker
   │   ├── Call button → Direct call
   │   └── Location button → Open maps
   │
   └── Bulk Actions: Assign multiple, Export

4. Ticket Details (Admin View)
   ├── Full customer & device info
   ├── Timeline with all status changes
   ├── Attachments gallery
   ├── Internal notes section
   ├── Escalation history
   └── Actions: Assign, Schedule, Change Priority, Cancel

5. Escalations Center
   ├── Filter by level (L1, L2, L3)
   ├── Filter by type (SLA breach type)
   ├── Escalation cards show:
   │   ├── Ticket info
   │   ├── Escalation reason
   │   ├── Time since escalation
   │   └── Resolve button → Opens resolution modal

6. KPI Dashboard
   ├── Time period selector
   ├── Metric cards: Avg assignment time, Avg resolution, etc.
   ├── Charts: Tickets trend, Status distribution
   ├── Technician leaderboard
   └── Export reports
```

---

## 4. Screen Specifications

### 4.1 Customer Portal - Create Ticket Step 1

**URL:** `/customer/create?step=1`

**Header:**
- Title: "طلب صيانة جديد" with wrench icon
- Progress stepper: 1 (active) - 2 - 3

**Form Fields:**

| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|------------|-------------|
| fullName | text | Yes | min 3 chars | "الاسم الكامل" |
| phone | tel | Yes | Saudi format (05xxxxxxxx) | "رقم الجوال" |
| city | select | Yes | from cities list | "اختر المدينة" |
| address | textarea | Yes | min 10 chars | "العنوان التفصيلي" |
| location | map picker | Yes | lat/lng required | - |

**Map Component:**
- Leaflet/OpenStreetMap
- "موقعي" button to get current location
- Draggable marker
- Stores: `latitude`, `longitude`, `formattedAddress`

**Buttons:**
- "التالي" (primary, right) - validates & proceeds
- Back arrow (top right) - returns to portal home

**Empty State:** N/A

---

### 4.2 Customer Portal - Create Ticket Step 2

**URL:** `/customer/create?step=2`

**Header:**
- Title: "طلب صيانة جديد"
- Progress stepper: 1 ✓ - 2 (active) - 3

**Form Fields:**

| Field | Type | Required | Options |
|-------|------|----------|---------|
| deviceType | card select | Yes | AC, Washer, Fridge, Oven, Dishwasher, Other |
| brand | text | Yes | "الماركة" |
| model | text | No | "الموديل (اختياري)" |
| problemDescription | textarea | Yes | "وصف المشكلة" |
| preferredTimeSlot | radio | Yes | Morning (8-12), Noon (12-5), Evening (5-11) |

**Device Type Cards:**
- Icon + Arabic label
- Single select with highlight border

**Buttons:**
- "التالي" (primary)
- "السابق" (secondary)

---

### 4.3 Customer Portal - Create Ticket Step 3

**URL:** `/customer/create?step=3`

**Header:**
- Title: "طلب صيانة جديد"
- Progress stepper: 1 ✓ - 2 ✓ - 3 (active)

**Form Fields:**

| Field | Type | Required | Condition |
|-------|------|----------|-----------|
| warrantyStatus | radio | Yes | "نعم", "لا", "لا أعلم" |
| invoiceNumber | text | No | Show if warrantyStatus = "نعم" |
| serialNumber | text | No | Show if warrantyStatus = "نعم" |
| invoicePhoto | file upload | No | Show if warrantyStatus = "نعم" |

**Conditional UI:**
- If "نعم": Show invoice/serial fields + upload
- If "لا": Show warning banner: "الخدمة خارج الضمان - قد يتم تطبيق رسوم الصيانة"
- If "لا أعلم": Show note: "سيتم التحقق من الضمان عند الزيارة"

**Buttons:**
- "تأكيد الطلب" (primary, green)
- "السابق" (secondary)

---

### 4.4 Customer Portal - Success Page

**URL:** `/customer/create/success`

**Layout:**
- Green success banner with checkmark
- "تم إنشاء طلبك بنجاح!"
- "سيتم التواصل معك قريباً"

**Info Cards:**
- رقم التذكرة: `TK-XXXXXX` (with copy icon)
- رمز التتبع: `xxxxxxxxxxxx` (with copy icon)

**Message:** "احتفظ برمز التتبع لمتابعة حالة طلبك"

**Buttons:**
- "تتبع الطلب" (primary with external link icon)
- "الصفحة الرئيسية" (secondary)

---

### 4.5 Customer Portal - Tracking Page

**URL:** `/customer/track/[token]` or `/customer/track` (with search)

**Header:** "تتبع الطلب"

**Search Section:**
- Input: Tracking token
- Search button

**Ticket Summary Card (Blue header):**
- Badge: Status (جديدة, في الطريق, etc.)
- Ticket ID: TK-XXXXXX
- Device type icon + label
- Problem snippet

**Status Timeline (سجل الحالات):**
- Vertical timeline
- Each entry:
  - Status badge (colored)
  - Date & time
  - Description
  - Actor (بواسطة: نظام AI / الفني: أحمد)

**Live Tracking Section (if status = on_route):**
- Map showing technician location
- ETA estimate

**Empty State:** "لم يتم العثور على التذكرة. تأكد من رمز التتبع"

---

### 4.6 Admin - Tickets Management

**URL:** `/admin/tickets`

**Header:**
- Title: "إدارة التذاكر"
- Count badge: "XX تذكرة"
- View toggle: Grid / Map

**Filters Bar:**
- Status dropdown (multi-select)
- Priority dropdown
- Technician dropdown
- City dropdown
- Date range picker
- Search input

**Grid View:**
- 3-column responsive grid
- Card per ticket:
  - Ticket ID + Customer name
  - City badge
  - Status badge (colored)
  - Priority badge (if high/urgent)
  - Device type icon + label
  - Problem snippet (truncated)
  - Assigned technician (if any)
  - Action buttons: Call, Location
  - If unassigned: "إسناد لفني" button
  - 3-dot menu for more actions

**Map View:**
- Full map with ticket markers
- Legend:
  - Blue: Available technician
  - Red: Busy technician
  - Green: Normal ticket
  - Orange: Urgent ticket
- Click marker → popup with ticket summary + quick actions

**Empty State:** "لا توجد تذاكر مطابقة للفلتر"

---

### 4.7 Technician - Dashboard

**URL:** `/technician/dashboard`

**Header:**
- "لوحة التحكم"
- Technician name + avatar
- Period selector: اليوم / الأسبوع

**KPI Tiles (4 cards):**
- في الانتظار (pending) - Yellow
- قيد التنفيذ (in progress) - Blue
- مكتملة (completed) - Green
- لم يتم الإصلاح (not fixed) - Red

**Tasks Section:**
- Toggle: List / Map
- Sort: Nearest / Oldest / Priority

**Task Cards:**
- Ticket ID
- Customer name
- Device type + icon
- Address (truncated)
- Time badge (scheduled time or "الآن")
- Status badge
- Action buttons: Call, Navigate, Open

**Empty State:** "لا توجد مهام. استمتع بوقتك!"

---

### 4.8 Technician - Task Details

**URL:** `/technician/tasks/[id]`

**Header:**
- Back arrow
- Ticket ID
- Status badge (prominent)

**Sections (Accordion/Tabs):**

**A) Customer Info:**
- Name, Phone (call button), City
- Address (full)
- Navigation buttons: Google Maps, Waze

**B) Device & Problem:**
- Device type, Brand, Model
- Problem description
- Warranty status

**C) Attachments (المرفقات):**
- Grid of uploaded photos
- Upload button (type dropdown: before/after/serial/invoice/other)
- Each photo: thumbnail, type label, delete option

**D) Communication (التواصل):**
- Chat-style messages
- Send message input
- Option to send via SMS

**E) Status Timeline (سجل الحالات):**
- Same as tracking page
- Shows all transitions with timestamps

**F) Escalations (if any):**
- Warning banner if escalated
- Escalation details

**Bottom Fixed Action Bar:**
- Dynamic buttons based on current status
- Example for SCHEDULED:
  - "بدء الرحلة" (primary)
  - "جدولة موعد آخر" (secondary)

---

### 4.9 Technician Modals

**Start Inspection Modal:**
```
Title: بدء الفحص

- Photo upload grid (min 1, max 5)
  - Placeholder: "صور قبل الفحص (مطلوب صورة واحدة على الأقل)"
- Notes textarea (optional)
  - Placeholder: "ملاحظات إضافية"

Buttons:
- "إلغاء" (secondary)
- "بدء الفحص" (primary, disabled until 1 photo)
```

**Spare Parts Request Modal:**
```
Title: طلب قطع غيار

- Model/Serial photo upload (required, max 2)
  - Label: "صورة الموديل/الرقم التسلسلي (مطلوب)"
- Part name input (required)
  - Placeholder: "اسم القطعة المطلوبة"
- Additional photos (optional, max 3)
  - Label: "صور إضافية للمشكلة"
- Notes textarea (optional)

Buttons:
- "إلغاء"
- "إرسال الطلب" (disabled until required fields filled)
```

**Not Fixed Modal:**
```
Title: لم يتم الإصلاح

- Reasons checklist (must select at least 1):
  [ ] العميل غير متواجد
  [ ] العميل رفض التكلفة
  [ ] خارج نطاق الخدمة
  [ ] الجهاز غير قابل للإصلاح
  [ ] قطع الغيار غير متوفرة
  [ ] أخرى

- If "أخرى" selected: text input for reason
- Notes textarea (optional)
- Evidence photo upload (optional)

Buttons:
- "إلغاء"
- "تأكيد" (disabled until at least 1 reason selected)
```

**Pickup Device Modal:**
```
Title: سحب الجهاز

- Reason textarea (required)
  - Placeholder: "سبب سحب الجهاز للورشة"
- Documentation photos (optional, max 3)
- Customer acknowledgment checkbox:
  [ ] تم إبلاغ العميل بسحب الجهاز

Buttons:
- "إلغاء"
- "تأكيد السحب" (disabled until reason + checkbox)
```

**Repair Complete Modal:**
```
Title: تم الإصلاح

- After-repair photos (required, min 3, max 6)
  - Label: "صور بعد الإصلاح (3 صور على الأقل)"
- Notes textarea (optional)
  - Placeholder: "ملاحظات عن الإصلاح"

- Divider: "تأكيد العميل"

- Confirmation method toggle: Signature / OTP
  - If Signature: signature pad component
  - If OTP: "إرسال رمز التحقق" button + OTP input

- Customer rating (after confirmation):
  - 5 stars
  - Optional feedback textarea

Buttons:
- "إلغاء"
- "إتمام الطلب" (disabled until photos + confirmation)
```

---

## 5. Database Schema

### 5.1 Core Entities

```prisma
// User & Authentication
model User {
  id            String      @id @default(uuid())
  email         String?     @unique
  phone         String?     @unique
  passwordHash  String?
  name          String
  role          UserRole
  isActive      Boolean     @default(true)
  avatar        String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  deletedAt     DateTime?

  // Relations
  technician    Technician?
  customer      Customer?
  tokens        RefreshToken[]
  otpCodes      OtpCode[]
  auditLogs     AuditLog[]    @relation("Actor")
  assignedBy    Ticket[]      @relation("AssignedBy")
  createdTickets Ticket[]     @relation("CreatedBy")
}

enum UserRole {
  admin
  supervisor
  technician
  customer
  workshop
}

model Technician {
  id            String      @id @default(uuid())
  userId        String      @unique
  user          User        @relation(fields: [userId], references: [id])
  employeeId    String      @unique
  specialties   String[]    // ['ac', 'washer', 'fridge']
  serviceAreas  String[]    // City codes
  isAvailable   Boolean     @default(true)
  currentLat    Float?
  currentLng    Float?
  lastLocationAt DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  tickets       Ticket[]
  locations     TechnicianLocation[]
  timeLogs      TimeLog[]
}

model Customer {
  id            String      @id @default(uuid())
  userId        String?     @unique
  user          User?       @relation(fields: [userId], references: [id])
  name          String
  phone         String      @unique
  email         String?
  city          String
  address       String
  latitude      Float?
  longitude     Float?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relations
  tickets       Ticket[]
}

// Ticket System
model Ticket {
  id              String        @id @default(uuid())
  ticketNumber    String        @unique  // TK-XXXXXX
  trackingToken   String        @unique  // Random token for public tracking

  // Customer Info
  customerId      String
  customer        Customer      @relation(fields: [customerId], references: [id])
  customerName    String        // Denormalized for quick access
  customerPhone   String
  customerCity    String
  customerAddress String
  latitude        Float
  longitude       Float

  // Device Info
  deviceType      DeviceType
  brand           String
  model           String?
  problemDescription String

  // Warranty Info
  warrantyStatus  WarrantyStatus
  invoiceNumber   String?
  serialNumber    String?

  // Scheduling
  preferredTimeSlot TimeSlot?
  scheduledDate   DateTime?
  scheduledTimeSlot TimeSlot?

  // Assignment
  technicianId    String?
  technician      Technician?   @relation(fields: [technicianId], references: [id])
  assignedAt      DateTime?
  assignedById    String?
  assignedBy      User?         @relation("AssignedBy", fields: [assignedById], references: [id])

  // Status
  status          TicketStatus  @default(new)
  priority        Priority      @default(normal)

  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  acceptedAt      DateTime?
  scheduledAt     DateTime?
  startedTripAt   DateTime?
  arrivedAt       DateTime?
  inspectionStartedAt DateTime?
  diagnosedAt     DateTime?
  repairStartedAt DateTime?
  completedAt     DateTime?
  cancelledAt     DateTime?

  // Completion
  completionType  CompletionType?
  notFixedReasons String[]
  cancellationReason String?
  customerSignature String?     // Base64 or URL
  customerOtp     String?
  customerRating  Int?          // 1-5
  customerFeedback String?

  // Internal
  internalNotes   String?
  createdById     String?
  createdBy       User?         @relation("CreatedBy", fields: [createdById], references: [id])

  // Relations
  statusHistory   TicketStatusHistory[]
  attachments     TicketAttachment[]
  messages        TicketMessage[]
  partsRequests   PartsRequest[]
  escalations     Escalation[]
  timeLogs        TimeLog[]
  locations       TicketLocation[]

  @@index([status])
  @@index([customerId])
  @@index([technicianId])
  @@index([customerCity])
  @@index([createdAt])
  @@index([trackingToken])
}

enum DeviceType {
  ac
  washer
  fridge
  oven
  dishwasher
  other
}

enum WarrantyStatus {
  yes
  no
  unknown
}

enum TimeSlot {
  morning   // 8-12
  noon      // 12-17
  evening   // 17-23
}

enum TicketStatus {
  new
  assigned
  scheduled
  on_route
  arrived
  inspecting
  diagnosed
  repairing
  waiting_parts
  pickup_device
  in_workshop
  ready_delivery
  completed
  not_fixed
  cancelled
}

enum Priority {
  low
  normal
  high
  urgent
}

enum CompletionType {
  fixed
  not_fixed
  cancelled
}

// Status History for Timeline
model TicketStatusHistory {
  id          String        @id @default(uuid())
  ticketId    String
  ticket      Ticket        @relation(fields: [ticketId], references: [id])
  fromStatus  TicketStatus?
  toStatus    TicketStatus
  notes       String?
  actorId     String?
  actorName   String        // Denormalized
  actorRole   UserRole
  createdAt   DateTime      @default(now())

  // Location at transition
  latitude    Float?
  longitude   Float?

  @@index([ticketId])
}

// Attachments
model TicketAttachment {
  id          String          @id @default(uuid())
  ticketId    String
  ticket      Ticket          @relation(fields: [ticketId], references: [id])
  type        AttachmentType
  url         String
  filename    String
  mimeType    String
  size        Int
  uploadedById String
  uploadedByName String
  createdAt   DateTime        @default(now())

  @@index([ticketId])
}

enum AttachmentType {
  before_inspection
  after_repair
  serial_photo
  invoice_photo
  parts_photo
  device_photo
  signature
  other
}

// Messages/Communication
model TicketMessage {
  id          String        @id @default(uuid())
  ticketId    String
  ticket      Ticket        @relation(fields: [ticketId], references: [id])
  senderId    String
  senderName  String
  senderRole  UserRole
  content     String
  channel     MessageChannel @default(internal)
  externalId  String?       // SMS/WhatsApp message ID
  status      MessageStatus @default(sent)
  createdAt   DateTime      @default(now())

  @@index([ticketId])
}

enum MessageChannel {
  internal
  sms
  whatsapp
  email
}

enum MessageStatus {
  pending
  sent
  delivered
  read
  failed
}

// Spare Parts Requests
model PartsRequest {
  id            String            @id @default(uuid())
  ticketId      String
  ticket        Ticket            @relation(fields: [ticketId], references: [id])
  partName      String
  quantity      Int               @default(1)
  notes         String?
  status        PartsRequestStatus @default(pending)
  requestedById String
  requestedByName String
  requestedAt   DateTime          @default(now())
  approvedAt    DateTime?
  receivedAt    DateTime?

  // Photos
  photos        String[]          // URLs

  @@index([ticketId])
  @@index([status])
}

enum PartsRequestStatus {
  pending
  approved
  ordered
  received
  cancelled
}

// Escalations
model Escalation {
  id          String            @id @default(uuid())
  ticketId    String
  ticket      Ticket            @relation(fields: [ticketId], references: [id])
  level       EscalationLevel
  type        EscalationType
  reason      String
  ownerId     String?           // Who should resolve
  ownerName   String?
  isResolved  Boolean           @default(false)
  resolvedAt  DateTime?
  resolvedById String?
  resolvedByName String?
  resolutionNotes String?
  createdAt   DateTime          @default(now())

  @@index([ticketId])
  @@index([isResolved])
  @@index([level])
}

enum EscalationLevel {
  L1
  L2
  L3
}

enum EscalationType {
  assignment_delay
  schedule_delay
  trip_delay
  arrival_delay
  parts_delay
  completion_delay
  customer_complaint
  sla_breach
}

// Time Tracking
model TimeLog {
  id            String        @id @default(uuid())
  ticketId      String
  ticket        Ticket        @relation(fields: [ticketId], references: [id])
  technicianId  String?
  technician    Technician?   @relation(fields: [technicianId], references: [id])
  stage         TicketStatus
  startedAt     DateTime      @default(now())
  endedAt       DateTime?
  durationMinutes Int?

  @@index([ticketId])
  @@index([technicianId])
}

// Technician Location Tracking
model TechnicianLocation {
  id            String      @id @default(uuid())
  technicianId  String
  technician    Technician  @relation(fields: [technicianId], references: [id])
  ticketId      String?     // If tracking for specific ticket
  latitude      Float
  longitude     Float
  accuracy      Float?
  speed         Float?
  heading       Float?
  createdAt     DateTime    @default(now())

  @@index([technicianId])
  @@index([ticketId])
  @@index([createdAt])
}

// Ticket Location (per status change)
model TicketLocation {
  id          String        @id @default(uuid())
  ticketId    String
  ticket      Ticket        @relation(fields: [ticketId], references: [id])
  status      TicketStatus
  latitude    Float
  longitude   Float
  address     String?
  createdAt   DateTime      @default(now())

  @@index([ticketId])
}

// Customer Ratings
model Rating {
  id          String      @id @default(uuid())
  ticketId    String      @unique
  customerId  String
  technicianId String
  score       Int         // 1-5
  feedback    String?
  createdAt   DateTime    @default(now())

  @@index([technicianId])
}

// SLA Configuration
model SlaConfig {
  id              String      @id @default(uuid())
  name            String      @unique
  type            EscalationType
  thresholdMinutes Int
  escalationLevel EscalationLevel
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

// System Settings
model Setting {
  id          String      @id @default(uuid())
  key         String      @unique
  value       String
  description String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

// Audit Log
model AuditLog {
  id          String      @id @default(uuid())
  action      String
  entity      String
  entityId    String
  oldValue    Json?
  newValue    Json?
  actorId     String?
  actor       User?       @relation("Actor", fields: [actorId], references: [id])
  actorName   String?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime    @default(now())

  @@index([entity, entityId])
  @@index([actorId])
  @@index([createdAt])
}
```

---

## 6. API Endpoints

### 6.1 Authentication

```
POST /api/v1/auth/staff/login
  Body: { email, password }
  Response: { accessToken, refreshToken, user }

POST /api/v1/auth/customer/request-otp
  Body: { phone }
  Response: { message, expiresIn }

POST /api/v1/auth/customer/verify-otp
  Body: { phone, otp }
  Response: { accessToken, refreshToken, user, isNewUser }

POST /api/v1/auth/refresh
  Body: { refreshToken }
  Response: { accessToken, refreshToken }

POST /api/v1/auth/logout
  Headers: Authorization: Bearer <token>
  Response: { message }
```

### 6.2 Customer Endpoints

```
# Create Ticket (Public or Authenticated)
POST /api/v1/customer/tickets
  Body: {
    customerName, customerPhone, customerCity, customerAddress,
    latitude, longitude, deviceType, brand, model?,
    problemDescription, preferredTimeSlot,
    warrantyStatus, invoiceNumber?, serialNumber?
  }
  Response: { ticket: { id, ticketNumber, trackingToken } }

# Track Ticket (Public)
GET /api/v1/customer/tickets/track/:token
  Response: { ticket: { ...summary }, timeline: [...], technicianLocation?: {...} }

# Get My Tickets (Authenticated)
GET /api/v1/customer/tickets
  Query: { status?, page?, limit? }
  Response: { tickets: [...], total, page, limit }

# Get Ticket Details
GET /api/v1/customer/tickets/:id
  Response: { ticket: {...} }

# Add Attachment
POST /api/v1/customer/tickets/:id/attachments
  Body: FormData { file, type }
  Response: { attachment: {...} }

# Send Message
POST /api/v1/customer/tickets/:id/messages
  Body: { content }
  Response: { message: {...} }

# Cancel Ticket
POST /api/v1/customer/tickets/:id/cancel
  Body: { reason }
  Response: { ticket: {...} }
```

### 6.3 Technician Endpoints

```
# Get Dashboard Stats
GET /api/v1/technician/dashboard
  Response: {
    stats: { assigned, inProgress, waitingParts, completed, notFixed },
    todayTasks: [...]
  }

# Get My Tasks
GET /api/v1/technician/tasks
  Query: { status?, date?, sort? }
  Response: { tasks: [...], total }

# Get Task Details
GET /api/v1/technician/tasks/:id
  Response: { task: {...}, timeline: [...], attachments: [...], messages: [...] }

# Workflow Actions
POST /api/v1/technician/tasks/:id/start-trip
  Body: { latitude, longitude }
  Response: { task: {...} }

POST /api/v1/technician/tasks/:id/arrive
  Body: { latitude, longitude }
  Response: { task: {...} }

POST /api/v1/technician/tasks/:id/start-inspection
  Body: FormData { photos[], notes? }
  Response: { task: {...} }

POST /api/v1/technician/tasks/:id/complete-diagnosis
  Body: { diagnosisNotes, checklist? }
  Response: { task: {...} }

POST /api/v1/technician/tasks/:id/start-repair
  Response: { task: {...} }

POST /api/v1/technician/tasks/:id/request-parts
  Body: FormData { partName, quantity?, notes?, serialPhotos[], additionalPhotos[]? }
  Response: { task: {...}, partsRequest: {...} }

POST /api/v1/technician/tasks/:id/not-fixed
  Body: { reasons[], notes?, evidencePhoto? }
  Response: { task: {...} }

POST /api/v1/technician/tasks/:id/pickup-device
  Body: FormData { reason, photos[]?, customerAcknowledged }
  Response: { task: {...} }

POST /api/v1/technician/tasks/:id/complete-repair
  Body: FormData {
    photos[], notes?,
    confirmationType: 'signature' | 'otp',
    signature?: base64, otp?: string,
    customerRating?, customerFeedback?
  }
  Response: { task: {...} }

# Send OTP for completion
POST /api/v1/technician/tasks/:id/send-completion-otp
  Response: { message, expiresIn }

# Update Location (called periodically)
POST /api/v1/technician/location
  Body: { latitude, longitude, accuracy?, speed?, heading?, ticketId? }
  Response: { success: true }

# Send Message
POST /api/v1/technician/tasks/:id/messages
  Body: { content, channel?: 'internal' | 'sms' }
  Response: { message: {...} }

# Upload Attachment
POST /api/v1/technician/tasks/:id/attachments
  Body: FormData { file, type }
  Response: { attachment: {...} }

# My Performance
GET /api/v1/technician/performance
  Query: { period: 'day' | 'week' | 'month' }
  Response: {
    totalTickets, completed, notFixed, avgRating,
    avgResponseTime, avgRepairTime,
    dailyChart: [...], ratingDistribution: [...]
  }
```

### 6.4 Admin Endpoints

```
# Dashboard
GET /api/v1/admin/dashboard
  Response: {
    stats: { new, assigned, inProgress, completed, escalations },
    recentTickets: [...],
    activeEscalations: [...],
    chartData: [...]
  }

# Tickets List
GET /api/v1/admin/tickets
  Query: {
    status?, priority?, technicianId?, city?,
    dateFrom?, dateTo?, search?, page?, limit?, sort?
  }
  Response: { tickets: [...], total, page, limit }

# Get Ticket Details
GET /api/v1/admin/tickets/:id
  Response: { ticket: {...}, timeline: [...], attachments: [...], escalations: [...] }

# Assign Technician
POST /api/v1/admin/tickets/:id/assign
  Body: { technicianId }
  Response: { ticket: {...} }

# Schedule Appointment
POST /api/v1/admin/tickets/:id/schedule
  Body: { scheduledDate, scheduledTimeSlot }
  Response: { ticket: {...} }

# Change Priority
POST /api/v1/admin/tickets/:id/priority
  Body: { priority }
  Response: { ticket: {...} }

# Add Internal Note
POST /api/v1/admin/tickets/:id/notes
  Body: { content }
  Response: { ticket: {...} }

# Cancel Ticket
POST /api/v1/admin/tickets/:id/cancel
  Body: { reason }
  Response: { ticket: {...} }

# Escalations
GET /api/v1/admin/escalations
  Query: { level?, type?, isResolved?, page?, limit? }
  Response: { escalations: [...], total }

POST /api/v1/admin/escalations/:id/resolve
  Body: { resolutionNotes }
  Response: { escalation: {...} }

# Technicians
GET /api/v1/admin/technicians
  Query: { isAvailable?, city?, search? }
  Response: { technicians: [...] }

GET /api/v1/admin/technicians/:id
  Response: { technician: {...}, stats: {...}, recentTickets: [...] }

# Parts Requests
GET /api/v1/admin/parts-requests
  Query: { status?, page?, limit? }
  Response: { requests: [...], total }

POST /api/v1/admin/parts-requests/:id/approve
  Response: { request: {...} }

POST /api/v1/admin/parts-requests/:id/received
  Response: { request: {...} }

# KPIs
GET /api/v1/admin/kpis
  Query: { dateFrom, dateTo, groupBy?: 'day' | 'week' | 'month' }
  Response: {
    summary: {
      totalTickets, avgAssignmentTime, avgArrivalTime,
      avgRepairTime, firstTimeFixRate, slaCompliance,
      avgCustomerRating, cancellationRate
    },
    byStatus: [...],
    byTechnician: [...],
    byCity: [...],
    trend: [...]
  }

# Export Reports
GET /api/v1/admin/reports/export
  Query: { type: 'tickets' | 'kpis', format: 'xlsx' | 'pdf', dateFrom, dateTo }
  Response: File download

# SLA Configuration
GET /api/v1/admin/sla-configs
  Response: { configs: [...] }

PUT /api/v1/admin/sla-configs/:id
  Body: { thresholdMinutes, isActive }
  Response: { config: {...} }

# Live Tracking
GET /api/v1/admin/tracking/technicians
  Response: { technicians: [{ id, name, lat, lng, currentTicketId, lastUpdate }] }
```

### 6.5 WebSocket Events

```typescript
// Client → Server
socket.emit('join:ticket', { ticketId })
socket.emit('leave:ticket', { ticketId })
socket.emit('technician:location', { lat, lng, ticketId })

// Server → Client
socket.on('ticket:updated', { ticketId, status, ... })
socket.on('ticket:message', { ticketId, message })
socket.on('technician:location', { ticketId, lat, lng, eta })
socket.on('escalation:created', { escalation })
```

---

## 7. SLA/Reminders/Escalations

### 7.1 SLA Rules

| Rule ID | Trigger | Threshold | Escalation Level | Owner |
|---------|---------|-----------|------------------|-------|
| SLA-001 | New ticket not assigned | 2 hours | L1 | Supervisor |
| SLA-002 | Assigned but not scheduled | 4 hours | L1 | Supervisor |
| SLA-003 | Scheduled but trip not started by slot | 30 min after slot start | L2 | Admin |
| SLA-004 | On route > threshold without arrival | 90 minutes | L2 | Admin |
| SLA-005 | Waiting parts > threshold | 3 days | L3 | Admin + Procurement |
| SLA-006 | Ticket age > threshold without completion | 7 days | L3 | Admin |
| SLA-007 | Customer complaint received | Immediate | L2 | Supervisor |
| SLA-008 | In workshop > threshold | 5 days | L3 | Admin + Workshop |

### 7.2 Escalation Workflow

```typescript
interface EscalationProcess {
  trigger: () => void;
  actions: [
    // 1. Create escalation record
    'createEscalationRecord',
    // 2. Notify owner via push/email
    'notifyOwner',
    // 3. Update ticket internal notes
    'addTicketNote',
    // 4. Optional: Auto-assign if L3
    'autoReassign?',
  ];
  resolution: {
    requiredFields: ['resolutionNotes'],
    sideEffects: ['notifyOriginalTech', 'updateMetrics'],
  };
}
```

### 7.3 Background Job Schedule

```typescript
// Cron jobs for SLA checking
const SLA_JOBS = [
  {
    name: 'check-assignment-sla',
    cron: '*/15 * * * *', // Every 15 minutes
    handler: checkAssignmentSLA,
  },
  {
    name: 'check-schedule-sla',
    cron: '*/30 * * * *', // Every 30 minutes
    handler: checkScheduleSLA,
  },
  {
    name: 'check-trip-sla',
    cron: '*/10 * * * *', // Every 10 minutes
    handler: checkTripSLA,
  },
  {
    name: 'check-parts-sla',
    cron: '0 9 * * *', // Daily at 9 AM
    handler: checkPartsSLA,
  },
  {
    name: 'check-ticket-age-sla',
    cron: '0 10 * * *', // Daily at 10 AM
    handler: checkTicketAgeSLA,
  },
];
```

### 7.4 Reminder System

| Reminder Type | Recipient | Trigger | Channel |
|---------------|-----------|---------|---------|
| Visit reminder | Customer | 24h before scheduled | SMS |
| Visit reminder | Customer | 2h before scheduled | SMS |
| Task reminder | Technician | Start of day | Push + SMS |
| Missing photos | Technician | Status requires photos | Push |
| Overdue ticket | Admin | SLA threshold | Email + Push |
| Parts arrived | Technician | Parts marked received | Push + SMS |
| Feedback request | Customer | 24h after completion | SMS |

---

## 8. KPI Definitions

### 8.1 Core Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| **Average Assignment Time** | AVG(assignedAt - createdAt) | < 2 hours |
| **Average Response Time** | AVG(arrivedAt - assignedAt) | < 4 hours |
| **Average Repair Time** | AVG(completedAt - arrivedAt) | < 3 hours |
| **Total Cycle Time** | AVG(completedAt - createdAt) | < 24 hours |
| **First Time Fix Rate** | (Completed without waiting_parts) / Total Completed | > 80% |
| **SLA Compliance** | Tickets without escalation / Total | > 95% |
| **Customer Satisfaction** | AVG(customerRating) | > 4.2/5 |
| **Cancellation Rate** | Cancelled / Total | < 5% |
| **Not Fixed Rate** | Not Fixed / Total | < 10% |
| **Parts Wait Time** | AVG(partsReceivedAt - partsRequestedAt) | < 3 days |

### 8.2 Technician Performance Metrics

| Metric | Formula |
|--------|---------|
| **Tickets Completed** | COUNT(completed tickets) |
| **Avg Ticket Time** | AVG(completedAt - arrivedAt) |
| **Customer Rating** | AVG(ratings) |
| **First Time Fix Rate** | Personal rate |
| **On-Time Arrival** | Arrivals within 15min of scheduled / Total |
| **Distance Traveled** | SUM(route distances) |

### 8.3 Dashboard Widgets

```typescript
interface KPIDashboard {
  // Summary Cards
  summaryCards: [
    { label: 'إجمالي التذاكر', value: number, trend: percentage },
    { label: 'متوسط وقت الإسناد', value: string, trend: percentage },
    { label: 'معدل الإصلاح من أول زيارة', value: percentage },
    { label: 'تقييم العملاء', value: number, icon: 'star' },
  ];

  // Charts
  charts: {
    ticketsTrend: LineChart, // Daily/weekly tickets
    statusDistribution: PieChart, // By status
    cityHeatmap: HeatMap, // Tickets by city
    technicianLeaderboard: BarChart, // Top performers
  };

  // Tables
  tables: {
    slaBreaches: Table, // Recent SLA breaches
    pendingEscalations: Table, // Unresolved escalations
  };
}
```

---

## 9. V3 Pro Upgrades

### 9.1 Smart Features

1. **AI-Powered Priority Scoring**
   - Analyze: device type, customer history, problem keywords
   - Auto-suggest priority level
   - Flag potential complex issues

2. **Predictive Scheduling**
   - Suggest optimal time slots based on technician workload
   - Consider travel time between locations
   - Account for technician specialties

3. **Auto-Assignment Algorithm**
   - Factor in: proximity, workload, specialty, rating
   - Balanced distribution across technicians
   - Configurable rules per city/brand

4. **Smart Reminders**
   - Adaptive timing based on customer response patterns
   - Escalating urgency for no-response
   - Multi-channel fallback (SMS → WhatsApp → Call)

### 9.2 Enhanced Tracking

1. **Real-Time ETA**
   - Calculate based on current location + traffic
   - Update customer automatically
   - Show map with live position

2. **Route Optimization**
   - Suggest optimal visit order for multiple tickets
   - Consider traffic patterns
   - Recalculate on new assignments

3. **Geofencing**
   - Auto-mark "Arrived" when entering customer zone
   - Alert if technician leaves during repair
   - Track actual time on-site

### 9.3 Communication Enhancements

1. **WhatsApp Integration**
   - Send ticket updates via WhatsApp
   - Share tracking link with map
   - Allow customer replies

2. **Voice Notes**
   - Technician can add voice notes instead of typing
   - Auto-transcription for searchability

3. **Video Call Support**
   - Remote diagnosis option
   - Expert consultation during repair
   - Customer walkthrough for simple fixes

### 9.4 Advanced Analytics

1. **Failure Pattern Analysis**
   - Common issues by device type/brand
   - Seasonal trends
   - Parts failure rates

2. **Technician Insights**
   - Skill gap identification
   - Training recommendations
   - Performance trends

3. **Customer Analytics**
   - Repeat customer identification
   - Churn risk scoring
   - Service history summary

### 9.5 Workflow Enhancements

1. **Device Checklists**
   - Pre-defined check items per device type
   - Ensure consistent inspection
   - Auto-generate diagnosis suggestions

2. **Fault Code Library**
   - Standardized error codes
   - Linked repair procedures
   - Parts recommendations

3. **Multi-Device Tickets**
   - Single ticket for multiple devices
   - Separate tracking per device
   - Combined billing

4. **Recurring Maintenance**
   - Schedule periodic check-ups
   - Auto-create tickets on schedule
   - Maintenance history tracking

### 9.6 Integration Capabilities

1. **Odoo/ERP Integration**
   - Sync customers
   - Sync products/devices
   - Push invoices
   - Inventory management

2. **Accounting Integration**
   - Auto-invoice generation
   - Payment tracking
   - Revenue reports

3. **CRM Integration**
   - Customer 360 view
   - Sales opportunity triggers
   - Service to sales handoff

---

## Implementation Priority

### Phase 1 (MVP)
- Customer ticket creation & tracking
- Admin ticket management
- Technician workflow (full lifecycle)
- Basic SLA monitoring
- Essential KPIs

### Phase 2 (Enhancement)
- Real-time tracking
- WhatsApp integration
- Advanced analytics
- Auto-assignment
- Escalation management

### Phase 3 (Pro)
- AI features
- Route optimization
- ERP integration
- Mobile app (native)
- Voice/video features

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: System Architecture Team*
