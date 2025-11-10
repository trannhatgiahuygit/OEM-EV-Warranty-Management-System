# Technician Availability Feature - User Guide

## Overview
This feature allows **SC Staff** to see which **SC Technicians** are ready to receive new open claims in real-time. The system tracks technician workload and availability status automatically.

---

## 🎯 Feature Components

### 1. **Technician Availability Widget**
- **Location**: Claim Management Page (SC Staff Dashboard)
- **Purpose**: Provides real-time visibility of technician readiness
- **Features**:
  - Shows count of available technicians (e.g., "3/5 technicians ready")
  - Visual indicator (✓ green = available, ✗ red = none available)
  - Expandable list showing all technicians with status and workload
  - Auto-refreshes every 30 seconds
  - Manual refresh button

### 2. **Enhanced Technician Selection**
- **Location**: New Repair Claim Page (when creating/editing claims)
- **Purpose**: Shows availability status when selecting a technician
- **Features**:
  - Color-coded search results (green border = available, red = busy)
  - Status badges (Sẵn sàng / Bận)
  - Workload information (current/max workload)
  - Specialization display

### 3. **Technician Status in Claim Details**
- **Location**: Claim Detail Page
- **Purpose**: Shows assigned technician's current availability status
- **Features**:
  - Availability status badge
  - Current workload display
  - Specialization information

---

## 👥 Role Actors & Responsibilities

### **SC_STAFF (Service Center Staff)**

#### Responsibilities:
1. **View Technician Availability**
   - Access the Technician Availability Widget on the Claim Management page
   - Monitor which technicians are ready to receive new claims
   - Make informed decisions when assigning claims to technicians

2. **Assign Claims to Technicians**
   - Create new repair claims
   - Select technicians from the enhanced search dropdown
   - See availability status before assigning
   - Assign claims only to available technicians (recommended)

3. **Monitor Claim Status**
   - View claim details to see assigned technician's status
   - Check technician workload when reviewing claims

#### Access Points:
- **Claim Management Page**: View technician availability widget
- **New Repair Claim Page**: Select technician with availability info
- **Claim Detail Page**: View assigned technician's status

---

### **SC_TECHNICIAN (Service Center Technician)**

#### Responsibilities:
1. **Work on Assigned Claims**
   - Receive claims assigned by SC Staff
   - Complete diagnostic work
   - Update claim status as work progresses

2. **Automatic Status Updates**
   - Workload is automatically updated when:
     - Work orders are assigned → Workload increases
     - Work orders are completed → Workload decreases
   - Status changes automatically:
     - **AVAILABLE** → When workload < max workload
     - **BUSY** → When workload reaches max capacity

#### Access Points:
- **Technician Claim Management Page**: View assigned claims
- **Claim Detail Page**: View own workload status
- **Update Diagnostic Page**: Work on assigned claims

---

### **ADMIN**

#### Responsibilities:
1. **Manage Technician Profiles**
   - Create technician profiles
   - Set max workload capacity
   - Update specialization and certification levels
   - Monitor overall technician availability

2. **View System Status**
   - Access technician availability widget
   - View all technician profiles and status
   - Monitor workload distribution

#### Access Points:
- All SC Staff access points
- User Management: Create/update technician profiles
- Technician Profile Management: Set workload limits

---

## 📋 Step-by-Step Usage Guide

### **Scenario 1: SC Staff Creating a New Claim**

1. **Navigate to New Repair Claim Page**
   - Click "Tạo Yêu cầu Sửa chữa" from dashboard
   - Fill in customer and vehicle information

2. **Select Technician**
   - In the "Phân công" section, start typing technician name or ID
   - Search results will show:
     - **Green border** = Available technician (ready to receive work)
     - **Red border** = Busy technician (at capacity)
     - Status badge: "Sẵn sàng" or "Bận"
     - Workload: "2/5" (current/max)
     - Specialization (if available)

3. **Make Selection**
   - Click on an available technician (recommended)
   - Or select a busy technician if necessary
   - Complete the claim form and submit

4. **Verify Assignment**
   - After creating the claim, view it in Claim Detail Page
   - Check the assigned technician's status and workload

---

### **Scenario 2: SC Staff Monitoring Technician Availability**

1. **Access Claim Management Page**
   - Navigate to "Quản lý Yêu cầu" from dashboard
   - The Technician Availability Widget appears at the top

2. **View Summary**
   - See the count: "3/5 technicians ready to receive new claims"
   - Check the indicator:
     - **✓ Green** = At least one technician is available
     - **✗ Red** = No technicians available

3. **Expand for Details**
   - Click on the widget header to expand
   - View full list of technicians:
     - Name and specialization
     - Status (Sẵn sàng / Bận)
     - Workload (X/Y with percentage)

4. **Refresh Status**
   - Widget auto-refreshes every 30 seconds
   - Click "🔄 Làm mới" button for manual refresh

---

### **Scenario 3: Viewing Assigned Technician Status**

1. **Open Claim Detail Page**
   - Click on any claim from the claim list
   - Navigate to "Phân công" section

2. **View Technician Information**
   - See assigned technician's name
   - Check availability status badge:
     - **Green "Sẵn sàng"** = Available
     - **Red "Bận"** = Busy
   - View workload: "2/5 (40%)"
   - See specialization (if available)

3. **Make Decisions**
   - If technician is busy, consider reassigning
   - If available, technician can take more work

---

## 🔄 Automatic Status Updates

### **When Technician Status Changes:**

1. **Work Order Assigned**
   - Technician workload increases by 1
   - If workload reaches max → Status changes to "BUSY"
   - Availability widget updates automatically

2. **Work Order Completed**
   - Technician workload decreases by 1
   - If workload drops below max → Status changes to "AVAILABLE"
   - Availability widget updates automatically

3. **Work Order Cancelled**
   - Technician workload decreases by 1
   - Status may change to "AVAILABLE" if below max

---

## 🎨 Visual Indicators

### **Status Badges:**
- **Sẵn sàng** (Green): Technician is available and can take new work
- **Bận** (Red): Technician is at full capacity

### **Color Coding:**
- **Green border**: Available technician (in search results)
- **Red border**: Busy technician (in search results)
- **Gray border**: Unknown status (no profile found)

### **Workload Display:**
- Format: "X/Y (Z%)"
- Example: "2/5 (40%)" = 2 current assignments out of 5 maximum (40% capacity)

---

## ⚙️ Technical Details

### **Availability Criteria:**
A technician is considered "available" when:
- Assignment status = "AVAILABLE"
- Current workload < Max workload
- User account is active

### **API Endpoints Used:**
- `GET /api/technicians/available` - Get available technicians
- `GET /api/technicians` - Get all technicians
- `GET /api/technicians/user/{userId}` - Get technician profile
- `GET /api/technicians/statistics` - Get workload statistics

### **Real-time Updates:**
- Widget auto-refreshes every 30 seconds
- Status updates when work orders are assigned/completed
- Manual refresh available via button

---

## 🚨 Important Notes

1. **Workload Management**
   - Technicians have a maximum workload (default: 5)
   - Workload is tracked automatically by the system
   - Status changes automatically based on workload

2. **Profile Requirement**
   - Technicians must have a profile to show availability
   - Technicians without profiles show "Unknown" status
   - Admin should create profiles for all technicians

3. **Assignment Recommendations**
   - Always assign to available technicians when possible
   - Busy technicians can still be assigned if necessary
   - System will prevent assignment if technician is at absolute max capacity

4. **Status Accuracy**
   - Status is updated in real-time
   - Manual refresh may be needed if auto-refresh hasn't run
   - Workload updates occur when work orders change status

---

## 📊 Best Practices

1. **For SC Staff:**
   - Check technician availability before creating claims
   - Prioritize assigning to available technicians
   - Monitor workload distribution regularly
   - Use the widget to plan claim assignments

2. **For Technicians:**
   - Complete work orders promptly to free up capacity
   - Update claim status as work progresses
   - Communicate with SC Staff about availability

3. **For Admins:**
   - Set appropriate max workload for each technician
   - Create profiles for all technicians
   - Monitor system-wide workload distribution
   - Adjust workload limits based on technician performance

---

## 🔍 Troubleshooting

### **Widget not showing technicians:**
- Check if technicians have profiles created
- Verify technicians are active users
- Check API endpoint accessibility

### **Status not updating:**
- Wait for auto-refresh (30 seconds)
- Click manual refresh button
- Check if work orders are being completed properly

### **Technician shows as busy but has capacity:**
- Check if work orders are stuck in "IN_PROGRESS"
- Verify work order completion status
- Check technician profile max workload setting

---

## 🎯 Summary

This feature provides SC Staff with real-time visibility into technician availability, enabling better claim assignment decisions and improved workload distribution. The system automatically tracks and updates technician status based on work order assignments and completions.

**Key Benefits:**
- ✅ Real-time availability monitoring
- ✅ Informed claim assignment decisions
- ✅ Automatic workload tracking
- ✅ Visual status indicators
- ✅ Improved workflow efficiency

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Verify technician profiles are created
3. Check API endpoint accessibility
4. Contact system administrator

---

**Last Updated**: 2024
**Feature Version**: 1.0

