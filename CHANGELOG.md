# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- **Authentication**: Migrated from password-based admin authentication to Supabase-based authentication
  - Removed `ADMIN_PASSWORD` environment variable (no longer needed)
  - Admin access is now managed through Supabase `admin_users` table
  - Users must authenticate via Supabase (email/password or OAuth) to access admin panel
- **Theme**: Set Dracula theme as default until user selects another theme
- **Documentation**: Updated README.md with current authentication setup instructions

### Removed
- Password-based admin authentication system
- Outdated security documentation (replaced by `docs/ADMIN_SETUP.md`)
- Redundant content enhancement summary documents

### Added
- Supabase authentication integration
- Admin user management via database
- User progress tracking in Supabase
- Comprehensive admin setup guide (`docs/ADMIN_SETUP.md`)
- Authentication setup guide (`docs/AUTHENTICATION_SETUP.md`)

## [Previous Versions]

Previous changes were not tracked in a changelog format.
