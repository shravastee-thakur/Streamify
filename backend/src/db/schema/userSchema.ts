import {
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  fullname: varchar("fullname", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  avatar: jsonb("avatar")
    .$type<{ url: string; publicId: string }>()
    .default({ url: "", publicId: "" }),
  coverImage: jsonb("cover_image")
    .$type<{ url: string; publicId: string }>()
    .default({ url: "", publicId: "" }),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
