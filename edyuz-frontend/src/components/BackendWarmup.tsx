'use client';

import { useEffect } from 'react';
import { API_URL } from '@/lib/api';

/**
 * Sayt ochilishi bilan serverni oldindan "uyg'otadi". Server bir muddat ishlatilmasa uxlab qoladi va
 * birinchi so'rov bir necha soniya kutadi. Bu kichik so'rov foydalanuvchi login yoki sahifani ko'rib
 * turgan paytda serverni tayyorlab qo'yadi. Natija kutilmaydi, xato bo'lsa ham hech narsa ko'rinmaydi.
 */
export default function BackendWarmup() {
  useEffect(() => {
    fetch(`${API_URL}/health`, { cache: 'no-store', keepalive: true }).catch(() => {});
  }, []);
  return null;
}
