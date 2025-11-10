# Task 06: Admin Console Frontend - Next.js Application

**Parent Spec:** `spec.md` (R1 - Admin Console)
**Status:** Not Started
**Estimated Effort:** 4-5 days
**Dependencies:** Tasks 01-05 (All backend services) complete

---

## References to Main Spec

- **Frontend Strategy:** Section 13.1 - Web Admin Console
- **API Contracts:** Section 4 - All service endpoints
- **Auth Strategy:** Section 6 - JWT authentication

---

## Objective

Build the Admin Console web application with:
1. Authentication (login/logout with JWT)
2. Vehicle Catalog management (CRUD + media upload)
3. Service Center management (CRUD + map picker for geo)
4. Content management (CRUD + type filtering + status workflow)
5. Review moderation (list + approve/reject)
6. Responsive design with Tailwind CSS
7. Type-safe API client using contracts

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Component Library:** ShadCN UI
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod validation
- **API Client:** Auto-generated from contracts
- **Maps:** Leaflet for geo coordinate picker
- **State:** React Context for auth

---

## Setup

### Create Next.js App

**Command:**
```bash
npx nx g @nx/next:application web-admin-console \
  --directory=apps/motorghar \
  --style=css \
  --appDir=true
```

### Install Dependencies

**File: `apps/motorghar/web-admin-console/package.json`** (add dependencies):
```json
{
  "dependencies": {
    "@motorghar/contracts": "*",
    "@motorghar/types": "*",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.17.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4",
    "axios": "^1.6.5",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "lucide-react": "^0.303.0",
    "sonner": "^1.3.1"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33"
  }
}
```

### Configure Tailwind

**File: `apps/motorghar/web-admin-console/tailwind.config.js`**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

## File Structure

```
apps/motorghar/web-admin-console/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout with providers
│   │   ├── page.tsx                    # Redirect to /login or /dashboard
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── (protected)/                # Route group with auth guard
│   │   │   ├── layout.tsx              # Protected layout with sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── catalog/
│   │   │   │   ├── page.tsx            # List vehicles
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx        # Create vehicle
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # View/edit vehicle
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   ├── centers/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── content/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── reviews/
│   │   │       └── page.tsx
│   │   └── api/                        # API route handlers if needed
│   ├── components/
│   │   ├── ui/                         # ShadCN UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── catalog/
│   │   │   ├── VehicleList.tsx
│   │   │   ├── VehicleForm.tsx
│   │   │   └── MediaUploader.tsx
│   │   ├── centers/
│   │   │   ├── CenterList.tsx
│   │   │   ├── CenterForm.tsx
│   │   │   └── MapPicker.tsx
│   │   ├── content/
│   │   │   ├── ContentList.tsx
│   │   │   ├── ContentForm.tsx
│   │   │   └── MarkdownEditor.tsx
│   │   └── reviews/
│   │       ├── ReviewList.tsx
│   │       └── ReviewCard.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts               # Axios client with auth
│   │   │   ├── catalog.ts              # Catalog API methods
│   │   │   ├── centers.ts
│   │   │   ├── content.ts
│   │   │   ├── reviews.ts
│   │   │   └── auth.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useCatalog.ts           # React Query hooks
│   │   │   ├── useCenters.ts
│   │   │   ├── useContent.ts
│   │   │   └── useReviews.ts
│   │   └── utils/
│   │       ├── auth-token.ts           # localStorage token management
│   │       └── format.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   └── styles/
│       └── globals.css
├── public/
│   └── ...
└── next.config.js
```

---

## Key Implementation Details

### 1. Authentication Context

**File: `src/contexts/AuthContext.tsx`**
```typescript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginResponse } from '@motorghar/contracts';
import { authApi } from '@/lib/api/auth';
import { getToken, setToken, removeToken } from '@/lib/utils/auth-token';

interface AuthContextType {
  user: LoginResponse['user'] | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const currentUser = await authApi.me();
          setUser(currentUser);
        } catch (error) {
          removeToken();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    setToken(response.token);
    setUser(response.user);
    router.push('/dashboard');
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 2. API Client

**File: `src/lib/api/client.ts`**
```typescript
import axios from 'axios';
import { getToken } from '@/lib/utils/auth-token';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**File: `src/lib/api/catalog.ts`**
```typescript
import { apiClient } from './client';
import {
  CreateVehicleCatalog,
  UpdateVehicleCatalog,
  VehicleCatalog,
  VehicleCatalogQuery,
} from '@motorghar/contracts';

export const catalogApi = {
  list: async (query: VehicleCatalogQuery) => {
    const { data } = await apiClient.get<{ data: VehicleCatalog[]; meta: any }>(
      '/v1/catalog/vehicles',
      { params: query }
    );
    return data;
  },

  get: async (id: string) => {
    const { data } = await apiClient.get<{ data: VehicleCatalog }>(
      `/v1/catalog/vehicles/${id}`
    );
    return data.data;
  },

  create: async (payload: CreateVehicleCatalog) => {
    const { data } = await apiClient.post<{ data: VehicleCatalog }>(
      '/v1/catalog/vehicles',
      payload
    );
    return data.data;
  },

  update: async (id: string, payload: UpdateVehicleCatalog) => {
    const { data } = await apiClient.patch<{ data: VehicleCatalog }>(
      `/v1/catalog/vehicles/${id}`,
      payload
    );
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/v1/catalog/vehicles/${id}`);
  },

  uploadMedia: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<{ data: { url: string } }>(
      `/v1/catalog/vehicles/${id}/media`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return data.data.url;
  },
};
```

### 3. React Query Hooks

**File: `src/lib/hooks/useCatalog.ts`**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '@/lib/api/catalog';
import { CreateVehicleCatalog, UpdateVehicleCatalog } from '@motorghar/contracts';
import { toast } from 'sonner';

export const useCatalogList = (query: any) => {
  return useQuery({
    queryKey: ['catalog', 'list', query],
    queryFn: () => catalogApi.list(query),
  });
};

export const useCatalogItem = (id: string) => {
  return useQuery({
    queryKey: ['catalog', 'item', id],
    queryFn: () => catalogApi.get(id),
    enabled: !!id,
  });
};

export const useCreateCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVehicleCatalog) => catalogApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'list'] });
      toast.success('Vehicle created successfully');
    },
    onError: () => {
      toast.error('Failed to create vehicle');
    },
  });
};

export const useUpdateCatalog = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateVehicleCatalog) => catalogApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      toast.success('Vehicle updated successfully');
    },
    onError: () => {
      toast.error('Failed to update vehicle');
    },
  });
};

export const useDeleteCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => catalogApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'list'] });
      toast.success('Vehicle deleted successfully');
    },
  });
};
```

### 4. Protected Layout

**File: `src/app/(protected)/layout.tsx`**
```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

### 5. Example Page - Catalog List

**File: `src/app/(protected)/catalog/page.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { useCatalogList, useDeleteCatalog } from '@/lib/hooks/useCatalog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function CatalogPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useCatalogList({ search, limit: 20, offset: 0 });
  const deleteMutation = useDeleteCatalog();

  if (isLoading) return <div>Loading vehicles...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vehicle Catalog</h1>
        <Link href="/catalog/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by make, model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Make & Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Trim
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.data.map((vehicle) => (
              <tr key={vehicle.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {vehicle.make} {vehicle.model}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{vehicle.year}</td>
                <td className="px-6 py-4 whitespace-nowrap">{vehicle.trim || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/catalog/${vehicle.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Pencil className="inline h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('Delete this vehicle?')) {
                        deleteMutation.mutate(vehicle.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="inline h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 6. Map Picker for Service Centers

**File: `src/components/centers/MapPicker.tsx`**
```typescript
'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng } from 'leaflet';

interface MapPickerProps {
  value?: { latitude: number; longitude: number };
  onChange: (coords: { latitude: number; longitude: number }) => void;
}

function LocationMarker({ onChange }: { onChange: (coords: any) => void }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const center: [number, number] = value
    ? [value.latitude, value.longitude]
    : [27.7172, 85.324]; // Kathmandu default

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden">
      <MapContainer center={center} zoom={13} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker onChange={onChange} />
        {value && <Marker position={[value.latitude, value.longitude]} />}
      </MapContainer>
    </div>
  );
}
```

---

## Environment Configuration

**File: `.env.local`**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Testing

- **Manual testing:** Navigate through all CRUD flows
- **E2E tests:** Will be added in Task 07 (Playwright)

---

## Acceptance Criteria

- [ ] App runs on port 4000
- [ ] Login page functional with email/password
- [ ] JWT token stored in localStorage
- [ ] Protected routes redirect to /login if not authenticated
- [ ] Sidebar navigation to all sections
- [ ] **Catalog:** List, create, edit, delete, upload media
- [ ] **Service Centers:** List, create, edit, delete, pick location on map
- [ ] **Content:** List, create, edit, delete, filter by type/status
- [ ] **Reviews:** List, filter by approved, approve/reject buttons
- [ ] Responsive design (desktop + tablet)
- [ ] Loading states shown during API calls
- [ ] Success/error toasts on mutations
- [ ] Proper error handling (API errors displayed to user)

---

## Commands

```bash
# Install dependencies
cd apps/motorghar/web-admin-console && npm install

# Build
npx nx build web-admin-console

# Dev server
npx nx serve web-admin-console

# Access
http://localhost:4000
```

---

## Next Steps

After completion:
1. Commit: `feat(R1): add admin console frontend with all CRUD interfaces`
2. Proceed to Task 07: Integration & E2E Testing