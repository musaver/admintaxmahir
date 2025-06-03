import { relations, sql } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  datetime,
  text,
  primaryKey,
  boolean,
  int,
} from 'drizzle-orm/mysql-core';

// ✅ User table (required)
export const user = mysqlTable('user', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: datetime('emailVerified'),
  image: text('image'),
  profilePicture: varchar("profile_picture", { length: 255 }),
  username: varchar("username", { length: 100 }),
  displayName: varchar("display_name", { length: 100 }),
  skill: varchar("skill", { length: 100 }),
  occupation: varchar("occupation", { length: 100 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  address: varchar("address", { length: 100 }),
  state: varchar("state", { length: 100 }),
  aboutMe: text("about_me"),
  newsletter: boolean("newsletter").default(false),
  phone: varchar("phone", { length: 20 }),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ✅ Accounts table (OAuth support: Google, Facebook)
export const account = mysqlTable(
  'account',
  {
    userId: varchar('userId', { length: 255 }).notNull(),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: datetime('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
  })
);

// ✅ Sessions table (for session-based auth, even if using JWT)
export const sessions = mysqlTable('sessions', {
  sessionToken: varchar('sessionToken', { length: 255 }).primaryKey(),
  userId: varchar('userId', { length: 255 }).notNull(),
  expires: datetime('expires').notNull(),
});

// ✅ Verification tokens (for email OTP, magic links)
export const verification_tokens = mysqlTable(
  'verification_tokens',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    otp: varchar('otp', { length: 255 }).notNull(),
    expires: datetime('expires').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token, table.otp] }),
  })
);


// Courses
export const courses = mysqlTable("courses", {
  id: varchar("id", { length: 255 }).primaryKey(),
  featured: int("featured").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  image: varchar("image", { length: 255 }),
  price: int("price").notNull(),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt").default(sql`CURRENT_TIMESTAMP`),
});

// Batches
export const batches = mysqlTable("batches", {
  id: varchar("id", { length: 255 }).primaryKey(),
  batchName: varchar("batchName", { length: 255 }).notNull(),
  courseId: varchar("courseId", { length: 255 }).notNull(),
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate").notNull(),
  capacity: int("capacity").notNull(),
  description: text("description"),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt").default(sql`CURRENT_TIMESTAMP`),
});

// Orders
export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  courseId: varchar("courseId", { length: 255 }).notNull(),
  batchId: varchar("batchId", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  transactionId: varchar("transactionId", { length: 255 }),
  transactionScreenshot: varchar("transactionScreenshot", { length: 255 }),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  country: varchar("country", { length: 100 }),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt").default(sql`CURRENT_TIMESTAMP`),
});

// Admin users
export const adminUsers = mysqlTable("admin_users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  roleId: varchar("roleId", { length: 255 }).notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt").default(sql`CURRENT_TIMESTAMP`),
});

// Admin roles
export const adminRoles = mysqlTable("admin_roles", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  permissions: text("permissions").notNull(),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt").default(sql`CURRENT_TIMESTAMP`),
});

// Admin logs
export const adminLogs = mysqlTable("admin_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  adminId: varchar("adminId", { length: 255 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`),
});

// Recordings
export const recordings = mysqlTable("recordings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  recordingTitle: varchar("recordingTitle", { length: 255 }).notNull(),
  batchId: varchar("batchId", { length: 255 }).notNull(),
  recordingDateTime: datetime("recordingDateTime").notNull(),
  recordingUrl: varchar("recordingUrl", { length: 500 }),
  showToAllUsers: boolean("showToAllUsers").default(true),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt").default(sql`CURRENT_TIMESTAMP`),
});

// Zoom Links
export const zoomLinks = mysqlTable("zoom_links", {
  id: varchar("id", { length: 255 }).primaryKey(),
  batchId: varchar("batchId", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  updatedAt: datetime("updatedAt").default(sql`CURRENT_TIMESTAMP`),
});

// Attendance
export const attendance = mysqlTable("attendance", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  batchId: varchar("batchId", { length: 255 }).notNull(),
  date: datetime("date").default(sql`CURRENT_TIMESTAMP`),
  time: datetime("time").default(sql`CURRENT_TIMESTAMP`),
  createdAt: datetime("createdAt").default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(user, ({ many }) => ({
  orders: many(orders),
  attendance: many(attendance),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  orders: many(orders),
  batches: many(batches),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  course: one(courses, { fields: [batches.courseId], references: [courses.id] }),
  orders: many(orders),
  recordings: many(recordings),
  zoomLinks: many(zoomLinks),
  attendance: many(attendance),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  course: one(courses, { fields: [orders.courseId], references: [courses.id] }),
  batch: one(batches, { fields: [orders.batchId], references: [batches.id] }),
}));

export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  role: one(adminRoles, { fields: [adminUsers.roleId], references: [adminRoles.id] }),
  logs: many(adminLogs),
}));

export const adminRolesRelations = relations(adminRoles, ({ many }) => ({
  adminUsers: many(adminUsers),
}));

export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  admin: one(adminUsers, { fields: [adminLogs.adminId], references: [adminUsers.id] }),
}));

export const recordingsRelations = relations(recordings, ({ one }) => ({
  batch: one(batches, { fields: [recordings.batchId], references: [batches.id] }),
}));

export const zoomLinksRelations = relations(zoomLinks, ({ one }) => ({
  batch: one(batches, { fields: [zoomLinks.batchId], references: [batches.id] }),
})); 

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(user, { fields: [attendance.userId], references: [user.id] }),
  batch: one(batches, { fields: [attendance.batchId], references: [batches.id] }),
})); 