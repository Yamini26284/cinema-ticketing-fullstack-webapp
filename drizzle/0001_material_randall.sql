CREATE TABLE "holds" (
	"id" serial PRIMARY KEY NOT NULL,
	"showing_id" integer NOT NULL,
	"seat_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seats" (
	"id" serial PRIMARY KEY NOT NULL,
	"room" text NOT NULL,
	"seat_row" text NOT NULL,
	"seat_number" integer NOT NULL,
	CONSTRAINT "seats_room_seat_row_seat_number_unique" UNIQUE("room","seat_row","seat_number")
);
--> statement-breakpoint
CREATE TABLE "showings" (
	"id" serial PRIMARY KEY NOT NULL,
	"film_id" integer NOT NULL,
	"room" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_showing_id_showings_id_fk" FOREIGN KEY ("showing_id") REFERENCES "public"."showings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "public"."seats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showings" ADD CONSTRAINT "showings_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "holds_live_seat_unique" ON "holds" USING btree ("showing_id","seat_id") WHERE "holds"."status" in ('active', 'paid');