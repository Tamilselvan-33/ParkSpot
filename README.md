# 🚗 ParkSpot — Society Visitor Parking Slot Tracker

> A secure Spring Boot REST API for managing visitor vehicle entries, parking slots, exits, flats, authentication, and visitor reports in a residential society.

---

## 📌 Overview

**ParkSpot** is a backend system designed for residential societies where visitor parking is limited and managed on a first-come, first-served basis.

The system helps gate security and administrators:

- 🚘 Register visitor vehicle entries
- 🅿️ Assign available numbered parking slots
- 🚪 Record vehicle exits and automatically free slots
- 👀 View currently occupied parking slots
- 📋 Maintain complete visitor parking history
- 📊 Generate daily and date-range visitor reports
- 🔐 Authenticate users using JWT
- 👮 Control access using `SECURITY` and `ADMIN` roles

The system is designed around clear business rules so that an occupied slot can never be assigned to another active visitor.

---

# 🎯 Problem Statement

In a residential society, visitor parking is often managed manually. This can lead to:

- Duplicate parking-slot assignments
- Disputes about who parked where
- Difficulty tracking vehicle entry and exit times
- No reliable visitor history
- Difficulty knowing which slots are currently available

**ParkSpot solves these problems by providing a centralized and secure parking-management backend.**

---

# ✨ Core Features

## 1. 🚘 Log Visitor Vehicle Entry

Security can register a visitor vehicle with:

- Vehicle number
- Flat being visited
- Parking slot assigned

The backend automatically records the **entry time**.

### Example

```text
Vehicle       : TN38AB1234
Flat          : 101
Parking Slot  : 5
Entry Time    : 10:30 AM
Exit Time     : NULL
```

`exitTime = NULL` means the vehicle is currently inside the society.

---

## 2. 🚪 Mark Vehicle Exit

When a vehicle leaves, the system records the exit time automatically.

```text
Entry Time : 10:30 AM
Exit Time  : 12:45 PM
```

The visitor record is retained for historical reporting.

Once the exit time is recorded, the parking slot becomes available for reuse.

---

## 3. 👀 View Currently Occupied Slots

The system can show which parking slots are currently occupied.

A slot is considered occupied when there is an active visitor record where:

```text
exitTime IS NULL
```

Example:

```text
Slot 2 → TN38AB1234 → OCCUPIED
Slot 5 → TN40CD5678 → OCCUPIED
Slot 7 → FREE
```

---

## 4. 🛑 Prevent Duplicate Slot Assignment

Before assigning a parking slot, the service layer checks whether another active visitor is already using it.

### Invalid

```text
Slot 5
Vehicle A → Entry: 10:00 AM
           → Exit: NULL
```

Vehicle B attempts to use Slot 5.

```text
❌ Slot 5 is already occupied.
```

### Valid

After Vehicle A exits:

```text
Vehicle A → Exit: 12:00 PM
```

Slot 5 becomes available:

```text
✅ Vehicle B → Slot 5
```

This rule is enforced in the **service layer**, not only at the database level.

---

## 5. 📊 Daily Visitor Report

The system can generate a report containing visitor records for a selected date.

Example:

```text
DATE: 28-09-2026

Vehicle       Flat     Slot     Entry       Exit
----------------------------------------------------
TN38AB1234    101      2        10:30 AM    12:45 PM
TN40CD5678    203      5        11:15 AM    01:30 PM
TN22XY1111    302      1        02:00 PM    Still Inside
```

---

# 🔐 Authentication & Authorization

ParkSpot uses **JWT-based authentication**.

Passwords are stored securely using **BCrypt hashing** rather than plain text.

## Roles

### 👮 SECURITY

Security users can:

- Log vehicle entries
- Record vehicle exits
- View current visitors
- View occupied slots
- View visitor history
- View daily reports
- View flats and parking slots

### 👑 ADMIN

Administrators can perform all security operations plus:

- Register users
- Create parking slots
- Delete parking slots
- Create flats
- Access extended reports

---

# 🧠 Core Business Rules

The following rules are enforced by the service layer:

### Rule 1 — A slot cannot be assigned twice

A parking slot cannot be assigned to a new vehicle while an existing visitor using that slot has:

```text
exitTime = NULL
```

---

### Rule 2 — Entry must exist before exit

A vehicle cannot receive an exit time unless its entry time has already been recorded.

---

### Rule 3 — A vehicle cannot exit twice

If `exitTime` is already recorded, another exit request is rejected.

---

### Rule 4 — Timestamps are controlled by the server

Clients do **not** send entry or exit timestamps.

The server automatically uses:

```java
LocalDateTime.now()
```

This prevents users from manipulating parking records.

---

### Rule 5 — Visitor history is never deleted on exit

When a vehicle leaves, we update its `exitTime`.

We do **not** delete the visitor record.

This allows the system to maintain historical reports.

---

# 🗃️ Database Design

The system contains four primary entities.

```text
┌──────────────┐
│     User     │
├──────────────┤
│ id           │
│ username     │
│ password     │
│ role         │
└──────────────┘


┌──────────────┐
│     Flat     │
├──────────────┤
│ id           │
│ flatNumber   │
│ residentName │
└──────────────┘


┌──────────────────┐
│   ParkingSlot    │
├──────────────────┤
│ id               │
│ slotNumber       │
└──────────────────┘


┌────────────────────┐
│  VisitorVehicle    │
├────────────────────┤
│ id                 │
│ vehicleNumber      │
│ entryTime          │
│ exitTime           │
│ flat_id            │
│ parking_slot_id    │
└────────────────────┘
```

---

# 🔗 Entity Relationships

```text
             ┌──────────┐
             │   Flat   │
             └────┬─────┘
                  │
                1 │
                  │
                  │ N
          ┌───────▼──────────┐
          │  VisitorVehicle  │
          └───────┬──────────┘
                  │
                N │
                  │
                  │ 1
          ┌───────▼──────────┐
          │   ParkingSlot    │
          └──────────────────┘
```

### Flat → VisitorVehicle

One flat can have multiple visitor records.

### VisitorVehicle → Flat

Each visitor visit belongs to the flat being visited.

### VisitorVehicle → ParkingSlot

Each visitor visit is assigned a parking slot.

A slot can be reused by different visitors **over time**, but it cannot have multiple active visitors simultaneously.

---

# 🏗️ System Architecture

ParkSpot follows a layered Spring Boot architecture.

```text
                    ┌─────────────────────┐
                    │      CLIENT         │
                    │  Postman / Frontend │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    REST CONTROLLER  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       SERVICE       │
                    │   Business Logic    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   JPA REPOSITORY    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    MySQL/Postgres   │
                    └─────────────────────┘

Authentication:
Client → JWT → Spring Security → Protected APIs
```

---

# 📁 Project Structure

```text
src/
└── main/
    ├── java/
    │   └── com/example/parkspot/
    │       ├── config/
    │       │   └── SecurityConfig.java
    │       │
    │       ├── controller/
    │       │   ├── AuthController.java
    │       │   ├── VisitorController.java
    │       │   ├── ParkingSlotController.java
    │       │   ├── FlatController.java
    │       │   └── ReportController.java
    │       │
    │       ├── dto/
    │       │   ├── LoginRequest.java
    │       │   ├── RegisterRequest.java
    │       │   ├── VisitorEntryRequest.java
    │       │   └── ...
    │       │
    │       ├── entity/
    │       │   ├── User.java
    │       │   ├── Flat.java
    │       │   ├── ParkingSlot.java
    │       │   └── VisitorVehicle.java
    │       │
    │       ├── repository/
    │       │   ├── UserRepository.java
    │       │   ├── FlatRepository.java
    │       │   ├── ParkingSlotRepository.java
    │       │   └── VisitorVehicleRepository.java
    │       │
    │       ├── service/
    │       │   ├── AuthService.java
    │       │   ├── VisitorService.java
    │       │   ├── ParkingSlotService.java
    │       │   ├── FlatService.java
    │       │   └── ReportService.java
    │       │
    │       ├── security/
    │       │   ├── JwtService.java
    │       │   └── JwtAuthenticationFilter.java
    │       │
    │       └── exception/
    │           ├── SlotOccupiedException.java
    │           ├── VisitorNotFoundException.java
    │           └── GlobalExceptionHandler.java
    │
    └── resources/
        └── application.properties
```

---

# 🌐 API Documentation

Base URL:

```text
http://localhost:8080
```

All protected APIs require:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 Authentication APIs

### `POST /api/auth/login`

Authenticate a user and return a JWT token.

#### Request

```json
{
  "username": "security1",
  "password": "password123"
}
```

#### Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "username": "security1",
  "role": "SECURITY"
}
```

---

### `POST /api/auth/register`

Create a new system user.

**Access:** `ADMIN`

#### Request

```json
{
  "username": "security2",
  "password": "password123",
  "role": "SECURITY"
}
```

---

# 🚘 Visitor APIs

## `POST /api/visitors`

### Vehicle Entry

Registers a new visitor vehicle and assigns a parking slot.

**Access:** `SECURITY`, `ADMIN`

#### Request

```json
{
  "vehicleNumber": "TN38AB1234",
  "flatId": 1,
  "slotId": 5
}
```

### Backend automatically:

```text
entryTime = current server time
exitTime  = NULL
```

### Validation

- Flat must exist
- Parking slot must exist
- Parking slot must be free
- Vehicle number must be valid

---

## `PUT /api/visitors/{id}/exit`

### Vehicle Exit

Records the vehicle's exit time.

**Access:** `SECURITY`, `ADMIN`

The client does not provide the exit time.

The server sets:

```text
exitTime = current server time
```

---

## `GET /api/visitors`

### All Visitor Records

Returns complete visitor history.

**Access:** `SECURITY`, `ADMIN`

---

## `GET /api/visitors/current`

### Current Visitors

Returns vehicles that are currently inside the society.

Condition:

```text
exitTime IS NULL
```

**Access:** `SECURITY`, `ADMIN`

---

## `GET /api/visitors/{id}`

### Visitor Details

Returns complete information for a specific visitor record.

**Access:** `SECURITY`, `ADMIN`

---

# 🅿️ Parking Slot APIs

## `GET /api/parking-slots`

Returns all parking slots with their current status.

Example:

```json
[
  {
    "slotNumber": 1,
    "status": "FREE"
  },
  {
    "slotNumber": 2,
    "status": "OCCUPIED",
    "vehicleNumber": "TN38AB1234"
  }
]
```

**Access:** `SECURITY`, `ADMIN`

---

## `GET /api/parking-slots/occupied`

Returns only currently occupied slots.

**Access:** `SECURITY`, `ADMIN`

---

## `POST /api/parking-slots`

Creates a new parking slot.

**Access:** `ADMIN`

#### Request

```json
{
  "slotNumber": 11
}
```

---

## `DELETE /api/parking-slots/{id}`

Deletes a parking slot.

**Access:** `ADMIN`

A slot cannot be deleted while it is occupied.

---

# 🏠 Flat APIs

## `POST /api/flats`

Creates a new flat.

**Access:** `ADMIN`

#### Request

```json
{
  "flatNumber": "101",
  "residentName": "Arun"
}
```

---

## `GET /api/flats`

Returns all registered flats.

**Access:** `SECURITY`, `ADMIN`

---

## `GET /api/flats/{id}`

Returns details of a specific flat.

**Access:** `SECURITY`, `ADMIN`

---

# 📊 Report APIs

## `GET /api/reports/daily?date=2026-09-28`

Generates a visitor report for a specific day.

**Access:** `SECURITY`, `ADMIN`

Example:

```text
Date: 28-09-2026

Vehicle       Flat     Slot     Entry       Exit
----------------------------------------------------
TN38AB1234    101      2        10:30 AM    12:45 PM
TN40CD5678    203      5        11:15 AM    01:30 PM
TN22XY1111    302      1        02:00 PM    Still Inside
```

---

## `GET /api/reports?from=2026-09-01&to=2026-09-28`

Returns visitor records between two dates.

**Access:** `ADMIN`

---

# 📋 API Summary

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Login and receive JWT | Public |
| `POST` | `/api/auth/register` | Register user | ADMIN |
| `POST` | `/api/visitors` | Register vehicle entry | SECURITY, ADMIN |
| `PUT` | `/api/visitors/{id}/exit` | Record vehicle exit | SECURITY, ADMIN |
| `GET` | `/api/visitors` | View visitor history | SECURITY, ADMIN |
| `GET` | `/api/visitors/current` | View current visitors | SECURITY, ADMIN |
| `GET` | `/api/visitors/{id}` | View visitor details | SECURITY, ADMIN |
| `GET` | `/api/parking-slots` | View all slots and status | SECURITY, ADMIN |
| `GET` | `/api/parking-slots/occupied` | View occupied slots | SECURITY, ADMIN |
| `POST` | `/api/parking-slots` | Create parking slot | ADMIN |
| `DELETE` | `/api/parking-slots/{id}` | Delete parking slot | ADMIN |
| `POST` | `/api/flats` | Create flat | ADMIN |
| `GET` | `/api/flats` | View all flats | SECURITY, ADMIN |
| `GET` | `/api/flats/{id}` | View flat details | SECURITY, ADMIN |
| `GET` | `/api/reports/daily` | Daily visitor report | SECURITY, ADMIN |
| `GET` | `/api/reports` | Date-range report | ADMIN |

---

# 🔄 Complete Vehicle Lifecycle

```text
                 ┌──────────────────┐
                 │ Vehicle Arrives  │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Select Slot      │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Slot Occupied?   │
                 └───────┬───┬──────┘
                         │   │
                       YES   NO
                         │   │
                         ▼   ▼
                     ┌───┐ ┌──────────────┐
                     │ ❌ │ │ Create Visit │
                     └───┘ └──────┬───────┘
                                  │
                                  ▼
                         entryTime = NOW
                         exitTime = NULL
                                  │
                                  ▼
                         ┌────────────────┐
                         │ Slot OCCUPIED  │
                         └───────┬────────┘
                                 │
                                 │ Vehicle leaves
                                 ▼
                         ┌────────────────┐
                         │ Record Exit    │
                         └───────┬────────┘
                                 │
                                 ▼
                         exitTime = NOW
                                 │
                                 ▼
                         ┌────────────────┐
                         │   Slot FREE    │
                         └────────────────┘
```

---

# ⚠️ Error Handling

The API returns clear HTTP status codes and messages.

### `400 Bad Request`

Invalid input.

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Slot ID must be a positive number."
}
```

### `401 Unauthorized`

JWT is missing or invalid.

### `403 Forbidden`

Authenticated user does not have permission.

### `404 Not Found`

Requested resource does not exist.

```json
{
  "error": "VISITOR_NOT_FOUND",
  "message": "Visitor record with ID 15 was not found."
}
```

### `409 Conflict`

Business rule violation.

```json
{
  "error": "PARKING_SLOT_OCCUPIED",
  "message": "Parking slot 5 is already occupied."
}
```

---

# 🛡️ Security

ParkSpot follows basic backend security practices:

- 🔐 JWT authentication
- 🔑 BCrypt password hashing
- 👮 Role-based authorization
- 🚫 Protected APIs
- ✅ Request validation
- 🧠 Business-rule validation in service layer
- 🕐 Server-controlled timestamps
- ❌ No plain-text passwords

---

# 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| Java | Backend language |
| Spring Boot | Application framework |
| Spring Web | REST APIs |
| Spring Data JPA | Database access |
| Spring Security | Authentication & authorization |
| JWT | Stateless authentication |
| BCrypt | Password hashing |
| MySQL / PostgreSQL | Relational database |
| Maven | Dependency management |
| Bean Validation | Request validation |
| Postman / Swagger | API testing |

---

# 🚀 Setup & Run

## 1. Clone the project

```bash
git clone <repository-url>
cd parkspot
```

## 2. Configure the database

Update:

```text
src/main/resources/application.properties
```

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/parkspot
spring.datasource.username=root
spring.datasource.password=your_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

server.port=8080
```

---

## 3. Build the project

```bash
mvn clean install
```

---

## 4. Run the application

```bash
mvn spring-boot:run
```

Application:

```text
http://localhost:8080
```

---

# 🧪 Testing Flow

A complete test can be performed in this order:

```text
1. Admin Login
       ↓
2. Create Flats
       ↓
3. Create Parking Slots
       ↓
4. Create Security User
       ↓
5. Security Login
       ↓
6. Register Vehicle Entry
       ↓
7. View Occupied Slots
       ↓
8. Try assigning the same slot again
       ↓
9. Verify rejection
       ↓
10. Record Vehicle Exit
       ↓
11. Verify slot becomes FREE
       ↓
12. Assign the slot to another vehicle
       ↓
13. Generate Daily Report
```

---

# 💡 Future Enhancements

The backend can later be extended with:

- 📱 Mobile/web dashboard
- 🔎 Vehicle-number search
- 📅 Advanced report filtering
- 📈 Parking statistics dashboard
- 🔔 Notifications for long-staying vehicles
- 📷 Automatic number-plate recognition
- 🧾 Export reports to PDF/CSV
- 🅿️ Multiple parking zones
- 🏢 Multiple buildings/blocks
- 📝 Audit logs for security actions

---

# 🎯 Project Goal

The goal of **ParkSpot** is to provide a simple, reliable and secure digital parking-management system for residential societies.

The key design principle is:

> **Every parking visit is recorded, every active slot is traceable, and a slot cannot be reused until the previous vehicle has exited.**

---

## 👨‍💻 Development Approach

The project will be implemented incrementally:

```text
Phase 1 → Project & Database Setup
Phase 2 → Entities & Relationships
Phase 3 → Repository Layer
Phase 4 → Visitor Entry/Exit Logic
Phase 5 → Parking Slot Management
Phase 6 → Flat Management
Phase 7 → JWT Authentication
Phase 8 → Role-Based Authorization
Phase 9 → Reports
Phase 10 → Validation & Global Exception Handling
Phase 11 → API Testing
Phase 12 → Documentation
```

---

**ParkSpot 🚗 — Track. Park. Exit.**
