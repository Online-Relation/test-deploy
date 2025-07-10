'use client';

import { useEffect } from 'react';
import { useUserContext } from '@/context/UserContext';
import { usePathname } from 'next/navigation';
import { logUserActivity } from '@/lib/logUserActivity';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUserContext();
  const pathname = usePathname();

  useEffect(() => {
    if (user && pathname) {
      logUserActivity({
        userId: user.id,
        path: pathname,
      }).then(success => {
        if (success) {
          console.log(`[UserActivity] Loggede besøg: ${pathname} for ${user.id}`);
        } else {
          console.warn('[UserActivity] Fejl ved logning!');
        }
      });
    }
  }, [user, pathname]);

  return <>{children}</>;
}
