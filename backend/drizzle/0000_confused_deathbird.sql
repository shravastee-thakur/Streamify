CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"fullname" varchar(255),
	"password" varchar(255) NOT NULL,
	"avatar" jsonb DEFAULT '{"url":"","publicId":""}'::jsonb,
	"cover_image" jsonb DEFAULT '{"url":"","publicId":""}'::jsonb,
	"refresh_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
