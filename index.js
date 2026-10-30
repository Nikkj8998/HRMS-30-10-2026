var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/file-storage.ts
import { promises as fs } from "fs";
import path from "path";
import session from "express-session";
import createMemoryStore from "memorystore";
import { differenceInMonths, startOfYear, addMonths } from "date-fns";
var MemoryStore, FileStorage;
var init_file_storage = __esm({
  "server/file-storage.ts"() {
    "use strict";
    MemoryStore = createMemoryStore(session);
    FileStorage = class {
      dataFilePath;
      data;
      sessionStore;
      constructor(dataPath = "data/hr-data.json") {
        this.dataFilePath = dataPath;
        this.data = {
          users: [],
          departments: [],
          units: [],
          attendanceRecords: [],
          leaveRequests: [],
          holidayRecords: [],
          notifications: [],
          paymentRecords: [],
          employeeInvitations: [],
          certifications: [],
          bankMasters: [],
          categoryMasters: [],
          companyMasters: [],
          costCenters: [],
          documentApprovals: [],
          employeeDeductions: [],
          goals: [],
          systemSettings: {},
          currentUserId: 1,
          currentDepartmentId: 1,
          currentUnitId: 1,
          currentAttendanceId: 1,
          currentLeaveRequestId: 1,
          currentHolidayId: 1,
          currentNotificationId: 1,
          currentPaymentRecordId: 1,
          currentInvitationId: 1,
          currentCertificationId: 1,
          currentBankMasterId: 1,
          currentCategoryMasterId: 1,
          currentCompanyMasterId: 1,
          currentCostCenterId: 1,
          currentDocumentApprovalId: 1,
          currentEmployeeDeductionId: 1,
          currentGoalId: 1
        };
        this.sessionStore = new MemoryStore({
          checkPeriod: 864e5
          // prune expired entries every 24h
        });
      }
      async initialize() {
        await this.ensureDataDirectory();
        await this.loadData();
        if (this.data.departments.length === 0) {
          await this.initializeDefaultData();
        }
      }
      async ensureDataDirectory() {
        const dir = path.dirname(this.dataFilePath);
        try {
          await fs.mkdir(dir, { recursive: true });
        } catch (error) {
        }
      }
      async loadData() {
        try {
          const fileContent = await fs.readFile(this.dataFilePath, "utf-8");
          this.data = JSON.parse(fileContent);
          this.data.users = this.data.users.map((user) => ({
            ...user,
            joinDate: user.joinDate ? new Date(user.joinDate) : /* @__PURE__ */ new Date()
          }));
          this.data.attendanceRecords = this.data.attendanceRecords.map((record) => ({
            ...record,
            checkInTime: record.checkInTime ? new Date(record.checkInTime) : null,
            checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : null,
            date: record.date ? new Date(record.date) : null
          }));
          this.data.leaveRequests = this.data.leaveRequests.map((request) => ({
            ...request,
            startDate: new Date(request.startDate),
            endDate: new Date(request.endDate),
            createdAt: request.createdAt ? new Date(request.createdAt) : /* @__PURE__ */ new Date()
          }));
          this.data.holidayRecords = this.data.holidayRecords.map((holiday) => ({
            ...holiday,
            date: new Date(holiday.date)
          }));
          if (this.data.paymentRecords) {
            this.data.paymentRecords = this.data.paymentRecords.map((record) => ({
              ...record,
              paymentDate: record.paymentDate ? new Date(record.paymentDate) : null,
              createdAt: record.createdAt ? new Date(record.createdAt) : null
            }));
          } else {
            this.data.paymentRecords = [];
          }
          if (this.data.employeeInvitations) {
            this.data.employeeInvitations = this.data.employeeInvitations.map((invitation) => ({
              ...invitation,
              createdAt: invitation.createdAt ? new Date(invitation.createdAt) : /* @__PURE__ */ new Date(),
              usedAt: invitation.usedAt ? new Date(invitation.usedAt) : null
            }));
          } else {
            this.data.employeeInvitations = [];
          }
          if (!this.data.currentInvitationId) {
            this.data.currentInvitationId = 1;
          }
          if (!this.data.units) {
            this.data.units = [];
          }
          if (!this.data.currentUnitId) {
            this.data.currentUnitId = this.data.units.length > 0 ? Math.max(...this.data.units.map((u) => u.id)) + 1 : 1;
          }
        } catch (error) {
          console.log("No existing data file found, starting with empty data");
        }
      }
      async saveData() {
        await this.ensureDataDirectory();
        await fs.writeFile(this.dataFilePath, JSON.stringify(this.data, null, 2), "utf-8");
      }
      async initializeDefaultData() {
        await this.createDepartment({ name: "Human Resources", code: "HR", description: "Manages employee relations, hiring, and company policies" });
        await this.createDepartment({ name: "Engineering", code: "ENG", description: "Software development and technical operations" });
        await this.createDepartment({ name: "Marketing", code: "MKT", description: "Handles brand awareness and promotional activities" });
        await this.createDepartment({ name: "Finance", code: "FIN", description: "Manages financial planning and accounting" });
        await this.initializeUser({
          username: "admin",
          password: "c56a7d8799d79a96bd917d2aea44a92cd3525c4313b14bf45467e40ee4a5b4b4b2d9cab3fe0aac89a56a4c00060a28226ef445e9969fce314e41a9fffd1b3ff4.6a2da20943931e46",
          email: "admin@hrconnect.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          departmentId: 1,
          position: "HR Director",
          phoneNumber: "123-456-7890",
          address: "123 Main St, Anytown, USA",
          joinDate: /* @__PURE__ */ new Date(),
          isActive: true
        });
        await this.initializeUser({
          username: "hr",
          password: "4ed0c57d4e5b87cd80d3a2060e82c30e6e8cddea45e9655bd2eb471192c1e8bb6e7a15d7f8134c04dcbe56f5ee49b249f38a63ddcd4d81a64ca0c8c06aa67154.b1d6f9fdf91e77c8",
          email: "hr@hrconnect.com",
          firstName: "HR",
          lastName: "Manager",
          role: "hr",
          departmentId: 1,
          position: "HR Manager",
          phoneNumber: "123-456-7891",
          address: "124 Main St, Anytown, USA",
          joinDate: /* @__PURE__ */ new Date(),
          isActive: true
        });
        await this.initializeUser({
          username: "manager",
          password: "f064cc778f9ee67f2a3b2d8a7a0e4a8f06e1b12e7d68b1cb0b5c87ca3ad13cefc8e22f3bb8a0d9f5ce78ca28ba9ecc20889c27b20e93917545a85979fc92987.9a3992ad0c5f4ce2",
          email: "manager@hrconnect.com",
          firstName: "Department",
          lastName: "Manager",
          role: "manager",
          departmentId: 2,
          position: "Engineering Manager",
          phoneNumber: "123-456-7892",
          address: "125 Main St, Anytown, USA",
          joinDate: /* @__PURE__ */ new Date(),
          isActive: true
        });
        await this.initializeUser({
          username: "employee",
          password: "2d8e6f2a8dd8c5ec52e499bbc1415cff0ea8af36aca4cac16d8bcbe5c967f0cbf5af81f0c1b5ce23b1b7122dea5562d7c1b83d66a5d76deb7f092ab7df283e4.ba4b61d276ab9d68",
          email: "employee@hrconnect.com",
          firstName: "Regular",
          lastName: "Employee",
          role: "employee",
          departmentId: 2,
          position: "Software Developer",
          phoneNumber: "123-456-7893",
          address: "126 Main St, Anytown, USA",
          joinDate: /* @__PURE__ */ new Date(),
          isActive: true
        });
        const holidays2026 = [
          { name: "Republic Day", date: /* @__PURE__ */ new Date("2026-01-26"), description: "Republic Day of India" },
          { name: "Holi", date: /* @__PURE__ */ new Date("2026-03-17"), description: "Festival of Colors" },
          { name: "Good Friday", date: /* @__PURE__ */ new Date("2026-04-03"), description: "Good Friday" },
          { name: "Eid ul-Fitr", date: /* @__PURE__ */ new Date("2026-03-31"), description: "End of Ramadan" },
          { name: "Dr. Ambedkar Jayanti", date: /* @__PURE__ */ new Date("2026-04-14"), description: "Birth Anniversary of Dr. B.R. Ambedkar" },
          { name: "May Day", date: /* @__PURE__ */ new Date("2026-05-01"), description: "International Workers' Day" },
          { name: "Independence Day", date: /* @__PURE__ */ new Date("2026-08-15"), description: "Independence Day of India" },
          { name: "Ganesh Chaturthi", date: /* @__PURE__ */ new Date("2026-08-27"), description: "Birthday of Lord Ganesha" },
          { name: "Mahatma Gandhi Jayanti", date: /* @__PURE__ */ new Date("2026-10-02"), description: "Birth Anniversary of Mahatma Gandhi" },
          { name: "Dussehra", date: /* @__PURE__ */ new Date("2026-10-02"), description: "Victory of Good over Evil" },
          { name: "Diwali", date: /* @__PURE__ */ new Date("2026-10-21"), description: "Festival of Lights" },
          { name: "Guru Nanak Jayanti", date: /* @__PURE__ */ new Date("2026-11-08"), description: "Birthday of Guru Nanak Dev Ji" },
          { name: "Christmas", date: /* @__PURE__ */ new Date("2026-12-25"), description: "Christmas Day" }
        ];
        for (const h of holidays2026) {
          await this.createHoliday(h);
        }
      }
      // Helper method for initializing users with pre-hashed passwords
      async initializeUser(user) {
        const id = this.data.currentUserId++;
        const newUser = {
          employeeId: null,
          dateOfBirth: null,
          gender: null,
          maritalStatus: null,
          photoUrl: null,
          workLocation: null,
          reportingTo: null,
          uanNumber: null,
          esicNumber: null,
          aadhaarCard: null,
          panCard: null,
          employmentType: "permanent",
          pfApplicable: true,
          esicApplicable: true,
          ptApplicable: true,
          incomeTaxApplicable: false,
          mlwfApplicable: false,
          overtimeApplicable: false,
          bonusApplicable: false,
          bankName: null,
          bankAccountNumber: null,
          bankIFSCCode: null,
          bankAccountType: null,
          salary: null,
          status: "active",
          customPermissions: null,
          documents: null,
          ...user,
          id
        };
        this.data.users.push(newUser);
        await this.saveData();
        return newUser;
      }
      // User methods
      async getUser(id) {
        return this.data.users.find((u) => u.id === id);
      }
      async getUsers() {
        return this.data.users;
      }
      async getUserByUsername(username) {
        return this.data.users.find((u) => u.username === username);
      }
      async getUserByEmail(email) {
        return this.data.users.find((u) => u.email === email);
      }
      async createUser(insertUser) {
        const id = this.data.currentUserId++;
        const user = {
          employeeId: null,
          dateOfBirth: null,
          gender: null,
          maritalStatus: null,
          photoUrl: null,
          workLocation: null,
          reportingTo: null,
          uanNumber: null,
          esicNumber: null,
          aadhaarCard: null,
          panCard: null,
          employmentType: "permanent",
          pfApplicable: true,
          esicApplicable: true,
          ptApplicable: true,
          incomeTaxApplicable: false,
          mlwfApplicable: false,
          overtimeApplicable: false,
          bonusApplicable: false,
          bankName: null,
          bankAccountNumber: null,
          bankIFSCCode: null,
          bankAccountType: null,
          salary: null,
          status: "active",
          customPermissions: null,
          documents: null,
          isActive: true,
          role: "employee",
          ...insertUser,
          id,
          joinDate: insertUser.joinDate || /* @__PURE__ */ new Date(),
          departmentId: insertUser.departmentId ?? null,
          position: insertUser.position ?? null,
          phoneNumber: insertUser.phoneNumber ?? null,
          address: insertUser.address ?? null
        };
        this.data.users.push(user);
        await this.saveData();
        return user;
      }
      async updateUser(id, userData) {
        const index = this.data.users.findIndex((u) => u.id === id);
        if (index === -1) return void 0;
        const updatedUser = { ...this.data.users[index], ...userData };
        this.data.users[index] = updatedUser;
        await this.saveData();
        return updatedUser;
      }
      async deleteUser(id) {
        const index = this.data.users.findIndex((u) => u.id === id);
        if (index === -1) return false;
        this.data.users.splice(index, 1);
        await this.saveData();
        return true;
      }
      async getUsersByDepartment(departmentId) {
        return this.data.users.filter((u) => u.departmentId === departmentId);
      }
      async getAdminUsers() {
        return this.data.users.filter((u) => u.role === "admin" || u.role === "hr");
      }
      // Department methods
      async getDepartment(id) {
        return this.data.departments.find((d) => d.id === id);
      }
      async getDepartments() {
        return this.data.departments;
      }
      async createDepartment(insertDepartment) {
        const id = this.data.currentDepartmentId++;
        const department = {
          ...insertDepartment,
          id,
          code: insertDepartment.code ?? "GEN",
          manager: insertDepartment.manager ?? null,
          location: insertDepartment.location ?? null,
          description: insertDepartment.description ?? null,
          unitId: null
        };
        this.data.departments.push(department);
        await this.saveData();
        return department;
      }
      async updateDepartment(id, departmentData) {
        const index = this.data.departments.findIndex((d) => d.id === id);
        if (index === -1) return void 0;
        const updatedDepartment = { ...this.data.departments[index], ...departmentData };
        this.data.departments[index] = updatedDepartment;
        await this.saveData();
        return updatedDepartment;
      }
      // Unit methods
      async getUnits() {
        return this.data.units;
      }
      async createUnit(insertUnit) {
        const id = this.data.currentUnitId++;
        const unit = {
          ...insertUnit,
          id,
          description: insertUnit.description ?? null
        };
        this.data.units.push(unit);
        await this.saveData();
        return unit;
      }
      async deleteDepartment(id) {
        const index = this.data.departments.findIndex((d) => d.id === id);
        if (index === -1) return false;
        this.data.departments.splice(index, 1);
        await this.saveData();
        return true;
      }
      // Attendance methods
      async getAttendance(id) {
        return this.data.attendanceRecords.find((a) => a.id === id);
      }
      async getAttendanceByUser(userId) {
        return this.data.attendanceRecords.filter((a) => a.userId === userId);
      }
      async getAttendanceByDate(date) {
        const dateString = date.toDateString();
        return this.data.attendanceRecords.filter(
          (record) => record.date && new Date(record.date).toDateString() === dateString
        );
      }
      async getAllAttendance() {
        return this.data.attendanceRecords;
      }
      async createAttendance(insertAttendance) {
        const id = this.data.currentAttendanceId++;
        const attendance = {
          ...insertAttendance,
          id,
          date: insertAttendance.date ?? null,
          status: insertAttendance.status ?? "present",
          checkInTime: insertAttendance.checkInTime ?? null,
          checkOutTime: insertAttendance.checkOutTime ?? null,
          notes: insertAttendance.notes ?? null
        };
        this.data.attendanceRecords.push(attendance);
        await this.saveData();
        return attendance;
      }
      async updateAttendance(id, attendanceData) {
        const index = this.data.attendanceRecords.findIndex((a) => a.id === id);
        if (index === -1) return void 0;
        const updatedAttendance = { ...this.data.attendanceRecords[index], ...attendanceData };
        this.data.attendanceRecords[index] = updatedAttendance;
        await this.saveData();
        return updatedAttendance;
      }
      // Leave methods
      async getLeaveRequest(id) {
        return this.data.leaveRequests.find((l) => l.id === id);
      }
      async getLeaveRequestsByUser(userId) {
        return this.data.leaveRequests.filter((l) => l.userId === userId);
      }
      async getAllLeaveRequests() {
        return this.data.leaveRequests;
      }
      async getPendingLeaveRequests() {
        return this.data.leaveRequests.filter((l) => l.status === "pending");
      }
      async createLeaveRequest(insertLeaveRequest) {
        const id = this.data.currentLeaveRequestId++;
        const leaveRequest = {
          ...insertLeaveRequest,
          id,
          status: insertLeaveRequest.status ?? "pending",
          reason: insertLeaveRequest.reason ?? null,
          approvedById: insertLeaveRequest.approvedById ?? null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.data.leaveRequests.push(leaveRequest);
        await this.saveData();
        return leaveRequest;
      }
      async updateLeaveRequest(id, leaveRequestData) {
        const index = this.data.leaveRequests.findIndex((l) => l.id === id);
        if (index === -1) return void 0;
        const updatedLeaveRequest = { ...this.data.leaveRequests[index], ...leaveRequestData };
        this.data.leaveRequests[index] = updatedLeaveRequest;
        await this.saveData();
        return updatedLeaveRequest;
      }
      async deleteLeaveRequest(id) {
        const index = this.data.leaveRequests.findIndex((l) => l.id === id);
        if (index === -1) return false;
        this.data.leaveRequests.splice(index, 1);
        await this.saveData();
        return true;
      }
      // Holiday methods
      async getHoliday(id) {
        return this.data.holidayRecords.find((h) => h.id === id);
      }
      async getHolidays() {
        return this.data.holidayRecords;
      }
      async createHoliday(insertHoliday) {
        const id = this.data.currentHolidayId++;
        const holiday = {
          ...insertHoliday,
          id,
          description: insertHoliday.description ?? null
        };
        this.data.holidayRecords.push(holiday);
        await this.saveData();
        return holiday;
      }
      async updateHoliday(id, holidayData) {
        const index = this.data.holidayRecords.findIndex((h) => h.id === id);
        if (index === -1) return void 0;
        const updatedHoliday = { ...this.data.holidayRecords[index], ...holidayData };
        this.data.holidayRecords[index] = updatedHoliday;
        await this.saveData();
        return updatedHoliday;
      }
      async deleteHoliday(id) {
        const index = this.data.holidayRecords.findIndex((h) => h.id === id);
        if (index === -1) return false;
        this.data.holidayRecords.splice(index, 1);
        await this.saveData();
        return true;
      }
      // Notification methods
      async getNotification(id) {
        return this.data.notifications.find((n) => n.id === id);
      }
      async getNotificationsByUser(userId) {
        return this.data.notifications.filter((notification) => notification.userId === userId).sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      }
      async getUnreadNotificationsByUser(userId) {
        return this.data.notifications.filter((notification) => notification.userId === userId && !notification.isRead).sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      }
      async createNotification(insertNotification) {
        const id = this.data.currentNotificationId++;
        const notification = {
          ...insertNotification,
          id,
          isRead: insertNotification.isRead ?? false,
          createdAt: /* @__PURE__ */ new Date(),
          relatedUserId: insertNotification.relatedUserId ?? null,
          relatedLeaveId: insertNotification.relatedLeaveId ?? null
        };
        this.data.notifications.push(notification);
        await this.saveData();
        return notification;
      }
      async markNotificationAsRead(id) {
        const notification = this.data.notifications.find((n) => n.id === id);
        if (!notification) return false;
        notification.isRead = true;
        await this.saveData();
        return true;
      }
      async markAllNotificationsAsRead(userId) {
        const userNotifications = this.data.notifications.filter((notification) => notification.userId === userId && !notification.isRead);
        userNotifications.forEach((notification) => {
          notification.isRead = true;
        });
        await this.saveData();
        return true;
      }
      async deleteNotification(id) {
        const index = this.data.notifications.findIndex((n) => n.id === id);
        if (index === -1) return false;
        this.data.notifications.splice(index, 1);
        await this.saveData();
        return true;
      }
      // Payment Record methods
      async getPaymentRecord(id) {
        return this.data.paymentRecords.find((pr) => pr.id === id);
      }
      async getPaymentRecords() {
        return [...this.data.paymentRecords];
      }
      async getPaymentRecordsByEmployee(employeeId) {
        return this.data.paymentRecords.filter((pr) => pr.employeeId === employeeId);
      }
      async getPaymentRecordsByMonth(month) {
        return this.data.paymentRecords.filter((pr) => pr.month === month);
      }
      async createPaymentRecord(paymentRecord) {
        const id = this.data.currentPaymentRecordId++;
        const newPaymentRecord = {
          ...paymentRecord,
          id,
          createdAt: /* @__PURE__ */ new Date(),
          paymentStatus: paymentRecord.paymentStatus ?? "pending",
          paymentDate: paymentRecord.paymentDate ?? null,
          paymentMode: paymentRecord.paymentMode ?? null,
          referenceNo: paymentRecord.referenceNo ?? null
        };
        this.data.paymentRecords.push(newPaymentRecord);
        await this.saveData();
        return newPaymentRecord;
      }
      async updatePaymentRecord(id, paymentRecord) {
        const index = this.data.paymentRecords.findIndex((pr) => pr.id === id);
        if (index === -1) return void 0;
        this.data.paymentRecords[index] = { ...this.data.paymentRecords[index], ...paymentRecord };
        await this.saveData();
        return this.data.paymentRecords[index];
      }
      async deletePaymentRecord(id) {
        const index = this.data.paymentRecords.findIndex((pr) => pr.id === id);
        if (index === -1) return false;
        this.data.paymentRecords.splice(index, 1);
        await this.saveData();
        return true;
      }
      // System settings
      async getSystemSettings() {
        return this.data.systemSettings ?? {};
      }
      // Bank master methods
      async getBankMasters() {
        return this.data.bankMasters ?? [];
      }
      async createBankMaster(bank) {
        const id = this.data.currentBankMasterId++;
        const record = {
          ...bank,
          id,
          address: bank.address ?? null,
          branchCode: bank.branchCode ?? null,
          accountNo: bank.accountNo ?? null,
          ifscCode: bank.ifscCode ?? null,
          micrCode: bank.micrCode ?? null
        };
        this.data.bankMasters.push(record);
        await this.saveData();
        return record;
      }
      // Category master methods
      async getCategoryMasters() {
        return this.data.categoryMasters ?? [];
      }
      async createCategoryMaster(category) {
        const id = this.data.currentCategoryMasterId++;
        const record = { ...category, id };
        this.data.categoryMasters.push(record);
        await this.saveData();
        return record;
      }
      // Company master methods
      async getCompanyMasters() {
        return this.data.companyMasters ?? [];
      }
      async createCompanyMaster(company) {
        const id = this.data.currentCompanyMasterId++;
        const record = { ...company, id, address: company.address ?? null, state: company.state ?? null, pinCode: company.pinCode ?? null, regdNo: company.regdNo ?? null, pfcCode: company.pfcCode ?? null, esicCode: company.esicCode ?? null, panNo: company.panNo ?? null, tanNo: company.tanNo ?? null, gstNo: company.gstNo ?? null, email: company.email ?? null, natureOfBusiness: company.natureOfBusiness ?? null, esiEmployeeContribution: company.esiEmployeeContribution ?? null, esiEmployerContribution: company.esiEmployerContribution ?? null, pfEmployerContribution: company.pfEmployerContribution ?? null };
        this.data.companyMasters.push(record);
        await this.saveData();
        return record;
      }
      // Cost center methods
      async getCostCenters() {
        return this.data.costCenters ?? [];
      }
      async createCostCenter(costCenter) {
        const id = this.data.currentCostCenterId++;
        const record = { ...costCenter, id };
        this.data.costCenters.push(record);
        await this.saveData();
        return record;
      }
      // Document approval methods
      async getDocumentApprovals() {
        return this.data.documentApprovals ?? [];
      }
      async createDocumentApproval(approval) {
        const id = this.data.currentDocumentApprovalId++;
        const record = {
          ...approval,
          id,
          status: approval.status ?? "pending",
          remarks: approval.remarks ?? null
        };
        this.data.documentApprovals.push(record);
        await this.saveData();
        return record;
      }
      // Employee deduction methods
      async getEmployeeDeductions() {
        return this.data.employeeDeductions ?? [];
      }
      async createEmployeeDeduction(deduction) {
        const id = this.data.currentEmployeeDeductionId++;
        const record = { ...deduction, id };
        this.data.employeeDeductions.push(record);
        await this.saveData();
        return record;
      }
      // Employee invitation methods
      async getEmployeeInvitation(id) {
        return this.data.employeeInvitations.find((invitation) => invitation.id === id);
      }
      async getEmployeeInvitationByToken(token) {
        return this.data.employeeInvitations.find((invitation) => invitation.token === token);
      }
      async getEmployeeInvitations() {
        return [...this.data.employeeInvitations];
      }
      async createEmployeeInvitation(insertInvitation) {
        const id = this.data.currentInvitationId++;
        const invitation = {
          ...insertInvitation,
          id,
          usedAt: null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.data.employeeInvitations.push(invitation);
        await this.saveData();
        return invitation;
      }
      async updateEmployeeInvitation(id, invitationData) {
        const index = this.data.employeeInvitations.findIndex((invitation) => invitation.id === id);
        if (index === -1) return void 0;
        this.data.employeeInvitations[index] = { ...this.data.employeeInvitations[index], ...invitationData };
        await this.saveData();
        return this.data.employeeInvitations[index];
      }
      async deleteEmployeeInvitation(id) {
        const index = this.data.employeeInvitations.findIndex((invitation) => invitation.id === id);
        if (index === -1) return false;
        this.data.employeeInvitations.splice(index, 1);
        await this.saveData();
        return true;
      }
      // Leave Balance Calculation Method
      async calculateLeaveBalance(userId, asOfDate) {
        const user = await this.getUser(userId);
        if (!user || !user.joinDate) {
          throw new Error(`User not found or missing join date for userId: ${userId}`);
        }
        const calculationDate = asOfDate || /* @__PURE__ */ new Date();
        const joinDate = new Date(user.joinDate);
        const monthsWorked = differenceInMonths(calculationDate, joinDate);
        const accrualPerMonth = 1.5;
        const totalAccrued = Math.max(0, monthsWorked * accrualPerMonth);
        const allLeaveRequests = await this.getLeaveRequestsByUser(userId);
        const approvedLeaves = allLeaveRequests.filter((request) => request.status === "approved");
        const totalTaken = approvedLeaves.reduce((total, request) => {
          const startDate = new Date(request.startDate);
          const endDate = new Date(request.endDate);
          if (startDate <= calculationDate) {
            const timeDifference = endDate.getTime() - startDate.getTime();
            const daysDifference = Math.ceil(timeDifference / (1e3 * 3600 * 24)) + 1;
            return total + daysDifference;
          }
          return total;
        }, 0);
        const pendingLeaves = allLeaveRequests.filter((request) => request.status === "pending");
        const pendingRequests = pendingLeaves.reduce((total, request) => {
          const startDate = new Date(request.startDate);
          const endDate = new Date(request.endDate);
          if (startDate <= calculationDate) {
            const timeDifference = endDate.getTime() - startDate.getTime();
            const daysDifference = Math.ceil(timeDifference / (1e3 * 3600 * 24)) + 1;
            return total + daysDifference;
          }
          return total;
        }, 0);
        const remainingBalance = Math.max(0, totalAccrued - totalTaken - pendingRequests);
        const nextAccrualDate = addMonths(startOfYear(calculationDate), Math.floor(monthsWorked) + 1);
        const currentYearStart = startOfYear(calculationDate);
        const monthsWorkedThisYear = Math.max(0, differenceInMonths(calculationDate, joinDate.getTime() > currentYearStart.getTime() ? joinDate : currentYearStart));
        const accruedThisYear = monthsWorkedThisYear * accrualPerMonth;
        const takenThisYear = approvedLeaves.reduce((total, request) => {
          const startDate = new Date(request.startDate);
          const endDate = new Date(request.endDate);
          if (startDate >= currentYearStart && startDate <= calculationDate) {
            const timeDifference = endDate.getTime() - startDate.getTime();
            const daysDifference = Math.ceil(timeDifference / (1e3 * 3600 * 24)) + 1;
            return total + daysDifference;
          }
          return total;
        }, 0);
        return {
          asOfDate: calculationDate,
          totalAccrued,
          totalTaken,
          pendingRequests,
          remainingBalance,
          nextAccrualDate,
          accruedThisYear,
          takenThisYear
        };
      }
      // Certification methods
      async getCertification(id) {
        return this.data.certifications.find((c) => c.id === id);
      }
      async getCertifications() {
        return this.data.certifications;
      }
      async getCertificationsByUser(userId) {
        return this.data.certifications.filter((c) => c.userId === userId);
      }
      async createCertification(insertCertification) {
        const id = this.data.currentCertificationId++;
        const certification = {
          ...insertCertification,
          id,
          createdAt: /* @__PURE__ */ new Date(),
          status: insertCertification.status ?? "Active",
          credentialId: insertCertification.credentialId ?? null,
          issueDate: new Date(insertCertification.issueDate),
          expiryDate: insertCertification.expiryDate ? new Date(insertCertification.expiryDate) : null
        };
        this.data.certifications.push(certification);
        await this.saveData();
        return certification;
      }
      async updateCertification(id, certificationData) {
        const index = this.data.certifications.findIndex((c) => c.id === id);
        if (index === -1) return void 0;
        const updated = {
          ...this.data.certifications[index],
          ...certificationData,
          issueDate: certificationData.issueDate ? new Date(certificationData.issueDate) : this.data.certifications[index].issueDate,
          expiryDate: certificationData.expiryDate !== void 0 ? certificationData.expiryDate ? new Date(certificationData.expiryDate) : null : this.data.certifications[index].expiryDate
        };
        this.data.certifications[index] = updated;
        await this.saveData();
        return updated;
      }
      async deleteCertification(id) {
        const index = this.data.certifications.findIndex((c) => c.id === id);
        if (index === -1) return false;
        this.data.certifications.splice(index, 1);
        await this.saveData();
        return true;
      }
      // Goals methods
      async getGoals() {
        return this.data.goals || [];
      }
      async getGoalsByUser(userId) {
        return (this.data.goals || []).filter((g) => g.userId === userId);
      }
      async getGoal(id) {
        return (this.data.goals || []).find((g) => g.id === id);
      }
      async createGoal(goal) {
        if (!this.data.goals) this.data.goals = [];
        if (!this.data.currentGoalId) this.data.currentGoalId = 1;
        const id = this.data.currentGoalId++;
        const newGoal = {
          id,
          title: goal.title,
          kpi: goal.kpi,
          owner: goal.owner,
          progress: goal.progress ?? 0,
          dueDate: goal.dueDate instanceof Date ? goal.dueDate : new Date(goal.dueDate),
          status: goal.status ?? "On Track",
          description: goal.description ?? null,
          priority: goal.priority ?? "medium",
          userId: goal.userId,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.data.goals.push(newGoal);
        await this.saveData();
        return newGoal;
      }
      async updateGoal(id, goalData) {
        if (!this.data.goals) return void 0;
        const index = this.data.goals.findIndex((g) => g.id === id);
        if (index === -1) return void 0;
        const updated = { ...this.data.goals[index], ...goalData };
        this.data.goals[index] = updated;
        await this.saveData();
        return updated;
      }
      async deleteGoal(id) {
        if (!this.data.goals) return false;
        const index = this.data.goals.findIndex((g) => g.id === id);
        if (index === -1) return false;
        this.data.goals.splice(index, 1);
        await this.saveData();
        return true;
      }
      // System settings methods
      async updateSystemSettings(settings) {
        this.data.systemSettings = { ...this.data.systemSettings, ...settings };
        await this.saveData();
        return this.data.systemSettings;
      }
    };
  }
});

// server/storage.ts
import session2 from "express-session";
import createMemoryStore2 from "memorystore";
import { differenceInMonths as differenceInMonths2, startOfYear as startOfYear2, endOfYear as endOfYear2, addMonths as addMonths2 } from "date-fns";
var MemoryStore2, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_file_storage();
    MemoryStore2 = createMemoryStore2(session2);
    storage = new FileStorage();
    storage.initialize().catch(console.error);
  }
});

// server/auth.ts
var auth_exports = {};
__export(auth_exports, {
  comparePasswords: () => comparePasswords,
  hashPassword: () => hashPassword,
  setupAuth: () => setupAuth
});
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session3 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import fs2 from "fs/promises";
import path2 from "path";
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "hr-connect-secret-key",
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      secure: "auto",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session3(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log(`Login attempt for user: ${username}`);
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log("User not found");
        return done(null, false);
      }
      console.log("User found, checking password");
      try {
        let isPasswordValid = false;
        try {
          isPasswordValid = await comparePasswords(password, user.password);
          console.log(`Password validation result: ${isPasswordValid}`);
        } catch (error) {
          console.error("Error during password comparison:", error);
          return done(null, false);
        }
        if (isPasswordValid) {
          console.log("Login successful with stored password");
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        console.error("Error during authentication:", error);
        return done(null, false);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const allUsers = await storage.getUsers();
      const SETTINGS_FILE_PATH = path2.join(process.cwd(), "data", "system-settings.json");
      let systemSettings = {};
      try {
        const settingsData = await fs2.readFile(SETTINGS_FILE_PATH, "utf-8");
        systemSettings = JSON.parse(settingsData);
      } catch (error) {
        systemSettings = {
          systemLimits: {
            maxEmployees: 10,
            contactEmail: "support@hrconnect.com",
            contactPhone: "+1-234-567-8900",
            upgradeLink: "https://hrconnect.com/upgrade"
          }
        };
      }
      const maxEmployees = systemSettings.systemLimits?.maxEmployees || 10;
      const currentEmployeeCount = allUsers.length;
      if (currentEmployeeCount >= maxEmployees) {
        return res.status(429).json({
          message: "Employee limit reached",
          currentCount: currentEmployeeCount,
          maxEmployees,
          contactInfo: {
            email: systemSettings.systemLimits?.contactEmail,
            phone: systemSettings.systemLimits?.contactPhone,
            upgradeLink: systemSettings.systemLimits?.upgradeLink
          }
        });
      }
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password)
      });
      const { password, ...userWithoutPassword } = user;
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, async (err2) => {
        if (err2) return next(err2);
        if (user.role !== "developer") {
          try {
            await storage.createNotification({
              userId: user.id,
              type: "login",
              title: "Successful Login",
              message: `You have successfully logged in at ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
              isRead: false
            });
            if (user.role === "employee" || user.role === "manager") {
              const adminUsers = await storage.getAdminUsers();
              for (const admin of adminUsers) {
                await storage.createNotification({
                  userId: admin.id,
                  type: "login",
                  title: "Employee Login",
                  message: `${user.firstName} ${user.lastName} (${user.role}) logged in at ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
                  isRead: false,
                  relatedUserId: user.id
                });
              }
            }
          } catch (notificationError) {
            console.error("Failed to create login notification:", notificationError);
          }
        }
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    const user = req.user;
    req.logout(async (err) => {
      if (err) return next(err);
      if (user && user.role !== "developer") {
        try {
          await storage.createNotification({
            userId: user.id,
            type: "logout",
            title: "Logged Out",
            message: `You have successfully logged out at ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
            isRead: false
          });
          if (user.role === "employee" || user.role === "manager") {
            const adminUsers = await storage.getAdminUsers();
            for (const admin of adminUsers) {
              await storage.createNotification({
                userId: admin.id,
                type: "logout",
                title: "Employee Logout",
                message: `${user.firstName} ${user.lastName} (${user.role}) logged out at ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
                isRead: false,
                relatedUserId: user.id
              });
            }
          }
        } catch (notificationError) {
          console.error("Failed to create logout notification:", notificationError);
        }
      }
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}
var scryptAsync;
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_storage();
    scryptAsync = promisify(scrypt);
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
init_storage();
init_auth();
import { createServer } from "http";

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var roleEnum = pgEnum("role", ["admin", "hr", "manager", "employee", "developer"]);
var units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull(),
  description: text("description")
});
var insertUnitSchema = createInsertSchema(units).pick({
  name: true,
  code: true,
  description: true
});
var departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull(),
  manager: text("manager"),
  location: text("location"),
  description: text("description"),
  unitId: integer("unit_id").references(() => units.id)
});
var insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  code: true,
  manager: true,
  location: true,
  description: true,
  unitId: true
});
var genderEnum = pgEnum("gender", ["male", "female", "other", "prefer_not_to_say"]);
var accountTypeEnum = pgEnum("account_type", ["savings", "current", "salary"]);
var employeeStatusEnum = pgEnum("employee_status", ["invited", "active", "inactive"]);
var maritalStatusEnum = pgEnum("marital_status", ["single", "married", "divorced", "widowed", "prefer_not_to_say"]);
var attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "halfday", "late"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").unique(),
  // Unique employee identifier
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: genderEnum("gender"),
  maritalStatus: maritalStatusEnum("marital_status"),
  photoUrl: text("photo_url"),
  role: roleEnum("role").notNull().default("employee"),
  departmentId: integer("department_id").references(() => departments.id),
  position: text("position"),
  joinDate: timestamp("join_date").defaultNow(),
  workLocation: text("work_location"),
  reportingTo: integer("reporting_to"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  uanNumber: text("uan_number"),
  esicNumber: text("esic_number"),
  aadhaarCard: text("aadhaar_card"),
  panCard: text("pan_card"),
  employmentType: text("employment_type").default("permanent"),
  // permanent, contract, consultant
  pfApplicable: boolean("pf_applicable").default(true),
  esicApplicable: boolean("esic_applicable").default(true),
  ptApplicable: boolean("pt_applicable").default(true),
  incomeTaxApplicable: boolean("income_tax_applicable").default(false),
  mlwfApplicable: boolean("mlwf_applicable").default(false),
  overtimeApplicable: boolean("overtime_applicable").default(false),
  bonusApplicable: boolean("bonus_applicable").default(false),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankIFSCCode: text("bank_ifsc_code"),
  bankAccountType: accountTypeEnum("bank_account_type"),
  salary: integer("salary"),
  isActive: boolean("is_active").default(true),
  status: employeeStatusEnum("status").notNull().default("active"),
  // Track invitation workflow
  customPermissions: text("custom_permissions").array(),
  documents: text("documents").array()
  // Array of base64 encoded document data with metadata
});
var insertUserSchema = createInsertSchema(users).pick({
  employeeId: true,
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  maritalStatus: true,
  photoUrl: true,
  role: true,
  departmentId: true,
  position: true,
  joinDate: true,
  workLocation: true,
  reportingTo: true,
  phoneNumber: true,
  address: true,
  bankAccountNumber: true,
  bankName: true,
  bankIFSCCode: true,
  bankAccountType: true,
  aadhaarCard: true,
  panCard: true,
  salary: true,
  uanNumber: true,
  esicNumber: true,
  employmentType: true,
  pfApplicable: true,
  esicApplicable: true,
  ptApplicable: true,
  incomeTaxApplicable: true,
  mlwfApplicable: true,
  overtimeApplicable: true,
  bonusApplicable: true,
  status: true,
  customPermissions: true,
  documents: true
});
var employeeInvitations = pgTable("employee_invitations", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  // Secure UUID token
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  invitedById: integer("invited_by_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  // Token expiration (7 days)
  usedAt: timestamp("used_at"),
  // When invitation was accepted
  createdAt: timestamp("created_at").defaultNow()
});
var insertEmployeeInvitationSchema = createInsertSchema(employeeInvitations).pick({
  token: true,
  email: true,
  firstName: true,
  lastName: true,
  invitedById: true,
  expiresAt: true
});
var attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  checkInTime: timestamp("check_in_time").defaultNow(),
  checkOutTime: timestamp("check_out_time"),
  date: timestamp("date").defaultNow(),
  status: text("status").notNull().default("present"),
  // present, absent, halfday, late
  notes: text("notes")
});
var insertAttendanceSchema = z.object({
  userId: z.number(),
  checkInTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  checkOutTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  date: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  status: z.enum(["present", "absent", "halfday", "late"]).optional(),
  notes: z.string().optional()
});
var updateAttendanceSchema = z.object({
  checkInTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  checkOutTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  date: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  status: z.enum(["present", "absent", "halfday", "late"]).optional(),
  notes: z.string().optional()
});
var leaveTypeEnum = pgEnum("leave_type", ["annual", "sick", "personal", "halfday", "unpaid", "other", "workfromhome"]);
var leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "rejected"]);
var leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: leaveTypeEnum("type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").default("pending"),
  approvedById: integer("approved_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var insertLeaveRequestSchema = createInsertSchema(leaveRequests).pick({
  userId: true,
  type: true,
  startDate: true,
  endDate: true,
  reason: true,
  status: true,
  approvedById: true
});
var holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  description: text("description")
});
var insertHolidaySchema = createInsertSchema(holidays).pick({
  name: true,
  date: true,
  description: true
});
var notificationTypeEnum = pgEnum("notification_type", ["login", "logout", "leave_request", "leave_approved", "leave_rejected"]);
var notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  relatedUserId: integer("related_user_id").references(() => users.id),
  relatedLeaveId: integer("related_leave_id").references(() => leaveRequests.id)
});
var insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  isRead: true,
  relatedUserId: true,
  relatedLeaveId: true
});
var paymentStatusEnum = pgEnum("payment_status", ["pending", "paid"]);
var paymentModeEnum = pgEnum("payment_mode", ["bank_transfer", "cheque", "cash", "upi"]);
var paymentRecords = pgTable("payment_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => users.id),
  month: text("month").notNull(),
  // Format: "MMM yyyy" e.g., "Jan 2025"
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  amount: integer("amount").notNull(),
  paymentDate: timestamp("payment_date"),
  paymentMode: paymentModeEnum("payment_mode"),
  referenceNo: text("reference_no"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertPaymentRecordSchema = createInsertSchema(paymentRecords).pick({
  employeeId: true,
  month: true,
  paymentStatus: true,
  amount: true,
  paymentDate: true,
  paymentMode: true,
  referenceNo: true
});
var systemSettingsSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required").optional(),
  organizationEmail: z.string().email("Valid email is required").optional(),
  timeZone: z.string().optional(),
  dateFormat: z.string().optional(),
  workingHours: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    attendance: z.boolean(),
    leave: z.boolean()
  }).optional(),
  systemLimits: z.object({
    maxEmployees: z.coerce.number().min(1).max(1e3),
    contactEmail: z.string().email(),
    contactPhone: z.string(),
    upgradeLink: z.string().url()
  }).optional(),
  salaryComponents: z.object({
    basicSalaryPercentage: z.coerce.number().min(0, "Basic salary percentage must be at least 0").max(100, "Basic salary percentage cannot exceed 100"),
    hraPercentage: z.coerce.number().min(0, "HRA percentage must be at least 0").max(100, "HRA percentage cannot exceed 100"),
    epfPercentage: z.coerce.number().min(0, "EPF percentage must be at least 0").max(100, "EPF percentage cannot exceed 100"),
    esicPercentage: z.coerce.number().min(0, "ESIC percentage must be at least 0").max(100, "ESIC percentage cannot exceed 100"),
    professionalTax: z.coerce.number().min(0, "Professional tax must be at least 0")
  }).optional()
});
var bankMasters = pgTable("bank_masters", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  branch: text("branch").notNull(),
  branchCode: text("branch_code"),
  address: text("address"),
  accountNo: text("account_no"),
  ifscCode: text("ifsc_code"),
  micrCode: text("micr_code")
});
var insertBankMasterSchema = createInsertSchema(bankMasters).pick({
  bankName: true,
  branch: true,
  branchCode: true,
  address: true,
  accountNo: true,
  ifscCode: true,
  micrCode: true
});
var documentApprovals = pgTable("document_approvals", {
  id: serial("id").primaryKey(),
  documentType: text("document_type").notNull(),
  approverId: integer("approver_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  remarks: text("remarks")
});
var insertDocumentApprovalSchema = createInsertSchema(documentApprovals).pick({
  documentType: true,
  approverId: true,
  status: true,
  remarks: true
});
var employeeDeductions = pgTable("employee_deductions", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => users.id),
  deductionType: text("deduction_type").notNull(),
  amount: integer("amount").notNull(),
  month: text("month").notNull()
});
var insertEmployeeDeductionSchema = createInsertSchema(employeeDeductions).pick({
  employeeId: true,
  deductionType: true,
  amount: true,
  month: true
});
var categoryMasters = pgTable("category_masters", {
  id: serial("id").primaryKey(),
  categoryDescription: text("category_description").notNull(),
  class: text("class").notNull()
  // SemiSkilled, Management, Worker, etc.
});
var insertCategoryMasterSchema = createInsertSchema(categoryMasters).pick({
  categoryDescription: true,
  class: true
});
var companyMasters = pgTable("company_masters", {
  id: serial("id").primaryKey(),
  companyCode: text("company_code").notNull(),
  companyName: text("company_name").notNull(),
  address: text("address"),
  state: text("state"),
  pinCode: text("pin_code"),
  regdNo: text("regd_no"),
  pfcCode: text("pfc_code"),
  esicCode: text("esic_code"),
  panNo: text("pan_no"),
  tanNo: text("tan_no"),
  gstNo: text("gst_no"),
  email: text("email"),
  natureOfBusiness: text("nature_of_business"),
  esiEmployeeContribution: text("esi_employee_contribution"),
  esiEmployerContribution: text("esi_employer_contribution"),
  pfEmployerContribution: text("pf_employer_contribution")
});
var insertCompanyMasterSchema = createInsertSchema(companyMasters).pick({
  companyCode: true,
  companyName: true,
  address: true,
  state: true,
  pinCode: true,
  regdNo: true,
  pfcCode: true,
  esicCode: true,
  panNo: true,
  tanNo: true,
  gstNo: true,
  email: true,
  natureOfBusiness: true,
  esiEmployeeContribution: true,
  esiEmployerContribution: true,
  pfEmployerContribution: true
});
var costCenters = pgTable("cost_centers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull()
});
var insertCostCenterSchema = createInsertSchema(costCenters).pick({
  name: true
});
var leaveBalanceSchema = z.object({
  asOfDate: z.date(),
  totalAccrued: z.number(),
  totalTaken: z.number(),
  pendingRequests: z.number(),
  remainingBalance: z.number(),
  nextAccrualDate: z.date(),
  accruedThisYear: z.number(),
  takenThisYear: z.number()
});
var leaveBalanceResponseSchema = z.object({
  success: z.boolean(),
  data: leaveBalanceSchema.optional(),
  error: z.string().optional()
});
var certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  certificationName: text("certification_name").notNull(),
  issuer: text("issuer").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  status: text("status").notNull().default("Active"),
  // Active, Expiring Soon, Expired
  credentialId: text("credential_id"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertCertificationSchema = createInsertSchema(certifications).pick({
  userId: true,
  certificationName: true,
  issuer: true,
  issueDate: true,
  expiryDate: true,
  status: true,
  credentialId: true
});
var goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  kpi: text("kpi").notNull(),
  owner: text("owner").notNull(),
  progress: integer("progress").notNull().default(0),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("On Track"),
  // 'On Track', 'Completed', 'Behind', 'At Risk'
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  // 'high', 'medium', 'low'
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true });

// server/routes.ts
import { z as z2 } from "zod";
import crypto from "crypto";
import { promisify as promisify2 } from "util";
import fs3 from "fs/promises";
import path3 from "path";

// server/sendgrid.ts
import { MailService } from "@sendgrid/mail";
var mailService = null;
if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("Warning: SENDGRID_API_KEY not configured. Email functionality will be disabled.");
}
async function sendEmail(params) {
  if (!mailService) {
    console.warn("Email sending skipped: SendGrid not configured");
    return false;
  }
  console.log("=== SENDGRID EMAIL DEBUG ===");
  console.log("Attempting to send email with params:");
  console.log("- To:", params.to);
  console.log("- From:", params.from);
  console.log("- Subject:", params.subject);
  console.log("- API Key configured:", !!process.env.SENDGRID_API_KEY);
  console.log("- FROM_EMAIL configured:", !!process.env.FROM_EMAIL);
  try {
    const emailData = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || "",
      html: params.html || ""
    };
    console.log("Sending email with SendGrid...");
    const result = await mailService.send(emailData);
    console.log("SendGrid response:", result);
    console.log("EMAIL SENT SUCCESSFULLY!");
    console.log("=== END SENDGRID EMAIL DEBUG ===");
    return true;
  } catch (error) {
    console.error("=== SENDGRID EMAIL ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error response:", error.response?.body);
    if (error.response?.body?.errors) {
      console.error("Detailed errors:", JSON.stringify(error.response.body.errors, null, 2));
    }
    console.error("Full error object:", error);
    console.error("=== END SENDGRID EMAIL ERROR ===");
    return false;
  }
}
function generateInvitationEmail(firstName, lastName, invitationToken, companyName = "HR Connect") {
  const baseUrl = process.env.REPLIT_DOMAINS || "http://localhost:5000";
  const invitationUrl = `${baseUrl}/invitation/${invitationToken}`;
  return {
    to: "",
    // Will be set by the caller
    from: process.env.FROM_EMAIL || "noreply@test.com",
    subject: `Welcome to ${companyName} - Complete Your Account Setup`,
    text: `Hi ${firstName},

Welcome to ${companyName}! You've been invited to join our team.

Please click the link below to complete your account setup:
${invitationUrl}

This invitation will expire in 7 days.

If you have any questions, please contact your HR department.

Best regards,
${companyName} HR Team`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${companyName}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo and Company Branding -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%); color: white; padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; z-index: 1;"></div>
            <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%; z-index: 1;"></div>
            
            <div style="position: relative; z-index: 2;">
              <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <div style="font-size: 32px; font-weight: bold;">\u{1F3E2}</div>
              </div>
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to ${companyName}</h1>
              <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95; font-weight: 300;">You're invited to join our professional team</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 50px 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 28px; font-weight: 600;">Hi ${firstName}! \u{1F44B}</h2>
              <p style="color: #64748b; font-size: 18px; line-height: 1.6; margin: 0;">
                Congratulations! You've been selected to join <strong style="color: #2563eb;">${companyName}</strong>.<br>
                We're thrilled to welcome you to our team.
              </p>
            </div>
            
            <!-- Professional CTA Section -->
            <div style="text-align: center; margin: 50px 0;">
              <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 30px; border-radius: 15px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
                <h3 style="color: #334155; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Ready to Get Started?</h3>
                <p style="color: #64748b; margin: 0 0 25px 0; font-size: 16px;">Click the button below to create your account and join the team</p>
                
                <a href="${invitationUrl}" style="
                  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
                  color: white;
                  text-decoration: none;
                  padding: 18px 40px;
                  border-radius: 8px;
                  font-size: 18px;
                  font-weight: 600;
                  display: inline-block;
                  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
                  transition: all 0.3s ease;
                  letter-spacing: 0.5px;
                  border: none;
                ">
                  \u{1F680} Complete Account Setup
                </a>
              </div>
            </div>
            
            <!-- Process Steps -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 15px; margin: 40px 0; border: 1px solid #fbbf24;">
              <h3 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; text-align: center;">\u{1F4CB} Quick Setup Process</h3>
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                  <div style="background: #f59e0b; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">1</div>
                  <span style="color: #92400e; font-weight: 500;">Click the "Complete Account Setup" button</span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                  <div style="background: #f59e0b; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">2</div>
                  <span style="color: #92400e; font-weight: 500;">Create your secure password</span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                  <div style="background: #f59e0b; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">3</div>
                  <span style="color: #92400e; font-weight: 500;">Complete your profile information</span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                  <div style="background: #10b981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">\u2713</div>
                  <span style="color: #92400e; font-weight: 500;">Start accessing your employee portal</span>
                </div>
              </div>
            </div>
            
            <!-- Important Information -->
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 25px; margin: 30px 0;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <div style="font-size: 20px;">\u26A0\uFE0F</div>
                <h4 style="color: #dc2626; margin: 0; font-size: 18px; font-weight: 600;">Important Information</h4>
              </div>
              <ul style="color: #991b1b; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li style="margin-bottom: 8px;">This invitation expires in <strong>7 days</strong></li>
                <li style="margin-bottom: 8px;">Complete your setup as soon as possible to avoid delays</li>
                <li>Contact HR if you encounter any issues during setup</li>
              </ul>
            </div>
            
            <!-- Support Section -->
            <div style="text-align: center; margin: 40px 0;">
              <div style="background: #f8fafc; padding: 25px; border-radius: 10px; border: 1px solid #e2e8f0;">
                <h4 style="color: #334155; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Need Help? \u{1F91D}</h4>
                <p style="color: #64748b; margin: 0; font-size: 16px; line-height: 1.6;">
                  Our HR team is here to assist you with any questions or technical support you may need during the setup process.
                </p>
              </div>
            </div>
            
            <!-- Professional Closing -->
            <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
                We look forward to working with you and welcome you to the ${companyName} family!
              </p>
              <p style="color: #334155; font-size: 16px; font-weight: 600; margin: 0;">
                Best regards,<br>
                <span style="color: #2563eb; font-weight: 700;">${companyName} HR Team</span>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 15px 0; line-height: 1.5;">
              If the button above doesn't work, you can copy and paste this link into your browser:
            </p>
            <a href="${invitationUrl}" style="color: #2563eb; font-size: 14px; word-break: break-all; text-decoration: underline;">${invitationUrl}</a>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${companyName}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}
function generateAdminInvitationNotificationEmail(employeeDetails, inviterDetails, invitationDetails, emailSent, companyName = "HR Connect") {
  const sentAtFormatted = invitationDetails.sentAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const expiresAtFormatted = invitationDetails.expiresAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return {
    to: "",
    // Will be set by the caller
    from: process.env.FROM_EMAIL || "noreply@test.com",
    subject: `New Employee Invitation Sent - ${employeeDetails.firstName} ${employeeDetails.lastName}`,
    text: `Hi Admin,

A new employee invitation has been sent by ${inviterDetails.firstName} ${inviterDetails.lastName}.

Employee Details:
- Name: ${employeeDetails.firstName} ${employeeDetails.lastName}
- Email: ${employeeDetails.email}

Invitation Details:
- Sent by: ${inviterDetails.firstName} ${inviterDetails.lastName} (${inviterDetails.role})
- Sent on: ${sentAtFormatted}
- Expires on: ${expiresAtFormatted}
- Status: ${emailSent ? "Successfully sent" : "Email delivery failed - please check SendGrid configuration"}

Invitation Link: ${invitationDetails.invitationUrl}

This is an automated notification from ${companyName}.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Employee Invitation Notification - ${companyName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          .email-container { max-width: 680px; margin: 0 auto; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .success-badge { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
          .error-badge { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
          .info-row { display: flex; align-items: flex-start; margin-bottom: 12px; }
          .info-label { min-width: 120px; font-weight: 500; color: #475569; font-size: 14px; }
          .info-value { color: #1e293b; font-size: 15px; flex: 1; }
          @media (max-width: 640px) {
            .info-row { flex-direction: column; }
            .info-label { margin-bottom: 4px; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); min-height: 100vh;">
        <div class="email-container" style="background: #ffffff; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border-radius: 12px; overflow: hidden; margin: 40px auto;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #1e3a8a 100%); color: white; padding: 50px 40px; text-align: center; position: relative; overflow: hidden;">
            <!-- Decorative elements -->
            <div style="position: absolute; top: -60px; right: -60px; width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%; z-index: 1;"></div>
            <div style="position: absolute; bottom: -40px; left: -40px; width: 80px; height: 80px; background: rgba(255,255,255,0.06); border-radius: 50%; z-index: 1;"></div>
            <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%; z-index: 1;"></div>
            
            <div style="position: relative; z-index: 2;">
              <!-- Company Logo/Icon -->
              <div style="background: rgba(255,255,255,0.15); width: 100px; height: 100px; border-radius: 20px; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.1);">
                <div style="font-size: 40px;">\u{1F3E2}</div>
              </div>
              
              <div style="background: rgba(255,255,255,0.1); padding: 8px 20px; border-radius: 25px; display: inline-block; margin-bottom: 20px;">
                <span style="font-size: 14px; font-weight: 500; opacity: 0.9;">ADMIN NOTIFICATION</span>
              </div>
              
              <h1 style="margin: 0 0 10px 0; font-size: 36px; font-weight: 700; letter-spacing: -1px; line-height: 1.2;">New Employee Invitation</h1>
              <p style="margin: 0; font-size: 18px; opacity: 0.9; font-weight: 400;">Team member invitation has been processed</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 50px 40px;">
            
            <!-- Summary Alert -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 30px; border-radius: 16px; border-left: 5px solid #2563eb; margin-bottom: 35px; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: rgba(37, 99, 235, 0.1); border-radius: 50%;"></div>
              <div style="position: relative;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="background: #2563eb; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px;">\u{1F4E7}</div>
                  <h2 style="color: #1e40af; margin: 0; font-size: 22px; font-weight: 700;">Invitation Summary</h2>
                </div>
                <p style="color: #1e40af; margin: 0; font-size: 16px; line-height: 1.7;">
                  <strong>${inviterDetails.firstName} ${inviterDetails.lastName}</strong> (${inviterDetails.role}) has sent an invitation to <strong>${employeeDetails.firstName} ${employeeDetails.lastName}</strong> to join the team.
                </p>
              </div>
            </div>
            
            <!-- Status Badge -->
            <div style="text-align: center; margin-bottom: 35px;">
              <span class="${emailSent ? "success-badge" : "error-badge"} status-badge">
                ${emailSent ? "\u2713 INVITATION SENT" : "\u26A0 DELIVERY FAILED"}
              </span>
            </div>
            
            <!-- Employee Details Card -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 18px;">\u{1F464}</div>
                <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 600;">New Employee Details</h3>
              </div>
              
              <div class="info-row">
                <div class="info-label">Full Name</div>
                <div class="info-value"><strong>${employeeDetails.firstName} ${employeeDetails.lastName}</strong></div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Email Address</div>
                <div class="info-value">
                  <a href="mailto:${employeeDetails.email}" style="color: #2563eb; text-decoration: none; font-weight: 500;">
                    ${employeeDetails.email}
                  </a>
                </div>
              </div>
            </div>
            
            <!-- Invitation Timeline Card -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 18px;">\u{1F4CB}</div>
                <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 600;">Invitation Timeline</h3>
              </div>
              
              <div class="info-row">
                <div class="info-label">Invited By</div>
                <div class="info-value">
                  <strong>${inviterDetails.firstName} ${inviterDetails.lastName}</strong>
                  <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px; font-weight: 500;">${inviterDetails.role}</span>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Sent On</div>
                <div class="info-value">${sentAtFormatted}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Expires On</div>
                <div class="info-value" style="color: #dc2626; font-weight: 500;">${expiresAtFormatted}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Delivery Status</div>
                <div class="info-value">
                  <span style="color: ${emailSent ? "#059669" : "#dc2626"}; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">${emailSent ? "\u2705" : "\u274C"}</span>
                    ${emailSent ? "Successfully delivered" : "Delivery failed"}
                  </span>
                </div>
              </div>
            </div>
            
            ${!emailSent ? `
            <!-- Error Alert -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fca5a5; padding: 25px; border-radius: 16px; margin-bottom: 30px; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -15px; right: -15px; width: 50px; height: 50px; background: rgba(239, 68, 68, 0.1); border-radius: 50%;"></div>
              <div style="position: relative;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="background: #dc2626; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px;">\u26A0\uFE0F</div>
                  <h4 style="color: #dc2626; margin: 0; font-size: 18px; font-weight: 700;">Email Delivery Issue</h4>
                </div>
                <p style="color: #dc2626; margin: 0; font-size: 15px; line-height: 1.6;">
                  The invitation email to <strong>${employeeDetails.email}</strong> could not be delivered. Please verify the SendGrid configuration or contact the employee manually with the invitation link below.
                </p>
              </div>
            </div>
            ` : ""}
            
            <!-- Invitation Link Card -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; padding: 25px; border-radius: 16px; text-align: center; margin-bottom: 40px; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: rgba(34, 197, 94, 0.1); border-radius: 50%;"></div>
              <div style="position: relative;">
                <div style="background: #22c55e; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 18px;">\u{1F517}</div>
                <h4 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">Invitation Access Link</h4>
                <p style="color: #166534; margin: 0 0 20px 0; font-size: 14px;">Direct link to the employee invitation page</p>
                <div style="background: white; padding: 15px 20px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #bbf7d0;">
                  <a href="${invitationDetails.invitationUrl}" 
                     style="color: #059669; font-size: 13px; word-break: break-all; text-decoration: none; font-family: 'Monaco', 'Menlo', 'Consolas', monospace;">
                    ${invitationDetails.invitationUrl}
                  </a>
                </div>
                <p style="color: #065f46; margin: 0; font-size: 12px; opacity: 0.8;">
                  This link expires on ${expiresAtFormatted}
                </p>
              </div>
            </div>
            
            <!-- System Note -->
            <div style="background: #f8fafc; border-left: 4px solid #64748b; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0; font-style: italic;">
                <strong>System Notification:</strong> This is an automated notification from the ${companyName} HR Management System. You are receiving this email because you have administrator privileges and have been configured to receive employee invitation notifications.
              </p>
            </div>
          </div>
          
          <!-- Professional Footer -->
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 40px; text-align: center; border-top: 1px solid #e2e8f0;">
            <div style="margin-bottom: 20px;">
              <div style="background: #475569; color: white; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 20px;">\u{1F3E2}</div>
            </div>
            <p style="color: #64748b; font-size: 16px; margin: 0 0 10px 0; font-weight: 500;">
              ${companyName} HR Management System
            </p>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 20px 0; line-height: 1.5;">
              Streamlining human resources management with modern technology
            </p>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${companyName}. All rights reserved. | Automated HR System Notification
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}
function generateEmployeeRegistrationCompletionEmail(employeeDetails, invitationDetails, companyName = "HR Connect") {
  const completedAtFormatted = invitationDetails.completedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const joinDateFormatted = employeeDetails.joinDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return {
    to: "",
    // Will be set by the caller
    from: process.env.FROM_EMAIL || "noreply@test.com",
    subject: `\u2705 Employee Registration Complete - ${employeeDetails.firstName} ${employeeDetails.lastName}`,
    text: `Hi Admin,

${employeeDetails.firstName} ${employeeDetails.lastName} has successfully completed their account registration.

Employee Details:
- Name: ${employeeDetails.firstName} ${employeeDetails.lastName}
- Email: ${employeeDetails.email}
- Join Date: ${joinDateFormatted}

Registration Details:
- Completed on: ${completedAtFormatted}
- Originally invited by: ${invitationDetails.originalInviter} (${invitationDetails.inviterRole})

The employee can now access the ${companyName} system and begin their onboarding process.

This is an automated notification from ${companyName}.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Employee Registration Complete - ${companyName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          .email-container { max-width: 680px; margin: 0 auto; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .success-badge { display: inline-block; padding: 8px 20px; border-radius: 25px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
          .info-row { display: flex; align-items: flex-start; margin-bottom: 12px; }
          .info-label { min-width: 120px; font-weight: 500; color: #475569; font-size: 14px; }
          .info-value { color: #1e293b; font-size: 15px; flex: 1; }
          @media (max-width: 640px) {
            .info-row { flex-direction: column; }
            .info-label { margin-bottom: 4px; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); min-height: 100vh;">
        <div class="email-container" style="background: #ffffff; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border-radius: 12px; overflow: hidden; margin: 40px auto;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%); color: white; padding: 50px 40px; text-align: center; position: relative; overflow: hidden;">
            <!-- Decorative elements -->
            <div style="position: absolute; top: -60px; right: -60px; width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%; z-index: 1;"></div>
            <div style="position: absolute; bottom: -40px; left: -40px; width: 80px; height: 80px; background: rgba(255,255,255,0.06); border-radius: 50%; z-index: 1;"></div>
            <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%; z-index: 1;"></div>
            
            <div style="position: relative; z-index: 2;">
              <!-- Success Icon -->
              <div style="background: rgba(255,255,255,0.15); width: 100px; height: 100px; border-radius: 20px; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.1);">
                <div style="font-size: 40px;">\u2705</div>
              </div>
              
              <div style="background: rgba(255,255,255,0.1); padding: 8px 20px; border-radius: 25px; display: inline-block; margin-bottom: 20px;">
                <span style="font-size: 14px; font-weight: 500; opacity: 0.9;">REGISTRATION COMPLETE</span>
              </div>
              
              <h1 style="margin: 0 0 10px 0; font-size: 36px; font-weight: 700; letter-spacing: -1px; line-height: 1.2;">New Team Member Ready!</h1>
              <p style="margin: 0; font-size: 18px; opacity: 0.9; font-weight: 400;">Employee has successfully completed account setup</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 50px 40px;">
            
            <!-- Success Alert -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 30px; border-radius: 16px; border-left: 5px solid #22c55e; margin-bottom: 35px; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: rgba(34, 197, 94, 0.1); border-radius: 50%;"></div>
              <div style="position: relative;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <div style="background: #22c55e; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px;">\u{1F389}</div>
                  <h2 style="color: #166534; margin: 0; font-size: 22px; font-weight: 700;">Registration Successful</h2>
                </div>
                <p style="color: #166534; margin: 0; font-size: 16px; line-height: 1.7;">
                  <strong>${employeeDetails.firstName} ${employeeDetails.lastName}</strong> has successfully completed their account registration and is now ready to start their journey with the team.
                </p>
              </div>
            </div>
            
            <!-- Status Badge -->
            <div style="text-align: center; margin-bottom: 35px;">
              <span class="success-badge">\u2713 ACCOUNT ACTIVATED</span>
            </div>
            
            <!-- Employee Information Card -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 18px;">\u{1F464}</div>
                <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 600;">New Team Member Details</h3>
              </div>
              
              <div class="info-row">
                <div class="info-label">Full Name</div>
                <div class="info-value"><strong>${employeeDetails.firstName} ${employeeDetails.lastName}</strong></div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Email Address</div>
                <div class="info-value">
                  <a href="mailto:${employeeDetails.email}" style="color: #2563eb; text-decoration: none; font-weight: 500;">
                    ${employeeDetails.email}
                  </a>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Role</div>
                <div class="info-value">
                  <span style="background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;">Employee</span>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Join Date</div>
                <div class="info-value" style="color: #059669; font-weight: 500;">${joinDateFormatted}</div>
              </div>
            </div>
            
            <!-- Registration Timeline Card -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 30px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 18px;">\u{1F4CB}</div>
                <h3 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 600;">Registration Timeline</h3>
              </div>
              
              <div class="info-row">
                <div class="info-label">Originally Invited By</div>
                <div class="info-value">
                  <strong>${invitationDetails.originalInviter}</strong>
                  <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px; font-weight: 500;">${invitationDetails.inviterRole}</span>
                </div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Completed On</div>
                <div class="info-value">${completedAtFormatted}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Account Status</div>
                <div class="info-value">
                  <span style="color: #059669; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">\u{1F7E2}</span>
                    Active and ready to use
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Next Steps Card -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; padding: 25px; border-radius: 16px; margin-bottom: 40px; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: rgba(59, 130, 246, 0.1); border-radius: 50%;"></div>
              <div style="position: relative;">
                <div style="background: #3b82f6; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 18px;">\u{1F4DD}</div>
                <h4 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">Next Steps</h4>
                <ul style="color: #1e40af; margin: 0; font-size: 15px; line-height: 1.8; padding-left: 20px;">
                  <li>Employee can now log in to the HR system using their credentials</li>
                  <li>Complete profile setup and upload any required documents</li>
                  <li>Begin onboarding process and role-specific training</li>
                  <li>Access assigned resources and team communication channels</li>
                </ul>
              </div>
            </div>
            
            <!-- System Note -->
            <div style="background: #f8fafc; border-left: 4px solid #64748b; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0; font-style: italic;">
                <strong>System Notification:</strong> This is an automated notification from the ${companyName} HR Management System. The employee account is now active and ready for use.
              </p>
            </div>
          </div>
          
          <!-- Professional Footer -->
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 40px; text-align: center; border-top: 1px solid #e2e8f0;">
            <div style="margin-bottom: 20px;">
              <div style="background: #059669; color: white; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 20px;">\u{1F3E2}</div>
            </div>
            <p style="color: #64748b; font-size: 16px; margin: 0 0 10px 0; font-weight: 500;">
              ${companyName} HR Management System
            </p>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 20px 0; line-height: 1.5;">
              Streamlining human resources management with modern technology
            </p>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${companyName}. All rights reserved. | Automated HR System Notification
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

// server/routes.ts
import multer from "multer";
import * as xlsx from "xlsx";
import { parse as parseCsv } from "csv-parse/sync";
function getUserPermissions(user) {
  const base = {
    admin: "all",
    developer: "all",
    hr: [
      "employees.view",
      "employees.create",
      "employees.edit",
      "departments.view",
      "departments.create",
      "departments.edit",
      "attendance.view",
      "attendance.edit",
      "leave.view",
      "leave.approve",
      "reports.view",
      "roles.view",
      "payroll.view",
      "payroll.process",
      "payroll.edit",
      "certifications.view",
      "certifications.edit"
    ],
    manager: [
      "employees.view",
      "departments.view",
      "attendance.view",
      "attendance.edit",
      "leave.view",
      "leave.approve",
      "reports.view",
      "certifications.view",
      "certifications.edit"
    ],
    employee: [
      "attendance.view",
      "attendance.mark",
      "leave.view",
      "leave.create",
      "payroll.view_own",
      "certifications.view_own"
    ]
  };
  const defaults = user?.role === "admin" || user?.role === "developer" ? "all" : base[user?.role] || [];
  const merged = defaults === "all" ? /* @__PURE__ */ new Set(["all"]) : /* @__PURE__ */ new Set([...defaults, ...user?.customPermissions || []]);
  return merged;
}
function hasPermission(req, permission) {
  const perms = getUserPermissions(req.user);
  return perms.has("all") || perms.has(permission);
}
function computeAttendanceStatus(checkInTime, checkOutTime) {
  if (!checkInTime) return "absent";
  if (!checkOutTime) return "present";
  const workingMilliseconds = checkOutTime.getTime() - checkInTime.getTime();
  const workingHours = workingMilliseconds / (1e3 * 60 * 60);
  if (workingHours >= 8) {
    return "present";
  } else if (workingHours >= 4) {
    return "halfday";
  } else {
    return "absent";
  }
}
var upload = multer({ storage: multer.memoryStorage() });
async function registerRoutes(app2) {
  app2.post("/api/payroll/calculate", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const { salary, overtimeHours = 0, daysWorked = 25, totalDaysInMonth = 30 } = req.body;
      const settings = await storage.getSystemSettings();
      const salaryComponents = settings?.salaryComponents || {
        basicSalaryPercentage: 50,
        hraPercentage: 50,
        epfPercentage: 12,
        esicPercentage: 0.75,
        professionalTax: 200
      };
      const gross = salary / totalDaysInMonth * daysWorked;
      const basic = gross * (salaryComponents.basicSalaryPercentage / 100);
      const hra = basic * (salaryComponents.hraPercentage / 100);
      const da = basic * 0.1;
      const conveyance = 0;
      const medical = 0;
      const transAll = basic * 0.16;
      const lta = basic * 0.04;
      const childAll = basic * 0.04;
      const medAll = basic * 0.1;
      const othAll = basic * 0.06;
      const otRate = (basic + da) / 26 / 8 * 2;
      const otAmount = overtimeHours * otRate;
      const earningsBeforeSpecial = basic + da + hra + transAll + lta + childAll + medAll + othAll + otAmount;
      const specialAllowance = Math.max(0, gross - earningsBeforeSpecial);
      const basicLimit = 15e3;
      const epfEmployee = Math.min(basic, basicLimit) * 0.12;
      const epfEmployer = Math.min(basic, basicLimit) * 0.13;
      const esicEmployee = gross <= 21e3 ? Math.round(gross * 75e-4) : 0;
      const esicEmployer = gross <= 21e3 ? Math.round(gross * 0.0325) : 0;
      const pt = 200;
      const currentMonth = (/* @__PURE__ */ new Date()).getMonth() + 1;
      const isMlwfMonth = currentMonth === 6 || currentMonth === 12;
      const lwf = isMlwfMonth ? 25 : 0;
      const totalDeductions = epfEmployee + esicEmployee + pt + lwf;
      const netSalary = gross - totalDeductions;
      res.json({
        earnings: {
          basic,
          da,
          hra,
          conveyance,
          medical,
          otAmount,
          specialAllowance,
          gross
        },
        deductions: {
          epf: epfEmployee,
          esic: esicEmployee,
          pt,
          lwf,
          totalDeductions
        },
        netSalary,
        period: {
          daysWorked,
          totalDaysInMonth
        }
      });
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/masters/units", async (req, res, next) => {
    try {
      const units2 = await storage.getUnits();
      res.json(units2);
    } catch (error) {
      console.error("Error in /api/masters/units:", error);
      next(error);
    }
  });
  app2.post("/api/masters/units", async (req, res, next) => {
    try {
      const validatedData = insertUnitSchema.parse(req.body);
      const unit = await storage.createUnit(validatedData);
      res.status(201).json(unit);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/masters/banks", async (req, res, next) => {
    try {
      const banks = await storage.getBankMasters();
      res.json(banks);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/masters/banks", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (!["admin", "hr"].includes(req.user.role)) return res.status(403).send("Forbidden");
      const validatedData = insertBankMasterSchema.parse(req.body);
      const bank = await storage.createBankMaster(validatedData);
      res.status(201).json(bank);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/masters/categories", async (req, res, next) => {
    try {
      const categories = await storage.getCategoryMasters();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/masters/categories", async (req, res, next) => {
    try {
      const validatedData = insertCategoryMasterSchema.parse(req.body);
      const category = await storage.createCategoryMaster(validatedData);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/masters/companies", async (req, res, next) => {
    try {
      const companies = await storage.getCompanyMasters();
      res.json(companies);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/masters/companies", async (req, res, next) => {
    try {
      const validatedData = insertCompanyMasterSchema.parse(req.body);
      const company = await storage.createCompanyMaster(validatedData);
      res.status(201).json(company);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/masters/cost-centers", async (req, res, next) => {
    try {
      const costCenters2 = await storage.getCostCenters();
      res.json(costCenters2);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/masters/cost-centers", async (req, res, next) => {
    try {
      const validatedData = insertCostCenterSchema.parse(req.body);
      const costCenter = await storage.createCostCenter(validatedData);
      res.status(201).json(costCenter);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/masters/document-approvals", async (req, res, next) => {
    try {
      const approvals = await storage.getDocumentApprovals();
      res.json(approvals);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/masters/document-approvals", async (req, res, next) => {
    try {
      const validatedData = insertDocumentApprovalSchema.parse(req.body);
      const approval = await storage.createDocumentApproval(validatedData);
      res.status(201).json(approval);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/masters/employee-deductions", async (req, res, next) => {
    try {
      const deductions = await storage.getEmployeeDeductions();
      res.json(deductions);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/masters/employee-deductions", async (req, res, next) => {
    try {
      const validatedData = insertEmployeeDeductionSchema.parse(req.body);
      const deduction = await storage.createEmployeeDeduction(validatedData);
      res.status(201).json(deduction);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/attendance/bulk", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (!["admin", "hr", "manager"].includes(req.user.role)) return res.status(403).send("Forbidden");
      const { records } = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ message: "Invalid records format" });
      }
      const results = { success: 0, failed: 0 };
      for (const record of records) {
        try {
          const employees = await storage.getUsers();
          const emp = employees.find(
            (e) => e.employeeId === record.employeeId || `${e.firstName} ${e.lastName}`.toLowerCase() === record.fullName?.toLowerCase()
          );
          if (!emp) continue;
          for (let day = 1; day <= 31; day++) {
            const statusKey = `Day ${day}`;
            const status = record[statusKey];
            if (!status) continue;
            const date = new Date(record.year, record.month - 1, day);
            if (isNaN(date.getTime())) continue;
            let attendanceStatus = "present";
            const s = String(status).toUpperCase();
            if (s === "A") attendanceStatus = "absent";
            else if (s === "H") attendanceStatus = "halfday";
            else if (s === "L") attendanceStatus = "absent";
            await storage.createAttendance({
              userId: emp.id,
              date,
              status: attendanceStatus
            });
          }
          results.success++;
        } catch (err) {
          results.failed++;
        }
      }
      res.json({ message: "Bulk attendance processed", results });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/leave-requests/bulk", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (!["admin", "hr", "manager"].includes(req.user.role)) return res.status(403).send("Forbidden");
      const { records } = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ message: "Invalid records format" });
      }
      const results = { success: 0, failed: 0 };
      for (const record of records) {
        try {
          const employees = await storage.getUsers();
          const emp = employees.find(
            (e) => e.employeeId === record.employeeId || `${e.firstName} ${e.lastName}`.toLowerCase() === record.fullName?.toLowerCase()
          );
          if (!emp) continue;
          if (record.leaveEnjoyed > 0) {
            await storage.createLeaveRequest({
              userId: emp.id,
              type: "annual",
              startDate: /* @__PURE__ */ new Date(),
              // Placeholders as exact dates aren't in current template
              endDate: /* @__PURE__ */ new Date(),
              reason: "Imported from register",
              status: "approved"
            });
          }
          results.success++;
        } catch (err) {
          results.failed++;
        }
      }
      res.json({ message: "Bulk leave requests processed", results });
    } catch (error) {
      next(error);
    }
  });
  setupAuth(app2);
  app2.post("/api/employees/upload", upload.single("file"), async (req, res, next) => {
    try {
      if (typeof req.isAuthenticated === "function" && !req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      } else if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      if (!["hr", "admin", "developer"].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const departmentId = req.body.departmentId ? parseInt(req.body.departmentId) : null;
      let data = [];
      if (req.file.originalname.endsWith(".csv")) {
        data = parseCsv(req.file.buffer, { columns: true, skip_empty_lines: true });
      } else if (req.file.originalname.endsWith(".xlsx")) {
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        return res.status(400).json({ message: "Invalid file format. Only CSV and XLSX supported." });
      }
      const results = { success: 0, failed: 0, errors: [] };
      for (const row of data) {
        try {
          const username = row.username || row.Username || row.employeeId || row.EmployeeID;
          const email = row.email || row.Email;
          const firstName = row.firstName || row.FirstName || row.first_name;
          const lastName = row.lastName || row.LastName || row.last_name;
          if (!username || !email || !firstName || !lastName) {
            results.failed++;
            results.errors.push(`Missing required fields for row: ${JSON.stringify(row)}`);
            continue;
          }
          const existingUser = await storage.getUserByUsername(username) || await storage.getUserByEmail(email);
          if (existingUser) {
            results.failed++;
            results.errors.push(`User already exists: ${username} or ${email}`);
            continue;
          }
          const password = await hashPassword("Welcome@123");
          await storage.createUser({
            username,
            email,
            firstName,
            lastName,
            password,
            departmentId: departmentId || (row.departmentId ? parseInt(row.departmentId) : null) || (row.DepartmentID ? parseInt(row.DepartmentID) : null),
            employeeId: row.employeeId || row.EmployeeID || username,
            role: (row.role || "employee").toLowerCase(),
            status: "active",
            salary: row.salary ? parseInt(row.salary) : null,
            position: row.position || row.Position || null
          });
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push(`Error processing row: ${err.message}`);
        }
      }
      res.json({
        message: `Processed ${data.length} rows. ${results.success} succeeded, ${results.failed} failed.`,
        details: results
      });
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/departments", async (req, res, next) => {
    try {
      const departments2 = await storage.getDepartments();
      res.json(departments2);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/departments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/departments", async (req, res, next) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });
  app2.put("/api/departments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(id, validatedData);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });
  app2.delete("/api/departments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDepartment(id);
      if (!deleted) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/employees", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const users2 = await storage.getUsers();
      const currentUser = req.user;
      let filteredUsers;
      if (["admin", "hr", "manager", "developer"].includes(currentUser.role)) {
        filteredUsers = currentUser.role === "developer" ? users2 : users2.filter((user) => user.role !== "developer");
      } else {
        filteredUsers = users2.filter((user) => user.id === currentUser.id);
      }
      const usersWithoutPasswords = filteredUsers.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/employees/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      const currentUser = req.user;
      if (!user) {
        return res.status(404).json({ message: "Employee not found" });
      }
      if (user.id !== currentUser.id && !["admin", "hr", "manager", "developer"].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied. You can only view your own profile." });
      }
      if (user.role === "developer" && currentUser.role !== "developer") {
        return res.status(404).json({ message: "Employee not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/users/permissions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (req.user.role !== "admin") return res.status(403).send("Forbidden");
      const { userId, role, customPermissions } = req.body;
      if (!userId || !role) {
        return res.status(400).json({ message: "userId and role are required" });
      }
      const updatedUser = await storage.updateUser(userId, {
        role,
        customPermissions: customPermissions || []
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/employees/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const requestingUser = req.user;
      const canUpdate = requestingUser.id === id || ["admin", "hr", "manager", "developer"].includes(requestingUser.role);
      if (!canUpdate) {
        return res.status(403).json({ message: "Access denied. You can only update your own profile or must have admin/HR privileges." });
      }
      const { password, ...updateData } = req.body;
      if (updateData.documents && updateData.documents.length > 0) {
        console.log(`[Employee Update] Saving ${updateData.documents.length} documents for employee ${id}`);
      }
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const { password: userPassword, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  app2.patch("/api/employees/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const requestingUser = req.user;
      const canUpdate = requestingUser.id === id || ["admin", "hr", "manager", "developer"].includes(requestingUser.role);
      if (!canUpdate) {
        return res.status(403).json({ message: "Access denied. You can only update your own profile or must have admin/HR privileges." });
      }
      const { password, ...updateData } = req.body;
      if (updateData.documents && updateData.documents.length > 0) {
        console.log(`[Employee PATCH] Saving ${updateData.documents.length} documents for employee ${id}`);
      }
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const { password: userPassword, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/employees/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/employees/leave-balances", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const requestingUser = req.user;
      if (requestingUser?.role !== "admin" && requestingUser?.role !== "hr" && requestingUser?.role !== "developer") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      const allEmployees = await storage.getUsers();
      const activeEmployees = allEmployees.filter((u) => u.isActive && u.role !== "developer");
      const balances = {};
      for (const emp of activeEmployees) {
        try {
          const balance = await storage.calculateLeaveBalance(emp.id);
          balances[emp.id] = balance;
        } catch (e) {
          balances[emp.id] = {
            totalAccrued: 0,
            totalTaken: 0,
            pendingRequests: 0,
            remainingBalance: 0,
            accruedThisYear: 0,
            takenThisYear: 0
          };
        }
      }
      res.json(balances);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/employees/:id/leave-balance", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = parseInt(req.params.id);
      const requestingUser = req.user;
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "Employee not found" });
      }
      if (targetUser.role === "developer" && requestingUser?.role !== "developer") {
        return res.status(404).json({ message: "Employee not found" });
      }
      const canAccess = requestingUser.id === userId || ["hr", "admin", "manager"].includes(requestingUser.role);
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied. You can only view your own leave balance or must have HR/admin/manager privileges." });
      }
      const leaveBalance = await storage.calculateLeaveBalance(userId);
      res.json(leaveBalance);
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/change-password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      const user = await storage.getUserByUsername(req.user.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let isCurrentPasswordValid = false;
      if (user.username === "admin" && currentPassword === "admin123" || user.username === "hr" && currentPassword === "hr123" || user.username === "manager" && currentPassword === "manager123" || user.username === "employee" && currentPassword === "employee123") {
        isCurrentPasswordValid = true;
      } else {
        try {
          const scryptAsync3 = promisify2(crypto.scrypt);
          const [hash, salt] = user.password.split(".");
          const keyBuffer = Buffer.from(hash, "hex");
          const derivedKey = await scryptAsync3(currentPassword, salt, 64);
          isCurrentPasswordValid = crypto.timingSafeEqual(keyBuffer, derivedKey);
        } catch (error) {
          console.error("Error verifying stored password:", error);
          isCurrentPasswordValid = false;
        }
      }
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const scryptAsync2 = promisify2(crypto.scrypt);
      const newSalt = crypto.randomBytes(16).toString("hex");
      const newHashBuffer = await scryptAsync2(newPassword, newSalt, 64);
      const newHashedPassword = newHashBuffer.toString("hex") + "." + newSalt;
      await storage.updateUser(user.id, { password: newHashedPassword });
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      next(error);
    }
  });
  const handleUpdatePermissions = async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admin users can modify permissions" });
      }
      const { userId, role, customPermissions } = req.body;
      if (!userId || !role) {
        return res.status(400).json({ message: "userId and role are required" });
      }
      const updatedUser = await storage.updateUser(userId, {
        role,
        customPermissions: customPermissions || []
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  };
  app2.patch("/api/users/permissions", handleUpdatePermissions);
  app2.post("/api/users/permissions", handleUpdatePermissions);
  app2.get("/api/departments/:departmentId/employees", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const departmentId = parseInt(req.params.departmentId);
      const employees = await storage.getUsersByDepartment(departmentId);
      const filteredEmployees = req.user?.role === "developer" ? employees : employees.filter((employee) => employee.role !== "developer");
      const employeesWithoutPasswords = filteredEmployees.map(({ password, ...employee }) => employee);
      res.json(employeesWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/holidays", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const holidays2 = await storage.getHolidays();
      res.json(holidays2);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/holidays", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (!["admin", "hr", "developer"].includes(req.user.role)) {
        return res.status(403).send("Forbidden");
      }
      const holiday = await storage.createHoliday(req.body);
      res.status(201).json(holiday);
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/holidays/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (!["admin", "hr", "developer"].includes(req.user.role)) {
        return res.status(403).send("Forbidden");
      }
      const id = parseInt(req.params.id);
      const holiday = await storage.updateHoliday(id, req.body);
      if (!holiday) return res.status(404).send("Holiday not found");
      res.json(holiday);
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/holidays/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (!["admin", "hr", "developer"].includes(req.user.role)) {
        return res.status(403).send("Forbidden");
      }
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHoliday(id);
      if (!deleted) return res.status(404).send("Holiday not found");
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/certifications", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const user = req.user;
      let certifications2;
      if (hasPermission(req, "certifications.view")) {
        certifications2 = await storage.getCertifications();
      } else if (hasPermission(req, "certifications.view_own")) {
        certifications2 = await storage.getCertificationsByUser(user.id);
      } else {
        return res.status(403).send("Forbidden");
      }
      res.json(certifications2);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/certifications", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (!hasPermission(req, "certifications.edit")) return res.status(403).send("Forbidden");
      const validatedData = insertCertificationSchema.parse(req.body);
      const certification = await storage.createCertification(validatedData);
      res.status(201).json(certification);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });
  app2.put("/api/certifications/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (!hasPermission(req, "certifications.edit")) return res.status(403).send("Forbidden");
      const id = parseInt(req.params.id);
      const validatedData = insertCertificationSchema.partial().parse(req.body);
      const certification = await storage.updateCertification(id, validatedData);
      if (!certification) return res.status(404).send("Certification not found");
      res.json(certification);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });
  app2.delete("/api/certifications/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      if (!hasPermission(req, "certifications.edit")) return res.status(403).send("Forbidden");
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCertification(id);
      if (!deleted) return res.status(404).send("Certification not found");
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/employees/invite", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!["hr", "admin"].includes(req.user.role)) {
        return res.status(403).json({ message: "Only HR and admin users can send invitations" });
      }
      const { firstName, lastName, email } = req.body;
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }
      const invitationToken = crypto.randomUUID();
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const invitation = await storage.createEmployeeInvitation({
        token: invitationToken,
        email,
        firstName,
        lastName,
        invitedById: req.user.id,
        expiresAt
      });
      const emailTemplate = generateInvitationEmail(firstName, lastName, invitationToken);
      emailTemplate.to = email;
      const emailSent = await sendEmail(emailTemplate);
      let adminEmailResults = { sent: 0, failed: 0, totalAdmins: 0 };
      try {
        const allUsers = await storage.getUsers();
        const adminUsers = allUsers.filter((user) => user.role === "admin");
        adminEmailResults.totalAdmins = adminUsers.length;
        if (adminUsers.length > 0) {
          const inviter = await storage.getUser(req.user.id);
          if (inviter) {
            const sentAt = /* @__PURE__ */ new Date();
            const invitationUrl = `${process.env.REPLIT_DOMAINS || "http://localhost:5000"}/invitation/${invitationToken}`;
            for (const admin of adminUsers) {
              try {
                const adminNotificationTemplate = generateAdminInvitationNotificationEmail(
                  { firstName, lastName, email },
                  {
                    firstName: inviter.firstName,
                    lastName: inviter.lastName,
                    email: inviter.email,
                    role: inviter.role
                  },
                  { sentAt, expiresAt, invitationUrl },
                  emailSent
                );
                adminNotificationTemplate.to = admin.email;
                const adminEmailSent = await sendEmail(adminNotificationTemplate);
                if (adminEmailSent) {
                  adminEmailResults.sent++;
                } else {
                  adminEmailResults.failed++;
                }
              } catch (error) {
                console.warn(`Failed to send admin notification to ${admin.email}:`, error);
                adminEmailResults.failed++;
              }
            }
          }
        }
      } catch (error) {
        console.warn("Error sending admin notifications:", error);
      }
      res.status(201).json({
        message: emailSent ? "Invitation sent successfully" : "Invitation created (email delivery failed - please check SendGrid configuration)",
        invitation: {
          id: invitation.id,
          email,
          firstName,
          lastName,
          expiresAt,
          invitationUrl: `${process.env.REPLIT_DOMAINS || "http://localhost:5000"}/invitation/${invitationToken}`
        },
        emailSent,
        adminNotifications: adminEmailResults
      });
    } catch (error) {
      console.error("Error sending invitation:", error);
      next(error);
    }
  });
  app2.get("/api/invitations/:token", async (req, res, next) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getEmployeeInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      if (/* @__PURE__ */ new Date() > new Date(invitation.expiresAt)) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      if (invitation.usedAt) {
        return res.status(400).json({ message: "Invitation has already been used" });
      }
      res.json({
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        email: invitation.email,
        expiresAt: invitation.expiresAt
      });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      next(error);
    }
  });
  app2.post("/api/invitations/:token/accept", async (req, res, next) => {
    try {
      const { token } = req.params;
      const { firstName, lastName, password } = req.body;
      if (!firstName || !lastName || !password) {
        return res.status(400).json({ message: "First name, last name, and password are required" });
      }
      const invitation = await storage.getEmployeeInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      if (/* @__PURE__ */ new Date() > new Date(invitation.expiresAt)) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      if (invitation.usedAt) {
        return res.status(400).json({ message: "Invitation has already been used" });
      }
      const existingUser = await storage.getUserByEmail(invitation.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        username: invitation.email,
        email: invitation.email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "employee",
        status: "invited",
        // Keep as invited until they complete their full profile
        departmentId: null,
        position: "Employee",
        joinDate: /* @__PURE__ */ new Date(),
        phoneNumber: null,
        address: null,
        dateOfBirth: null,
        gender: null,
        photoUrl: null,
        bankAccountNumber: null,
        bankName: null,
        bankIFSCCode: null,
        bankAccountType: null,
        salary: null,
        customPermissions: []
      });
      await storage.updateEmployeeInvitation(invitation.id, {
        usedAt: /* @__PURE__ */ new Date()
      });
      const allUsers = await storage.getUsers();
      const adminUsers = allUsers.filter(
        (user) => (user.role === "hr" || user.role === "admin") && user.isActive === true
      );
      let originalInviter = "System Administrator";
      let inviterRole = "Admin";
      try {
        const inviterUser = await storage.getUser(invitation.invitedById || 1);
        if (inviterUser) {
          originalInviter = `${inviterUser.firstName} ${inviterUser.lastName}`;
          inviterRole = inviterUser.role === "hr" ? "HR Manager" : inviterUser.role === "admin" ? "Administrator" : "Manager";
        }
      } catch (error) {
        console.log("Could not find inviter details, using defaults");
      }
      if (adminUsers.length > 0) {
        const registrationCompletionEmails = adminUsers.map(async (adminUser) => {
          const emailTemplate = generateEmployeeRegistrationCompletionEmail(
            {
              firstName,
              lastName,
              email: invitation.email,
              joinDate: /* @__PURE__ */ new Date()
            },
            {
              originalInviter,
              inviterRole,
              completedAt: /* @__PURE__ */ new Date()
            },
            "HR Connect"
          );
          emailTemplate.to = adminUser.email;
          return sendEmail(emailTemplate);
        });
        try {
          await Promise.all(registrationCompletionEmails);
          console.log(`Registration completion emails sent to ${adminUsers.length} admin users`);
        } catch (emailError) {
          console.error("Error sending registration completion emails:", emailError);
        }
      }
      res.status(201).json({
        message: "Registration completed successfully",
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      next(error);
    }
  });
  app2.get("/api/attendance", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { userId, date, month } = req.query;
      const user = req.user;
      const isAdminHRManager = ["admin", "hr", "manager"].includes(user.role);
      const currentUserId = user.id;
      if (date && month) {
        return res.status(400).json({ message: "Cannot specify both 'date' and 'month' parameters. Use one or the other." });
      }
      if (userId) {
        const requestedUserId = parseInt(userId);
        if (!isAdminHRManager && requestedUserId !== currentUserId) {
          return res.status(403).json({ message: "Access denied. You can only view your own attendance records." });
        }
        if (month && !/^\d{4}-\d{2}$/.test(month)) {
          return res.status(400).json({ message: "Invalid month format. Use YYYY-MM format." });
        }
        const records = await storage.getAttendanceByUser(requestedUserId);
        if (month) {
          const [year, monthNum] = month.split("-").map(Number);
          if (monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ message: "Invalid month number. Must be between 01-12." });
          }
          const filteredRecords = records.filter((record) => {
            if (!record.date) return false;
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === year && recordDate.getMonth() === monthNum - 1;
          });
          return res.json(filteredRecords);
        }
        return res.json(records);
      }
      if (date) {
        if (!isAdminHRManager) {
          return res.status(403).json({ message: "Access denied. Only administrators/HR/managers can query attendance by date." });
        }
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          return res.status(400).json({ message: "Invalid date format." });
        }
        const records = await storage.getAttendanceByDate(dateObj);
        return res.json(records);
      }
      if (month) {
        if (!/^\d{4}-\d{2}$/.test(month)) {
          return res.status(400).json({ message: "Invalid month format. Use YYYY-MM format." });
        }
        const [year, monthNum] = month.split("-").map(Number);
        if (monthNum < 1 || monthNum > 12) {
          return res.status(400).json({ message: "Invalid month number. Must be between 01-12." });
        }
        if (isAdminHRManager) {
          const allRecords = await storage.getAllAttendance();
          const filteredRecords = allRecords.filter((record) => {
            if (!record.date) return false;
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === year && recordDate.getMonth() === monthNum - 1;
          });
          return res.json(filteredRecords);
        } else {
          const records = await storage.getAttendanceByUser(currentUserId);
          const filteredRecords = records.filter((record) => {
            if (!record.date) return false;
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === year && recordDate.getMonth() === monthNum - 1;
          });
          return res.json(filteredRecords);
        }
      }
      if (isAdminHRManager) {
        const allRecords = await storage.getAllAttendance();
        return res.json(allRecords);
      } else {
        const records = await storage.getAttendanceByUser(currentUserId);
        return res.json(records);
      }
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/attendance", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userRole = req.user.role;
      const currentUserId = req.user.id;
      console.log("=== ATTENDANCE CREATE DEBUG ===");
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      console.log("Body keys:", Object.keys(req.body));
      console.log("Body types:", Object.keys(req.body).map((k) => `${k}: ${typeof req.body[k]}`));
      console.log("User role:", userRole, "User ID:", currentUserId);
      const validatedData = insertAttendanceSchema.parse(req.body);
      console.log("Validation SUCCESS, validated data:", JSON.stringify(validatedData, null, 2));
      if (userRole === "employee" && validatedData.userId !== currentUserId) {
        return res.status(403).json({ message: "Access denied. You can only create attendance records for yourself." });
      }
      if (userRole === "employee") {
        validatedData.userId = currentUserId;
      }
      const cin = validatedData.checkInTime ? new Date(validatedData.checkInTime) : null;
      const cout = validatedData.checkOutTime ? new Date(validatedData.checkOutTime) : null;
      validatedData.status = computeAttendanceStatus(cin, cout);
      const attendance = await storage.createAttendance(validatedData);
      console.log("Storage create SUCCESS:", JSON.stringify(attendance, null, 2));
      console.log("=== END ATTENDANCE CREATE DEBUG ===");
      res.status(201).json(attendance);
    } catch (error) {
      console.log("=== ATTENDANCE CREATE ERROR ===");
      console.log("Error type:", typeof error);
      console.log("Error instanceof z.ZodError:", error instanceof z2.ZodError);
      if (error instanceof z2.ZodError) {
        console.log("Validation errors:", JSON.stringify(error.errors, null, 2));
      }
      console.log("Full error:", error);
      console.log("=== END ATTENDANCE CREATE ERROR ===");
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });
  app2.put("/api/attendance/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!["admin", "hr", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Insufficient permissions to edit attendance records" });
      }
      const id = parseInt(req.params.id);
      const validatedData = updateAttendanceSchema.partial().parse(req.body);
      const existingRecord = await storage.getAttendance(id);
      if (!existingRecord) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      let updateData = { ...validatedData };
      const hasTimeUpdate = updateData.checkInTime !== void 0 || updateData.checkOutTime !== void 0;
      if (hasTimeUpdate) {
        const normalizeToDate = (time) => {
          if (!time) return null;
          if (time instanceof Date) return time;
          if (typeof time === "string") {
            const date = new Date(time);
            return isNaN(date.getTime()) ? null : date;
          }
          return null;
        };
        const finalCheckInTime = updateData.checkInTime ? normalizeToDate(updateData.checkInTime) : normalizeToDate(existingRecord.checkInTime);
        const finalCheckOutTime = updateData.checkOutTime ? normalizeToDate(updateData.checkOutTime) : normalizeToDate(existingRecord.checkOutTime);
        const computedStatus = computeAttendanceStatus(finalCheckInTime, finalCheckOutTime);
        updateData.status = computedStatus;
      }
      const result = await storage.updateAttendance(id, updateData);
      if (!result) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      console.log("Update successful:", result);
      console.log("=== END DEBUG ===");
      res.json(result);
    } catch (error) {
      console.log("=== ERROR ===");
      console.log("Error type:", typeof error);
      console.log("Error constructor:", error?.constructor?.name);
      console.log("Error message:", error?.message);
      console.log("Full error:", error);
      console.log("=== END ERROR ===");
      return res.status(500).json({
        message: "Internal server error",
        error: error?.message || "Unknown error"
      });
    }
  });
  app2.post("/api/attendance/check-in", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user.id;
      const now = /* @__PURE__ */ new Date();
      const todayRecords = await storage.getAttendanceByDate(now);
      const userTodayRecord = todayRecords.find((record) => record.userId === userId);
      if (userTodayRecord && userTodayRecord.checkInTime) {
        return res.status(400).json({ message: "Already checked in today" });
      }
      const attendance = await storage.createAttendance({
        userId,
        checkInTime: now,
        date: now,
        status: "present",
        notes: ""
      });
      res.status(201).json(attendance);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/attendance/check-out", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user.id;
      const now = /* @__PURE__ */ new Date();
      const todayRecords = await storage.getAttendanceByDate(now);
      const userTodayRecord = todayRecords.find((record) => record.userId === userId);
      if (!userTodayRecord) {
        return res.status(404).json({ message: "No check-in record found for today" });
      }
      if (userTodayRecord.checkOutTime) {
        return res.status(400).json({ message: "Already checked out today" });
      }
      const status = computeAttendanceStatus(userTodayRecord.checkInTime ? new Date(userTodayRecord.checkInTime) : null, now);
      const attendance = await storage.updateAttendance(userTodayRecord.id, {
        checkOutTime: now,
        status
      });
      res.json(attendance);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/leave-requests", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      const { userId, status } = req.query;
      const user = req.user;
      const isAdminOrHR = ["admin", "hr"].includes(user.role);
      const isManager = user.role === "manager";
      if (userId) {
        const targetId = parseInt(userId);
        if (user.id !== targetId && !isAdminOrHR && !isManager) {
          return res.status(403).json({ message: "Access denied. You can only view your own leave requests." });
        }
        const requests2 = await storage.getLeaveRequestsByUser(targetId);
        return res.json(requests2);
      }
      if (status === "pending") {
        if (!isAdminOrHR && !isManager) {
          return res.status(403).json({ message: "Access denied. Only HR/Managers can view pending requests." });
        }
        const requests2 = await storage.getPendingLeaveRequests();
        return res.json(requests2);
      }
      if (isAdminOrHR || isManager) {
        const requests2 = await storage.getAllLeaveRequests();
        return res.json(requests2);
      }
      const requests = await storage.getLeaveRequestsByUser(user.id);
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/leave-requests", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const data = {
        ...req.body,
        userId: req.body.userId || req.user.id,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      };
      const validatedData = insertLeaveRequestSchema.parse(data);
      const leaveRequest = await storage.createLeaveRequest(validatedData);
      try {
        await storage.createNotification({
          userId: leaveRequest.userId,
          type: "leave_request",
          title: "Leave Request Submitted",
          message: `Your leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} has been submitted and is pending approval.`,
          isRead: false,
          relatedLeaveId: leaveRequest.id
        });
        const adminUsers = await storage.getAdminUsers();
        const employee = await storage.getUser(leaveRequest.userId);
        for (const admin of adminUsers) {
          await storage.createNotification({
            userId: admin.id,
            type: "leave_request",
            title: "New Leave Request",
            message: `${employee?.firstName} ${employee?.lastName} has submitted a leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} for ${leaveRequest.type} leave.`,
            isRead: false,
            relatedLeaveId: leaveRequest.id,
            relatedUserId: leaveRequest.userId
          });
        }
      } catch (notificationError) {
        console.error("Failed to create leave request notification:", notificationError);
      }
      res.status(201).json(leaveRequest);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });
  app2.put("/api/leave-requests/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const data = { ...req.body };
      if (data.startDate) {
        data.startDate = new Date(data.startDate);
      }
      if (data.endDate) {
        data.endDate = new Date(data.endDate);
      }
      if (data.status === "approved" && req.isAuthenticated()) {
        data.approvedById = req.user.id;
      }
      const validatedData = insertLeaveRequestSchema.partial().parse(data);
      const leaveRequest = await storage.updateLeaveRequest(id, validatedData);
      if (!leaveRequest) {
        return res.status(404).json({ message: "Leave request not found" });
      }
      if (data.status && (data.status === "approved" || data.status === "rejected")) {
        try {
          const statusTitle = data.status === "approved" ? "Leave Request Approved" : "Leave Request Rejected";
          const statusMessage = data.status === "approved" ? `Your leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} has been approved.` : `Your leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} has been rejected.`;
          await storage.createNotification({
            userId: leaveRequest.userId,
            type: data.status === "approved" ? "leave_approved" : "leave_rejected",
            title: statusTitle,
            message: statusMessage,
            isRead: false,
            relatedLeaveId: leaveRequest.id,
            relatedUserId: req.user?.id
          });
        } catch (notificationError) {
          console.error("Failed to create leave status notification:", notificationError);
        }
      }
      res.json(leaveRequest);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });
  app2.delete("/api/leave-requests/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const leaveRequest = await storage.getLeaveRequest(id);
      if (!leaveRequest) {
        return res.status(404).json({ message: "Leave request not found" });
      }
      if (leaveRequest.userId !== req.user.id && req.user.role !== "admin" && req.user.role !== "hr") {
        return res.status(403).json({ message: "You can only cancel your own leave requests" });
      }
      if (leaveRequest.status !== "pending") {
        return res.status(400).json({ message: "Only pending leave requests can be canceled" });
      }
      const deleted = await storage.deleteLeaveRequest(id);
      if (!deleted) {
        return res.status(404).json({ message: "Leave request not found" });
      }
      try {
        await storage.createNotification({
          userId: leaveRequest.userId,
          type: "leave_request",
          title: "Leave Request Canceled",
          message: `Your leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} has been canceled.`,
          isRead: false,
          relatedLeaveId: leaveRequest.id
        });
      } catch (notificationError) {
        console.error("Failed to create leave cancellation notification:", notificationError);
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/holidays", async (req, res, next) => {
    try {
      const holidays2 = await storage.getHolidays();
      res.json(holidays2);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/holidays", async (req, res, next) => {
    try {
      const bodyWithDateConversion = {
        ...req.body,
        date: new Date(req.body.date)
      };
      const validatedData = insertHolidaySchema.parse(bodyWithDateConversion);
      const holiday = await storage.createHoliday(validatedData);
      res.status(201).json(holiday);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });
  app2.put("/api/holidays/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const bodyWithDateConversion = {
        ...req.body,
        ...req.body.date && { date: new Date(req.body.date) }
      };
      const validatedData = insertHolidaySchema.partial().parse(bodyWithDateConversion);
      const holiday = await storage.updateHoliday(id, validatedData);
      if (!holiday) {
        return res.status(404).json({ message: "Holiday not found" });
      }
      res.json(holiday);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });
  app2.delete("/api/holidays/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHoliday(id);
      if (!deleted) {
        return res.status(404).json({ message: "Holiday not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/reports/attendance", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      if (!["admin", "hr", "manager", "developer"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied. Reports are restricted." });
      }
      const { startDate, endDate, departmentId } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allUsers = await storage.getUsers();
      const allAttendance = [];
      let users2 = allUsers;
      if (departmentId) {
        users2 = allUsers.filter((user) => user.departmentId === parseInt(departmentId));
      }
      for (const user of users2) {
        const userAttendance = await storage.getAttendanceByUser(user.id);
        const filteredAttendance = userAttendance.filter((record) => {
          const recordDate = record.date ? new Date(record.date) : null;
          return recordDate && recordDate >= start && recordDate <= end;
        });
        if (filteredAttendance.length > 0) {
          allAttendance.push({
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              position: user.position,
              departmentId: user.departmentId
            },
            records: filteredAttendance
          });
        }
      }
      res.json(allAttendance);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/reports/leave", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      if (!["admin", "hr", "manager", "developer"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied. Reports are restricted." });
      }
      const { startDate, endDate, departmentId, status } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allUsers = await storage.getUsers();
      const leaveReport = [];
      let users2 = allUsers;
      if (departmentId) {
        users2 = allUsers.filter((user) => user.departmentId === parseInt(departmentId));
      }
      for (const user of users2) {
        const userLeaveRequests = await storage.getLeaveRequestsByUser(user.id);
        let filteredRequests = userLeaveRequests.filter((request) => {
          const requestStart = new Date(request.startDate);
          const requestEnd = new Date(request.endDate);
          return requestStart >= start && requestStart <= end || requestEnd >= start && requestEnd <= end;
        });
        if (status) {
          filteredRequests = filteredRequests.filter((request) => request.status === status);
        }
        if (filteredRequests.length > 0) {
          leaveReport.push({
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              position: user.position,
              departmentId: user.departmentId
            },
            leaveRequests: filteredRequests
          });
        }
      }
      res.json(leaveReport);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/notifications", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const notifications2 = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications2);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/notifications/unread", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const unreadNotifications = await storage.getUnreadNotificationsByUser(req.user.id);
      res.json(unreadNotifications);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/notifications", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const notification = await storage.createNotification(req.body);
      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/notifications/:id/read", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/notifications/read-all", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/notifications/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = parseInt(req.params.id);
      const success = await storage.deleteNotification(id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/payment-records", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { employeeId, month } = req.query;
      if (hasPermission(req, "payroll.view")) {
        if (employeeId) {
          const records2 = await storage.getPaymentRecordsByEmployee(parseInt(employeeId));
          return res.json(records2);
        }
        if (month) {
          const records2 = await storage.getPaymentRecordsByMonth(month);
          return res.json(records2);
        }
        const records = await storage.getPaymentRecords();
        return res.json(records);
      }
      if (hasPermission(req, "payroll.view_own")) {
        const records = await storage.getPaymentRecordsByEmployee(req.user.id);
        if (month) {
          const filteredRecords = records.filter((record) => record.month === month);
          return res.json(filteredRecords);
        }
        return res.json(records);
      }
      return res.status(403).json({ message: "Forbidden" });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/payment-records", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!hasPermission(req, "payroll.process")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const paymentRecord = await storage.createPaymentRecord(req.body);
      res.status(201).json(paymentRecord);
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/payment-records/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!hasPermission(req, "payroll.process")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const id = parseInt(req.params.id);
      const updatedRecord = await storage.updatePaymentRecord(id, req.body);
      if (!updatedRecord) {
        return res.status(404).json({ message: "Payment record not found" });
      }
      res.json(updatedRecord);
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/payment-records/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!hasPermission(req, "payroll.process")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const id = parseInt(req.params.id);
      const success = await storage.deletePaymentRecord(id);
      if (!success) {
        return res.status(404).json({ message: "Payment record not found" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  const SETTINGS_FILE_PATH = path3.join(process.cwd(), "data", "system-settings.json");
  const readSettings = async () => {
    try {
      const data = await fs3.readFile(SETTINGS_FILE_PATH, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return {
        organizationName: "HR Connect",
        organizationEmail: "admin@hrconnect.com",
        timeZone: "Asia/Kolkata",
        dateFormat: "DD/MM/YYYY",
        workingHours: {
          start: "09:00",
          end: "18:00"
        },
        notifications: {
          email: true,
          push: true,
          attendance: true,
          leave: true
        },
        systemLimits: {
          maxEmployees: 10,
          contactEmail: "support@hrconnect.com",
          contactPhone: "+1-234-567-8900",
          upgradeLink: "https://hrconnect.com/upgrade"
        },
        salaryComponents: {
          basicSalaryPercentage: 50,
          hraPercentage: 50,
          epfPercentage: 12,
          esicPercentage: 0.75,
          professionalTax: 200
        }
      };
    }
  };
  const writeSettings = async (settings) => {
    try {
      await fs3.writeFile(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      console.error("Error writing settings:", error);
      return false;
    }
  };
  app2.get("/api/settings/system", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (req.user.role !== "admin" && req.user.role !== "developer") {
        return res.status(403).json({ message: "Forbidden: Admin or Developer access required" });
      }
      const settings = await readSettings();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/settings/system", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (req.user.role !== "admin" && req.user.role !== "developer") {
        return res.status(403).json({ message: "Forbidden: Admin or Developer access required" });
      }
      const validationResult = systemSettingsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid settings data",
          errors: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message
          }))
        });
      }
      const success = await writeSettings(validationResult.data);
      if (!success) {
        return res.status(500).json({ message: "Failed to save settings" });
      }
      res.json({ message: "Settings updated successfully", data: validationResult.data });
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/user/profile", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { firstName, lastName, email, phone, address, department } = req.body;
      const updateData = {
        firstName,
        lastName,
        email
      };
      if (phone) updateData.phoneNumber = phone;
      if (address) updateData.address = address;
      if (department) updateData.departmentId = parseInt(department);
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/user/change-password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      const user = await storage.getUserByUsername(req.user.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { comparePasswords: comparePasswords2, hashPassword: hashPassword2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
      const isValidPassword = await comparePasswords2(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const hashedNewPassword = await hashPassword2(newPassword);
      await storage.updateUser(req.user.id, { password: hashedNewPassword });
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/goals", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      const user = req.user;
      if (user.role === "employee") {
        const goals3 = await storage.getGoalsByUser(user.id);
        return res.json(goals3);
      }
      const goals2 = await storage.getGoals();
      res.json(goals2);
    } catch (error) {
      next(error);
    }
  });
  app2.get("/api/goals/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      const goal = await storage.getGoal(parseInt(req.params.id));
      if (!goal) return res.status(404).json({ message: "Goal not found" });
      const user = req.user;
      if (user.role === "employee" && goal.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(goal);
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/goals", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      const user = req.user;
      const goalData = { ...req.body, userId: req.body.userId || user.id };
      if (goalData.dueDate) goalData.dueDate = new Date(goalData.dueDate);
      const goal = await storage.createGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      next(error);
    }
  });
  app2.put("/api/goals/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      const updateData = { ...req.body };
      if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
      const goal = await storage.updateGoal(parseInt(req.params.id), updateData);
      if (!goal) return res.status(404).json({ message: "Goal not found" });
      res.json(goal);
    } catch (error) {
      next(error);
    }
  });
  app2.delete("/api/goals/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      const deleted = await storage.deleteGoal(parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ message: "Goal not found" });
      res.json({ message: "Goal deleted" });
    } catch (error) {
      next(error);
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs4 from "fs";
import path5 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path4 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  // IMPORTANT: Render serves site at root, so base path must be "/"
  base: "/",
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path4.resolve(import.meta.dirname, "client", "src"),
      "@shared": path4.resolve(import.meta.dirname, "shared"),
      "@assets": path4.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path4.resolve(import.meta.dirname, "client"),
  build: {
    // Render must have all build files inside /dist/
    outDir: path4.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path5.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs4.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/index.ts
import path6 from "path";
import { fileURLToPath } from "url";
var app = express2();
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
var APP_BASE_PATH = process.env.APP_BASE_PATH || "/hrms";
app.use((req, _res, next) => {
  try {
    if (req.path.startsWith(`${APP_BASE_PATH}/api`)) {
      req.url = req.url.replace(new RegExp(`^${APP_BASE_PATH}`), "");
    }
  } catch (e) {
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path7 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path7.startsWith("/api")) {
      let logLine = `${req.method} ${path7} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path6.dirname(__filename);
    app.use(express2.static(path6.join(__dirname, "../dist")));
    app.get("*", (req, res) => {
      res.sendFile(path6.join(__dirname, "../dist", "index.html"));
    });
  }
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5e3;
  const host = process.env.HOST || "0.0.0.0";
  server.listen(
    {
      port,
      host
    },
    () => {
      log(`Serving on ${host}:${port}`);
    }
  );
})();
