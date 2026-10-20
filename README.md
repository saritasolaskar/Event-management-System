# 🚍 Event Transport Management System

> A full-stack event transportation and fleet operations platform for managing clients, events, guests, vehicles, drivers, duties, GPS tracking, billing, approvals, and financial documents from a centralized system.

![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![Express.js](https://img.shields.io/badge/Express.js-API-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![React](https://img.shields.io/badge/React-Frontend-blue)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)

## 📌 Overview

Event Transport Management System is a full-stack application designed to digitize and manage the complete transportation lifecycle of events.

The system connects clients, events, guests, vehicles, drivers, vendors, assignments, duties, GPS tracking, billing, invoices, approvals, notifications, and audit records into one centralized platform.



Event Transport Management System

A full-stack Event Transport Management System designed to manage the complete transportation lifecycle of events — from client and event creation to guest management, vehicle and driver assignment, trip execution, GPS tracking, billing, approvals, and invoice generation.

The system provides dedicated workflows for Administrators/Operations teams, Clients, and Drivers, while maintaining centralized operational, financial, and audit records.

🚀 Project Overview

Managing transportation for large events involves coordinating multiple entities such as:

Clients
Events
Guests
Vehicles
Drivers
Vendors
Locations
Vehicle assignments
Guest assignments
Duties/trips
GPS tracking
Commercial packages
Expenses
Vendor bills
Client invoices
Approvals

Handling these operations manually can lead to scheduling conflicts, duplicate assignments, billing errors, and poor visibility into trip operations.

This project solves these problems through a centralized digital platform.

Core Workflow
Client
   ↓
Event
   ↓
Guests
   ↓
Guest Assignment
   ↓
Vehicle Assignment
   ↓
Driver Assignment
   ↓
Duty / Trip
   ↓
GPS & Odometer Tracking
   ↓
Billing Engine
   ↓
Vendor Bill + Client Invoice
   ↓
Approval
   ↓
Payment / Completion
🎯 Objectives

The main objectives of the system are:

Centralize event transportation operations.
Reduce manual transportation management.
Prevent duplicate vehicle and driver assignments.
Track guest transportation throughout an event.
Monitor vehicle and driver duties.
Record trip kilometers and hours.
Track operational expenses.
Automatically calculate billing.
Generate vendor bills and client invoices.
Provide approval and payment workflows.
Maintain audit logs for important operations.
Provide role-based access to different users.
👥 User Roles
1. Administrator / Operations

Administrators and operations users can manage the complete transportation system.

They can:

Manage clients
Create and manage events
Manage guests
Manage vehicles
Manage drivers
Manage vendors
Manage locations
Configure commercial packages
Assign vehicles and drivers
Manage guest assignments
Start and complete duties
Monitor tracking
Manage billing
Approve bills and invoices
View audit logs
Manage notifications
2. Client

Clients can access their own event and transportation information.

Client functionality includes:

Client authentication
View assigned events
View transportation information
View guest/event-related information
View invoices
Access generated invoice documents

Client data is protected so that one client cannot access another client's information.

3. Driver

Drivers interact with the system through the driver workflow.

Driver functionality includes:

Driver authentication
View assigned duties
View assigned vehicle
View assigned guests
Update guest pickup/drop status
Start duty
Complete duty
Enter odometer readings
Record operational expenses
Update trip progress
Send/receive relevant notifications
GPS/tracking related operations
🧩 Major Modules
Authentication & Authorization
User registration and login
JWT-based authentication
Role-based authorization
Protected API routes
Current-user validation
Client/driver access restrictions
Client Management
Create clients
Update client information
Activate/deactivate clients
Soft delete and restore support
Client ownership validation
Event Management
Event creation
Event status management
Event date validation
Client-event relationship
Event lifecycle management
Event operational validation
Guest Management
Guest creation
Guest status management
Guest assignment
Pickup/drop tracking
Guest lifecycle management
Guest Assignment
Assign guests to vehicles
Manage pickup/drop states
Prevent duplicate active assignments
Driver-side assignment updates
Assignment lifecycle tracking
Vehicle Management
Vehicle registration
Vehicle status
Vehicle availability
Vendor association
Driver association
Vehicle-driver consistency validation
Driver Management
Driver registration
Driver status
Driver-vehicle association
Driver availability
Duty authorization
Vendor Management
Vendor registration
Vendor information
Vendor status
Vendor-vehicle relationship
Vendor-driver relationship
Dependency checks before deletion
Location Management
Pickup locations
Drop locations
Event locations
Location status management
Location validation
Commercial Packages

Commercial packages allow transportation pricing to be configured using:

Package kilometers
Package hours
Base rates
Extra kilometer rates
Extra hour rates
Additional commercial configuration

The package information is also used as a snapshot during billing to prevent historical billing records from changing when the package configuration changes later.

Vehicle Assignment

The vehicle assignment module connects:

Event
   ↓
Vehicle
   ↓
Driver
   ↓
Vendor
   ↓
Commercial Package

It includes:

Vehicle assignment
Driver assignment
Vendor validation
Assignment status lifecycle
Duplicate assignment prevention
Assignment cancellation
Assignment-level commercial snapshot
Duty / Trip Management

Duties represent actual transportation operations.

The lifecycle is:

ASSIGNED
    ↓
ON_DUTY
    ↓
COMPLETED

The system records:

Start odometer
End odometer
Total kilometers
Duty start time
Duty end time
Driver
Vehicle
Event
Expenses
GPS / Tracking

The system supports operational tracking stages such as:

NOT_STARTED
      ↓
PICKUP_STARTED
      ↓
PICKUP_COMPLETED
      ↓
EVENT_DUTY
      ↓
RETURN_STARTED
      ↓
RETURN_COMPLETED
      ↓
COMPLETED

Tracking also validates:

Latitude/longitude
Driver authorization
Active duty
Tracking stage progression
Latest vehicle location
Billing Engine

The billing engine calculates transportation charges using:

Package kilometers
Actual kilometers
Package hours
Actual hours
Extra kilometers
Extra hours
Parking charges
Toll charges
Entry charges
DA charges
Vendor-specific rates
Client-specific rates

The system maintains separate commercial calculations for vendor billing and client billing.

Vendor Bills

Vendor bills are generated from completed duties.

The system validates:

Completed duty
Vendor association
Vehicle assignment
Commercial package
Duplicate bill prevention
Client Invoices

Client invoices are generated from completed transportation operations.

Invoice records contain:

Invoice number
Invoice date
Event
Client
Vehicle assignment
Driver
Commercial package snapshot
Kilometer charges
Hour charges
Additional expenses
Total amount
Approval information
Billing Approval

Bills and invoices follow controlled lifecycle states:

DRAFT
  ↓
UNDER_REVIEW
  ↓
APPROVED
  ↓
SHARED
  ↓
PAID

Rejected documents follow the rejection workflow and cannot incorrectly transition through later states.

Atomic state transitions are used to reduce race-condition problems during concurrent approval operations.

PDF Generation

The system supports PDF generation for operational and financial documents, including:

Duty sheets
Guest manifests
Vendor bills
Client invoices

PDF generation is handled through a centralized PDF utility using Handlebars templates and Puppeteer.

Notifications

The notification module provides a centralized mechanism for notifying users about important events such as:

Vehicle assignment
Duty started
Duty completed
Operational updates

Notifications support:

Read/unread status
Ownership validation
Notification types
Soft deletion
Unread count
Audit Logs

Important operations can be recorded through audit logs to provide traceability across the system.

Audit information can include:

User
Action
Module
Reference
Timestamp
Changes/context
🏗️ System Architecture
                    ┌─────────────────────┐
                    │      Clients        │
                    │     Web Portal      │
                    └──────────┬──────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────┐
│                 React Frontend                   │
│                                                  │
│  Admin / Operations │ Client │ Driver Workflows │
└───────────────────────┬──────────────────────────┘
                        │ REST API
                        ▼
┌──────────────────────────────────────────────────┐
│               Node.js / Express API              │
│                                                  │
│ Authentication & Authorization                   │
│ Client / Event / Guest Management                │
│ Vehicle / Driver / Vendor Management             │
│ Assignments & Duties                             │
│ Tracking & Billing                               │
│ Notifications & Audit Logs                      │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │    MongoDB    │
                │   Database    │
                └───────────────┘
🛠️ Technology Stack
Backend
Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
REST APIs
Express Validator
Puppeteer
Handlebars
Cloudinary integration foundation
Frontend
React
Vite
JavaScript
HTML5
CSS3
Development Tools
Git
GitHub
VS Code
MongoDB Compass
Postman
🔐 Security & Data Integrity

The project includes several security and integrity mechanisms:

JWT authentication
Role-based authorization
Protected routes
Client ownership validation
Driver ownership validation
MongoDB ObjectId validation
Request validation
Whitelisted update fields
Soft deletion
Duplicate assignment prevention
Atomic state transitions
Duplicate-key handling
Dependency checks before deletion
Audit logging
Controlled billing approval workflow

The system also uses database-level constraints for important relationships such as active driver/vehicle assignments.

📊 Data Relationships

The main relationships are:

Client
 └── Events
      ├── Guests
      │    └── Guest Assignments
      │          └── Vehicle
      │               └── Driver
      │
      └── Vehicle Assignments
             ├── Vehicle
             ├── Driver
             ├── Vendor
             ├── Commercial Package
             └── Duty
                    ├── Tracking
                    ├── Expenses
                    ├── Vendor Bill
                    └── Client Invoice
📄 PDF Documents

The system can generate structured PDF documents using templates.

Examples:

Duty Sheet
Guest Manifest
Vendor Bill
Client Invoice

This allows operational and financial documents to be generated directly from system data rather than manually preparing them.

🔄 Example Event Workflow

A typical event can be processed as follows:

Step 1 — Create Client

The operations team creates the client profile.

Step 2 — Create Event

An event is created and linked to the client.

Step 3 — Add Guests

Guests are added to the event.

Step 4 — Assign Transportation

Vehicles and drivers are assigned according to event requirements.

Step 5 — Assign Guests

Guests are mapped to the appropriate transportation.

Step 6 — Start Duty

The assigned driver starts the duty and records the starting odometer.

Step 7 — Track Trip

Trip progress and operational stages are recorded.

Step 8 — Complete Duty

The driver records the ending odometer and completes the duty.

Step 9 — Generate Billing

The billing engine calculates the transportation charges.

Step 10 — Generate Documents

Vendor bills and client invoices are generated.

Step 11 — Approval

Authorized users review and approve financial documents.

Step 12 — Payment

Approved documents move through the payment workflow.

💡 Key Features
End-to-end event transportation management
Multi-role system
Client-specific data access
Driver-specific operational workflows
Vehicle-driver-vendor relationships
Guest transportation management
GPS/tracking workflow
Odometer-based billing
Commercial package snapshots
Automated billing calculations
Vendor billing
Client invoicing
Approval workflow
PDF generation
Notifications
Audit logging
Soft deletion
Duplicate prevention
Race-condition-aware state transitions
RESTful backend architecture
🧪 Testing & Validation

The backend has been tested through API-level validation including:

Successful database connection
Authentication
Registration
Login
Protected routes
Invalid request handling
Duplicate record handling
Role authorization
Vehicle assignment validation
Driver assignment validation
Duty lifecycle
Billing calculations
Vendor bills
Client invoices
Billing approval workflow
PDF generation endpoints
Invalid ObjectId handling
Soft deletion behavior
📁 Project Structure
Event-management-System/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── templates/
│   │   ├── utils/
│   │   └── validators/
│   │
│   └── package.json
│
├── admin-portal/
├── client-portal/
├── driver-app/
├── shared/
├── docs/
├── scripts/
│
├── docker-compose.yml
└── README.md
⚙️ Installation
1. Clone the repository
git clone https://github.com/saritasolaskar/Event-management-System.git
cd Event-management-System
2. Checkout the development branch
git checkout project-completion
3. Install backend dependencies
cd backend
npm install
4. Configure environment variables

Create a .env file inside the backend:

MONGO_URI=mongodb://localhost:27017/Event-Data
PORT=5000
JWT_SECRET=your_jwt_secret

Add other environment variables required by the PDF, email, Cloudinary, or deployment configuration used by your environment.

5. Start the backend
npm run dev

or:

npm start
🌐 API Base URL

During local development:

http://localhost:5000/api/v1

Example health endpoint:

GET /api/v1/health
🗄️ Database

The project uses MongoDB with Mongoose.

Default local database:

Event-Data

MongoDB Compass can be used to inspect the database during development.

📌 Future Enhancements

Potential future improvements include:

Advanced real-time GPS visualization
Automated route optimization
AI-based vehicle allocation
Predictive delay detection
Advanced transportation analytics
Automated email/SMS notifications
Driver performance analytics
Advanced city/event transportation dashboards
Cloud deployment
CI/CD pipeline
Automated integration and end-to-end testing
🎓 Academic / Placement Project Value

This project demonstrates practical experience with:

Full-stack application development
REST API design
Database modeling
Authentication and authorization
Role-based access control
MongoDB/Mongoose
React frontend architecture
Business logic implementation
Financial workflows
Document generation
Data validation
Concurrency and race-condition handling
Soft deletion and data integrity
Modular backend architecture
Git/GitHub workflow

Rather than being a simple CRUD application, the project models a real-world transportation operation with interconnected operational and financial workflows.

👩‍💻 Developer

Sarita Solaskar

4th Year Information Technology Engineering Student

GitHub: https://github.com/saritasolaskar

📜 License

This project is developed for academic, learning, and portfolio purposes.