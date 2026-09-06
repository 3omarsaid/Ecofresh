import { UserRole } from '@prisma/client';

export type PermissionAction =
  | 'MANAGE_FINANCIALS'
  | 'CREATE_COLLECTION'
  | 'CREATE_PAYMENT'
  | 'CREATE_EXPENSE'
  | 'TRANSFER_FUNDS'
  | 'CANCEL_TRANSACTION'
  | 'VIEW_REPORTS'
  | 'CREATE_OPERATION'
  | 'DISPATCH_SHIPMENT'
  | 'DELETE_OPERATION'
  | 'MANAGE_MASTER_DATA';

export function can(role: UserRole, action: PermissionAction | string): boolean {
  if (role === UserRole.ADMIN) return true;
  
  if (role === UserRole.SUPERVISOR) {
    if (action === 'DELETE_OPERATION' || action === 'CANCEL_TRANSACTION') return false;
    return true;
  }
  
  if (role === UserRole.OPERATOR) {
    return action === 'CREATE_OPERATION';
  }
  
  if (role === UserRole.STOREKEEPER) {
    return action === 'CREATE_OPERATION' || action === 'DISPATCH_SHIPMENT';
  }

  if (role === UserRole.VIEWER) {
    return action === 'VIEW_REPORTS';
  }

  return false;
}

