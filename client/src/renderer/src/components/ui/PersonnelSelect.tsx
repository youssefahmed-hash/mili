import React, { useEffect, useState } from 'react'
import { Select } from './Select'
import { getAllPersonnel } from '../../api/personnel.api'
import type { Personnel } from '../../types/personnel'

interface PersonnelSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
}

export const PersonnelSelect: React.FC<PersonnelSelectProps> = ({
  label = 'الفرد المعني',
  value,
  onChange,
  error,
  required = true
}) => {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPersonnel = async (): Promise<void> => {
      setLoading(true)
      try {
        const res = await getAllPersonnel()
        if (res.success && Array.isArray(res.data)) {
          setOptions(
            res.data.map((p: Personnel) => ({
              value: p.id,
              label: `${p.fullName} (${p.militaryId}) - ${p.rank}`
            }))
          )
        }
      } catch {
        // ignore - options stay empty
      } finally {
        setLoading(false)
      }
    }
    fetchPersonnel()
  }, [])

  return (
    <Select
      label={required ? `${label} *` : label}
      options={[{ value: '', label: 'اختر فرداً...' }, ...options]}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      disabled={loading}
    />
  )
}
