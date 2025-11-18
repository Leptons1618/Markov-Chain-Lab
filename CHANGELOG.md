# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- **Deployment**: Migrated from AWS Amplify to Vercel for hosting
  - Removed `amplify.yml` configuration file
  - Updated all deployment documentation to reference Vercel
  - Updated environment variable examples to use Vercel URLs
- **Authentication**: Migrated from password-based admin authentication to Supabase-based authentication
  - Removed `ADMIN_PASSWORD` environment variable (no longer needed)
  - Admin access is now managed through Supabase `admin_users` table
  - Users must authenticate via Supabase (email/password or OAuth) to access admin panel
- **Theme**: Set Dracula theme as default until user selects another theme
- **Documentation**: Updated README.md with current authentication setup instructions
- **Guest Mode**: Enhanced login flow to properly transition from guest mode to authenticated mode
- **Guest Mode Messages**: Shortened guest mode warning messages for better UX

### Removed
- AWS Amplify deployment configuration (`amplify.yml`)
- Password-based admin authentication system
- Outdated security documentation (replaced by `docs/ADMIN_SETUP.md`)
- Redundant content enhancement summary documents

### Added
- Vercel deployment documentation and setup guides
- Supabase authentication integration
- Admin user management via database
- User progress tracking in Supabase
- User designs storage in Supabase database (per-user tool designs)
- Comprehensive admin setup guide (`docs/ADMIN_SETUP.md`)
- Authentication setup guide (`docs/AUTHENTICATION_SETUP.md`)
- Real-time admin privilege monitoring using Supabase Realtime
- Enhanced identity management with user details page, pagination, and admin actions

## [Previous Versions]

Previous changes were not tracked in a changelog format.
