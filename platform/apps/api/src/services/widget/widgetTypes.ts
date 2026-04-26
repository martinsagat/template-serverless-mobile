/**
 * Widget request/response shapes are owned by the shared @app/types package
 * so the web admin portal and mobile app can validate the same contracts.
 *
 * Service code keeps importing from this file (not directly from @app/types)
 * so a future migration to per-domain type packages remains a one-file edit.
 */
export * from '@app/types/widget';
