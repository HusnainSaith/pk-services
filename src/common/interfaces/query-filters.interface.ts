/**
 * Query Filters Interfaces
 * Standardized filter types for API queries
 */

export interface PaginationQuery {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

export interface SortQuery {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ServiceRequestFilters extends PaginationQuery, SortQuery {
  status?: string;
  serviceTypeId?: string;
  userId?: string;
  assignedOperatorId?: string;
  priority?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface AppointmentFilters extends PaginationQuery, SortQuery {
  status?: string;
  operatorId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UserFilters extends PaginationQuery, SortQuery {
  role?: string;
  isActive?: boolean;
  search?: string;
}

export interface PaymentFilters extends PaginationQuery, SortQuery {
  status?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface DocumentFilters extends PaginationQuery, SortQuery {
  status?: string;
  category?: string;
  requestId?: string;
  userId?: string;
}
