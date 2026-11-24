psql postgresql://ibook_dev:devpass@localhost:5432/ibook_dev -q -c "delete from sessions; delete from device_registrations;"
