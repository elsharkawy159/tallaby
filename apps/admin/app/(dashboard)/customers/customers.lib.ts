import type { Customer, CustomerStats } from './customers.types'

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(date))
}

export function getCustomerInitials(customer: Customer): string {
  const firstName = customer.firstName || ''
  const lastName = customer.lastName || ''
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }
  if (customer.fullName) {
    const parts = customer.fullName.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return customer.fullName[0]?.toUpperCase() || 'C'
  }
  return customer.email[0]?.toUpperCase() || 'C'
}

export function getCustomerFullName(customer: Customer): string {
  if (customer.fullName) return customer.fullName
  if (customer.firstName && customer.lastName) {
    return `${customer.firstName} ${customer.lastName}`
  }
  if (customer.firstName) return customer.firstName
  if (customer.lastName) return customer.lastName
  return customer.email
}

export function calculateCustomerStats(customers: Customer[]): CustomerStats {
  const totalCustomers = customers.length
  const verifiedCustomers = customers.filter((c) => c.isVerified).length
  
  const now = new Date()
  const newCustomersThisMonth = customers.filter((c) => {
    const createdDate = new Date(c.createdAt)
    return (
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear()
    )
  }).length

  const totalRevenue = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0)
  const totalOrders = customers.reduce((sum, customer) => sum + (customer.totalOrders || 0), 0)
  
  const averageSpendPerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return {
    totalCustomers,
    verifiedCustomers,
    newCustomersThisMonth,
    totalRevenue,
    averageSpendPerCustomer,
    averageOrderValue,
  }
}

export function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (role) {
    case 'admin':
      return 'default'
    case 'seller':
      return 'secondary'
    case 'support':
      return 'outline'
    default:
      return 'outline'
  }
}
