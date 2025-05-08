export type UserRole = 'sales' | 'operator' | 'factory' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  department?: string;
}

export type OrderStatus = 
  | 'received'
  | 'dyeing'
  | 'dyeing_complete'
  | 'conning'
  | 'conning_complete'
  | 'packing'
  | 'packed';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Received',
  dyeing: 'Dyeing',
  dyeing_complete: 'Dyeing Complete',
  conning: 'Conning',
  conning_complete: 'Conning Complete',
  packing: 'Packing',
  packed: 'Packed',
};

export interface StatusUpdate {
  status: OrderStatus;
  timestamp: string;
  updatedBy: string;
}

export interface Order {
  id: string;
  sdyNumber: string;
  date: string;
  partyName: string;
  deliveryParty: string;
  salespersonId: string;
  denier: string;
  slNumber: string;
  currentStatus: OrderStatus;
  statusHistory: StatusUpdate[];
}