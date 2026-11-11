export interface ActivityField {
  key: string
  label: string
  value: string
  from?: string
  to?: string
}

export interface ActivityDetails {
  summary?: string
  fields?: ActivityField[]
  path?: string
  method?: string
}

export interface ActivityLogItem {
  id: string
  userId: string | null
  userName: string | null
  userRole: string | null
  userDepartment: string | null
  module: string
  moduleLabel: string
  action: string
  entityId: string | null
  title: string | null
  details: ActivityDetails | null
  createdAt: string
}

export interface ActivityLogQuery {
  page?: number
  limit?: number
  module?: string
  action?: string
  search?: string
  from?: string
  to?: string
}
