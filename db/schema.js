import {
  pgTable,
  serial,
  varchar,
  timestamp,
  pgEnum,
  integer,
  text,
  foreignKey,
  boolean,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),

  role: userRoleEnum("role").notNull().default("user"),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),

  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    featuredImage: varchar("featured_image", { length: 500 }),
    content: text("content").notNull(),
    owner: integer("owner").notNull(),
    category: varchar("category", { length: 100 }),
    active: boolean().default(false).notNull(),
    slug: varchar("slug", { length: 255 }).unique(),
    campaignSent: boolean().default(false),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.owner],
      foreignColumns: [users.id],
    }),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    content: text("content").notNull(),
    approved: boolean().default(false).notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.postId],
      foreignColumns: [posts.id],
    }),
  ],
);

export const galleries = pgTable(
  "galleries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    continent: varchar("continent", { length: 100 }).notNull(),
    place: varchar("place", { length: 255 }).notNull(),
    active: boolean().default(false).notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
  ],
);

export const galleryImages = pgTable(
  "gallery_images",
  {
    id: serial("id").primaryKey(),
    galleryId: integer("gallery_id").notNull(),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.galleryId],
      foreignColumns: [galleries.id],
    }),
  ],
);
