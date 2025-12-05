import * as uatRepo from '../repositories/uat.repository';
import * as environmentRepo from '../repositories/environment.repository';
import * as bugReportRepo from '../repositories/bug-report.repository';
import { query } from '../config/database';

export interface GoLiveChecklistItem {
  id: string;
  name: string;
  description: string;
  isCompleted: boolean;
  category: 'INFRASTRUCTURE' | 'SECURITY' | 'CONTENT' | 'TESTING';
}

export interface HandoverDocument {
  type: string;
  name: string;
  description: string;
  available: boolean;
}

/**
 * Generate deployment checklist for go-live
 */
export async function generateGoLiveChecklist(projectId: string): Promise<GoLiveChecklistItem[]> {
  const hasUATSignoff = await uatRepo.hasSignoff(projectId, 'UAT');
  const criticalBugs = await bugReportRepo.findCriticalBugs(projectId);
  const prodEnv = await environmentRepo.findEnvironmentByType(projectId, 'PRODUCTION');
  
  return [
    { id: '1', name: 'UAT Sign-off', description: 'Client has approved UAT', isCompleted: hasUATSignoff, category: 'TESTING' },
    { id: '2', name: 'No Critical Bugs', description: 'All critical bugs resolved', isCompleted: criticalBugs.length === 0, category: 'TESTING' },
    { id: '3', name: 'SSL Certificate', description: 'SSL enabled for production', isCompleted: prodEnv?.sslEnabled || false, category: 'SECURITY' },
    { id: '4', name: 'Domain Configuration', description: 'Production domain configured', isCompleted: !!prodEnv?.url, category: 'INFRASTRUCTURE' },
    { id: '5', name: 'Database Backup', description: 'Production database backup configured', isCompleted: false, category: 'INFRASTRUCTURE' },
    { id: '6', name: 'Monitoring Setup', description: 'Application monitoring configured', isCompleted: false, category: 'INFRASTRUCTURE' },
    { id: '7', name: 'Error Tracking', description: 'Error tracking service configured', isCompleted: false, category: 'INFRASTRUCTURE' },
    { id: '8', name: 'Analytics Setup', description: 'Analytics tracking configured', isCompleted: false, category: 'CONTENT' },
  ];
}

/**
 * Check if project is ready for go-live
 */
export async function isReadyForGoLive(projectId: string): Promise<{
  ready: boolean;
  blockers: string[];
  completedItems: number;
  totalItems: number;
}> {
  const checklist = await generateGoLiveChecklist(projectId);
  const completedItems = checklist.filter(item => item.isCompleted).length;
  const blockers = checklist.filter(item => !item.isCompleted && ['TESTING', 'SECURITY'].includes(item.category)).map(item => item.name);
  
  return {
    ready: blockers.length === 0,
    blockers,
    completedItems,
    totalItems: checklist.length,
  };
}

/**
 * Generate handover documentation list
 */
export async function generateHandoverDocuments(projectId: string): Promise<HandoverDocument[]> {
  return [
    { type: 'TECHNICAL', name: 'Technical Documentation', description: 'System architecture and API documentation', available: true },
    { type: 'USER', name: 'User Manual', description: 'End-user guide and tutorials', available: false },
    { type: 'ADMIN', name: 'Admin Guide', description: 'Administration and configuration guide', available: false },
    { type: 'DEPLOYMENT', name: 'Deployment Guide', description: 'Deployment procedures and rollback instructions', available: true },
    { type: 'CREDENTIALS', name: 'Credentials Document', description: 'Access credentials and API keys', available: false },
    { type: 'WARRANTY', name: 'Warranty Information', description: 'Support period and contact information', available: true },
  ];
}

/**
 * Get warranty period information
 */
export function getWarrantyInfo(): {
  startDate: string;
  endDate: string;
  durationMonths: number;
  supportEmail: string;
  supportPhone: string;
} {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3); // 3 months warranty
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    durationMonths: 3,
    supportEmail: 'support@company.com',
    supportPhone: '+84 123 456 789',
  };
}

export default {
  generateGoLiveChecklist,
  isReadyForGoLive,
  generateHandoverDocuments,
  getWarrantyInfo,
};
