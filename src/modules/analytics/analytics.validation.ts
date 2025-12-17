import { z } from 'zod/v4';
import { DATE_PRESET_VALUES, ANALYTICS_PERIOD_VALUES } from './analytics.types';

/**
 * Analytics Validation Schemas (Zod)
 *
 * All analytics endpoints are GET-only (read-only module).
 * Validation is on query parameters.
 */

// ============================================================================
// Date range query validation — shared by all analytics endpoints
// ============================================================================

const dateRangeQuerySchema = z.object({
  query: z.object({
    preset: z.enum(DATE_PRESET_VALUES as [string, ...string[]]).optional(),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must be YYYY-MM-DD format')
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must be YYYY-MM-DD format')
      .optional(),
  }).optional(),
});

// ============================================================================
// Dashboard query (just date range)
// ============================================================================

export const dashboardQuerySchema = dateRangeQuerySchema;

// ============================================================================
// Revenue time series query
// ============================================================================

export const revenueQuerySchema = z.object({
  query: z.object({
    preset: z.enum(DATE_PRESET_VALUES as [string, ...string[]]).optional(),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must be YYYY-MM-DD format')
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must be YYYY-MM-DD format')
      .optional(),
    period: z.enum(ANALYTICS_PERIOD_VALUES as [string, ...string[]]).optional(),
  }).optional(),
});

// ============================================================================
// Top items / top stores query
// ============================================================================

export const topItemsQuerySchema = z.object({
  query: z.object({
    preset: z.enum(DATE_PRESET_VALUES as [string, ...string[]]).optional(),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must be YYYY-MM-DD format')
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must be YYYY-MM-DD format')
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive number')
      .optional(),
  }).optional(),
});

// ============================================================================
// Recent orders query
// ============================================================================

export const recentOrdersQuerySchema = z.object({
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive number')
      .optional(),
  }).optional(),
});

// ============================================================================
// User growth query
// ============================================================================

export const userGrowthQuerySchema = z.object({
  query: z.object({
    preset: z.enum(DATE_PRESET_VALUES as [string, ...string[]]).optional(),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must be YYYY-MM-DD format')
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must be YYYY-MM-DD format')
      .optional(),
    period: z.enum(ANALYTICS_PERIOD_VALUES as [string, ...string[]]).optional(),
  }).optional(),
});
