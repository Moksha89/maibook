-- Additional report types (upline entries, agent balance summary).
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'UPLINE';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'COMPANY_SUMMARY';
