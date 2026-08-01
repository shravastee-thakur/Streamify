import { eq, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/userSchema.js";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export type UserDocument = InferSelectModel<typeof users>;
export type BaseData = InferInsertModel<typeof users>;

export type CreateUserData = Pick<
  BaseData,
  "username" | "email" | "fullname" | "password"
>;

export type UpdateUserData = Pick<
  Partial<BaseData>,
  "username" | "fullname" | "avatar" | "coverImage"
>;

export const existingUser = async (email: string, username: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)));

  return user;
};

export const findByEmail = async (
  email: string,
): Promise<UserDocument | undefined> => {
  const [user] = await db.select().from(users).where(eq(users.email, email));

  return user;
};

export const findByUserName = async (
  username: string,
): Promise<UserDocument | undefined> => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));

  return user;
};

export const findById = async (
  id: string,
): Promise<UserDocument | undefined> => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
};

export const createUser = async (
  userData: CreateUserData,
): Promise<UserDocument> => {
  const [user] = await db.insert(users).values(userData).returning();
  return user;
};

export const updateUser = async (
  id: string,
  userData: UpdateUserData,
): Promise<UserDocument | undefined> => {
  // early return check for empty userData
  if (Object.keys(userData).length === 0) {
    return findById(id);
  }

  const [user] = await db
    .update(users)
    .set(userData)
    .where(eq(users.id, id))
    .returning();

  return user;
};
