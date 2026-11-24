-- New users get 6 registered devices by default (existing users keep their own limit; the admin's was raised separately).
ALTER TABLE "users" ALTER COLUMN "max_devices" SET DEFAULT 6;
