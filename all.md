# HotelPass API - Frontend Integration Guide

Complete implementation guide for frontend developers integrating with the HotelPass API.

---

## 📋 Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [API Client Setup](#api-client-setup)
3. [Guest User Endpoints](#guest-user-endpoints)
4. [Hotel Admin Endpoints](#hotel-admin-endpoints)
5. [Super Admin Endpoints](#super-admin-endpoints)
6. [Error Handling](#error-handling)
7. [WebSocket Integration](#websocket-integration)
8. [File Upload Guidelines](#file-upload-guidelines)

---

## 🔐 Authentication Flow

### Base URL
```
Production: https://hotelpass-api-gtml.onrender.com
Development: http://localhost:3000
```

### Authentication Headers
All protected routes require JWT token:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 🛠 API Client Setup

### Recommended Structure

```typescript
// api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - attach token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('hotelpass_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('hotelpass_token');
          localStorage.removeItem('hotelpass_user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getClient();
```

---

## 👤 Guest User Endpoints

### 1. User Registration

**Endpoint:** `POST /api/auth/register`

**Frontend Form Data:**
```typescript
interface RegisterFormData {
  username: string;      // min 3 chars
  email: string;         // valid email
  password: string;      // min 6 chars
  picture?: string;      // optional
}
```

**Request Example:**
```typescript
// api/auth.ts
import { apiClient } from './client';

export const registerUser = async (data: RegisterFormData) => {
  try {
    const response = await apiClient.post('/api/auth/register', {
      username: data.username,
      email: data.email,
      password: data.password,
      picture: data.picture || '',
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d5ecb74b24c45a88c9f123",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "GUEST",
    "picture": "",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Validation failed
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": [
      "\"email\" must be a valid email",
      "\"password\" length must be at least 6 characters long"
    ]
  }
  ```
- **409 Conflict** - User already exists
  ```json
  {
    "success": false,
    "message": "User already exists"
  }
  ```

**Frontend Implementation:**
```typescript
// components/RegisterForm.tsx
import { useState } from 'react';
import { registerUser } from '../api/auth';

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await registerUser(formData);
      
      // Store token and user data
      localStorage.setItem('hotelpass_token', response.token);
      localStorage.setItem('hotelpass_user', JSON.stringify(response.user));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.join(', ') ||
        'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};
```

---

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Frontend Form Data:**
```typescript
interface LoginFormData {
  email: string;
  password: string;
}
```

**Request Example:**
```typescript
export const loginUser = async (data: LoginFormData) => {
  const response = await apiClient.post('/api/auth/login', data);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d5ecb74b24c45a88c9f123",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "GUEST",
    "picture": "",
    "isActive": true
  }
}
```

**Error Responses:**
- **401 Unauthorized** - Invalid credentials
  ```json
  {
    "success": false,
    "message": "Invalid credentials"
  }
  ```
- **403 Forbidden** - Wrong role for domain
  ```json
  {
    "success": false,
    "message": "Access denied. Guest credentials required for this domain."
  }
  ```

---

### 3. Get User Profile

**Endpoint:** `GET /api/users/profile`

**Headers Required:** `Authorization: Bearer <token>`

**Request Example:**
```typescript
export const getUserProfile = async () => {
  const response = await apiClient.get('/api/users/profile');
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb74b24c45a88c9f123",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "GUEST",
    "picture": "https://cloudinary.com/profile.jpg",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T15:30:00.000Z"
  }
}
```

---

### 4. Update User Profile

**Endpoint:** `PATCH /api/users/profile`

**Headers Required:** `Authorization: Bearer <token>`

**Frontend Form Data:**
```typescript
interface UpdateProfileData {
  username?: string;
  email?: string;
  password?: string;  // optional, only if changing
}
```

**Request Example:**
```typescript
export const updateUserProfile = async (data: UpdateProfileData) => {
  const response = await apiClient.patch('/api/users/profile', data);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "60d5ecb74b24c45a88c9f123",
    "username": "johndoe_updated",
    "email": "newemail@example.com",
    "role": "GUEST",
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

---

### 5. Upload Profile Picture

**Endpoint:** `POST /api/users/upload-picture`

**Headers Required:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Frontend Form Data:**
```typescript
interface UploadPictureData {
  picture: File;  // jpg, jpeg, png, webp (max 5MB)
}
```

**Request Example:**
```typescript
export const uploadProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append('picture', file);

  const response = await apiClient.post('/api/users/upload-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": {
    "picture": "https://res.cloudinary.com/hotelpass/image/upload/v1234567890/profile.jpg",
    "publicId": "hotelpass/users/abc123"
  }
}
```

**Frontend Implementation:**
```typescript
// components/ProfilePictureUpload.tsx
export const ProfilePictureUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      await uploadProfilePicture(file);
      alert('Picture uploaded successfully!');
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {preview && <img src={preview} alt="Preview" />}
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {uploading && <p>Uploading...</p>}
    </div>
  );
};
```

---

### 6. Browse Properties (Guest)

**Endpoint:** `GET /api/guest/properties`

**Query Parameters:**
```typescript
interface PropertyFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  amenities?: string[];  // comma-separated
  page?: number;         // default: 1
  limit?: number;        // default: 10
}
```

**Request Example:**
```typescript
export const getProperties = async (filters: PropertyFilters) => {
  const params = new URLSearchParams();
  
  if (filters.location) params.append('location', filters.location);
  if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
  if (filters.bedrooms) params.append('bedrooms', filters.bedrooms.toString());
  if (filters.amenities) params.append('amenities', filters.amenities.join(','));
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await apiClient.get(`/api/guest/properties?${params.toString()}`);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24c45a88c9f456",
      "name": "Deluxe Ocean View Suite",
      "location": "Lagos Island",
      "price": 25000,
      "amenities": ["WiFi", "Air Conditioning", "Ocean View"],
      "description": "Beautiful suite with ocean view",
      "images": [
        {
          "url": "https://cloudinary.com/image1.jpg",
          "publicId": "hotelpass/properties/abc123",
          "caption": "Ocean view"
        }
      ],
      "bedrooms": 2,
      "bathrooms": 2,
      "maxGuests": 4,
      "hotelId": "60d5ecb74b24c45a88c9f789",
      "hotelName": "Grand Plaza Hotel",
      "isActive": true,
      "averageRating": 4.5,
      "reviewCount": 23
    }
  ],
  "count": 1,
  "page": 1,
  "totalPages": 1
}
```

---

### 7. Get Property Details

**Endpoint:** `GET /api/guest/properties/:id`

**Request Example:**
```typescript
export const getPropertyById = async (propertyId: string) => {
  const response = await apiClient.get(`/api/guest/properties/${propertyId}`);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb74b24c45a88c9f456",
    "name": "Deluxe Ocean View Suite",
    "location": "Lagos Island",
    "price": 25000,
    "amenities": ["WiFi", "Air Conditioning", "Ocean View"],
    "description": "Beautiful suite with ocean view and modern amenities",
    "images": [
      {
        "url": "https://cloudinary.com/image1.jpg",
        "publicId": "hotelpass/properties/abc123",
        "caption": "Ocean view from balcony"
      }
    ],
    "bedrooms": 2,
    "bathrooms": 2,
    "maxGuests": 4,
    "hotelId": "60d5ecb74b24c45a88c9f789",
    "hotelName": "Grand Plaza Hotel",
    "hotelContact": {
      "phone": "+234123456789",
      "email": "admin@grandplaza.com"
    },
    "isActive": true,
    "averageRating": 4.5,
    "reviewCount": 23,
    "reviews": [
      {
        "_id": "60d5ecb74b24c45a88c9f999",
        "guestId": "60d5ecb74b24c45a88c9f111",
        "guestName": "Alice Johnson",
        "rating": 5,
        "comment": "Amazing experience!",
        "createdAt": "2024-01-10T12:00:00.000Z"
      }
    ]
  }
}
```

---

### 8. Create Booking

**Endpoint:** `POST /api/bookings`

**Headers Required:** `Authorization: Bearer <token>`

**Frontend Form Data:**
```typescript
interface CreateBookingData {
  propertyId: string;
  checkIn: string;        // ISO date: "2024-02-01"
  checkOut: string;       // ISO date: "2024-02-05"
  guestCount: number;     // must be <= maxGuests
  specialRequests?: string;
}
```

**Request Example:**
```typescript
export const createBooking = async (data: CreateBookingData) => {
  const response = await apiClient.post('/api/bookings', data);
  return response.data;
};
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "_id": "60d5ecb74b24c45a88c9f111",
    "propertyId": "60d5ecb74b24c45a88c9f456",
    "propertyName": "Deluxe Ocean View Suite",
    "guestId": "60d5ecb74b24c45a88c9f123",
    "guestName": "John Doe",
    "hotelId": "60d5ecb74b24c45a88c9f789",
    "hotelName": "Grand Plaza Hotel",
    "checkIn": "2024-02-01T00:00:00.000Z",
    "checkOut": "2024-02-05T00:00:00.000Z",
    "guestCount": 2,
    "totalPrice": 100000,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "specialRequests": "Late check-in",
    "createdAt": "2024-01-20T10:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Invalid dates or guest count
  ```json
  {
    "success": false,
    "message": "Check-out date must be after check-in date"
  }
  ```
- **409 Conflict** - Property not available
  ```json
  {
    "success": false,
    "message": "Property is not available for selected dates"
  }
  ```

---

### 9. Get User Bookings

**Endpoint:** `GET /api/bookings/my-bookings`

**Headers Required:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface BookingFilters {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  page?: number;
  limit?: number;
}
```

**Request Example:**
```typescript
export const getMyBookings = async (filters?: BookingFilters) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await apiClient.get(`/api/bookings/my-bookings?${params.toString()}`);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24c45a88c9f111",
      "propertyId": "60d5ecb74b24c45a88c9f456",
      "propertyName": "Deluxe Ocean View Suite",
      "propertyImages": [
        {
          "url": "https://cloudinary.com/image1.jpg"
        }
      ],
      "hotelId": "60d5ecb74b24c45a88c9f789",
      "hotelName": "Grand Plaza Hotel",
      "checkIn": "2024-02-01T00:00:00.000Z",
      "checkOut": "2024-02-05T00:00:00.000Z",
      "guestCount": 2,
      "totalPrice": 100000,
      "status": "CONFIRMED",
      "paymentStatus": "PAID",
      "specialRequests": "Late check-in",
      "createdAt": "2024-01-20T10:00:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    }
  ],
  "count": 1,
  "page": 1,
  "totalPages": 1
}
```

---

### 10. Cancel Booking

**Endpoint:** `PATCH /api/bookings/:id/cancel`

**Headers Required:** `Authorization: Bearer <token>`

**Request Example:**
```typescript
export const cancelBooking = async (bookingId: string) => {
  const response = await apiClient.patch(`/api/bookings/${bookingId}/cancel`);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "_id": "60d5ecb74b24c45a88c9f111",
    "status": "CANCELLED",
    "updatedAt": "2024-01-21T10:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - Cannot cancel (already started/completed)
  ```json
  {
    "success": false,
    "message": "Cannot cancel booking that has already started or completed"
  }
  ```

---

### 11. Submit Review

**Endpoint:** `POST /api/reviews`

**Headers Required:** `Authorization: Bearer <token>`

**Frontend Form Data:**
```typescript
interface CreateReviewData {
  propertyId: string;
  rating: number;        // 1-5
  comment: string;       // optional
}
```

**Request Example:**
```typescript
export const submitReview = async (data: CreateReviewData) => {
  const response = await apiClient.post('/api/reviews', data);
  return response.data;
};
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "_id": "60d5ecb74b24c45a88c9f999",
    "propertyId": "60d5ecb74b24c45a88c9f456",
    "guestId": "60d5ecb74b24c45a88c9f123",
    "guestName": "John Doe",
    "rating": 5,
    "comment": "Excellent stay!",
    "createdAt": "2024-01-22T10:00:00.000Z"
  }
}
```

---

## 🏨 Hotel Admin Endpoints

### 1. Hotel Admin Registration

**Endpoint:** `POST /api/hotel-auth/register`

**Frontend Form Data:**
```typescript
interface HotelRegisterData {
  // Admin account
  username: string;
  email: string;
  password: string;
  
  // Hotel details
  hotelName: string;
  location: string;
  description: string;
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
}
```

**Request Example:**
```typescript
export const registerHotelAdmin = async (data: HotelRegisterData) => {
  const response = await apiClient.post('/api/hotel-auth/register', data);
  return response.data;
};
```

**Success Response (201):**
```json
{
  "message": "Hotel admin registered successfully. Please complete KYC verification.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d5ecb74b24c45a88c9f123",
    "username": "janesmith",
    "email": "jane@grandplaza.com",
    "role": "HOTEL"
  },
  "hotel": {
    "_id": "60d5ecb74b24c45a88c9f789",
    "name": "Grand Plaza Hotel",
    "adminId": "60d5ecb74b24c45a88c9f123",
    "location": "Lagos, Nigeria",
    "isVerified": false
  }
}
```

**Frontend Implementation:**
```typescript
// components/HotelRegisterForm.tsx
export const HotelRegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    hotelName: '',
    location: '',
    description: '',
    contactInfo: {
      phone: '',
      email: '',
      website: '',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await registerHotelAdmin(formData);
      
      // Store credentials
      localStorage.setItem('hotelpass_token', response.token);
      localStorage.setItem('hotelpass_user', JSON.stringify(response.user));
      localStorage.setItem('hotelpass_hotel', JSON.stringify(response.hotel));
      
      // Redirect to KYC upload
      window.location.href = '/hotel/kyc-upload';
    } catch (err: any) {
      console.error('Registration failed:', err.response?.data);
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
};
```

---

### 2. Hotel Admin Login

**Endpoint:** `POST /api/hotel-auth/login`

**Frontend Form Data:**
```typescript
interface HotelLoginData {
  email: string;
  password: string;
}
```

**Request Example:**
```typescript
export const loginHotelAdmin = async (data: HotelLoginData) => {
  const response = await apiClient.post('/api/hotel-auth/login', data);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d5ecb74b24c45a88c9f123",
    "username": "janesmith",
    "email": "jane@grandplaza.com",
    "role": "HOTEL"
  },
  "hotel": {
    "_id": "60d5ecb74b24c45a88c9f789",
    "name": "Grand Plaza Hotel",
    "isVerified": true,
    "propertyCount": 5
  }
}
```

---

### 3. Upload KYC Document

**Endpoint:** `POST /api/hotel/upload-kyc`

**Headers Required:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Frontend Form Data:**
```typescript
interface KYCUploadData {
  document: File;  // pdf, jpg, jpeg, png (max 10MB)
  documentType: 'ID_CARD' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'BUSINESS_REGISTRATION';
}
```

**Request Example:**
```typescript
export const uploadKYCDocument = async (file: File, documentType: string) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);

  const response = await apiClient.post('/api/hotel/upload-kyc', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "KYC document uploaded successfully",
  "data": {
    "documentUrl": "https://res.cloudinary.com/hotelpass/kyc/document.pdf",
    "publicId": "hotelpass/kyc/xyz789",
    "documentType": "BUSINESS_REGISTRATION"
  }
}
```

**Frontend Implementation:**
```typescript
// components/KYCUpload.tsx
export const KYCUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('BUSINESS_REGISTRATION');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadKYCDocument(file, documentType);
      alert('KYC document uploaded. Awaiting verification.');
      // Redirect or update UI
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
        <option value="ID_CARD">ID Card</option>
        <option value="PASSPORT">Passport</option>
        <option value="DRIVERS_LICENSE">Driver's License</option>
        <option value="BUSINESS_REGISTRATION">Business Registration</option>
      </select>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload KYC'}
      </button>
    </div>
  );
};
```

---

### 4. Get Hotel Properties

**Endpoint:** `GET /api/hotel/properties`

**Headers Required:** `Authorization: Bearer <token>`

**Request Example:**
```typescript
export const getHotelProperties = async () => {
  const response = await apiClient.get('/api/hotel/properties');
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24c45a88c9f456",
      "name": "Deluxe Ocean View Suite",
      "location": "Lagos Island",
      "price": 25000,
      "amenities": ["WiFi", "Air Conditioning", "Ocean View"],
      "description": "Beautiful suite with ocean view",
      "images": [
        {
          "url": "https://cloudinary.com/image1.jpg",
          "publicId": "hotelpass/properties/abc123",
          "caption": "Ocean view"
        }
      ],
      "bedrooms": 2,
      "bathrooms": 2,
      "maxGuests": 4,
      "hotelId": "60d5ecb74b24c45a88c9f789",
      "hotelName": "Grand Plaza Hotel",
      "isActive": true,
      "bookingCount": 15,
      "averageRating": 4.5,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 5. Add New Property

**Endpoint:** `POST /api/hotel/properties`

**Headers Required:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Frontend Form Data:**
```typescript
interface AddPropertyData {
  name: string;
  location: string;
  price: number;
  amenities: string[];     // Array of amenity names
  description: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  images?: File[];         // Optional, can upload later
}
```

**Request Example:**
```typescript
export const addProperty = async (data: AddPropertyData, images?: File[]) => {
  const formData = new FormData();
  
  formData.append('name', data.name);
  formData.append('location', data.location);
  formData.append('price', data.price.toString());
  formData.append('amenities', JSON.stringify(data.amenities));
  formData.append('description', data.description);
  formData.append('bedrooms', data.bedrooms.toString());
  formData.append('bathrooms', data.bathrooms.toString());
  formData.append('maxGuests', data.maxGuests.toString());
  
  if (images) {
    images.forEach((image) => {
      formData.append('images', image);
    });
  }

  const response = await apiClient.post('/api/hotel/properties', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Property added successfully",
  "data": {
    "_id": "60d5ecb74b24c45a88c9f999",
    "name": "Executive Suite",
    "location": "Victoria Island",
    "price": 35000,
    "amenities": ["WiFi", "Gym Access", "Business Center"],
    "description": "Perfect for business travelers",
    "images": [],
    "bedrooms": 1,
    "bathrooms": 1,
    "maxGuests": 2,
    "hotelId": "60d5ecb74b24c45a88c9f789",
    "hotelName": "Grand Plaza Hotel",
    "isActive": true
  }
}
```

**Frontend Implementation:**
```typescript
// components/AddPropertyForm.tsx
export const AddPropertyForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price: 0,
    amenities: [],
    description: '',
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
  });
  const [images, setImages] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await addProperty(formData, images);
      alert('Property added successfully!');
      // Reset form or redirect
    } catch (err: any) {
      console.error('Failed to add property:', err.response?.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setImages(Array.from(e.target.files || []))}
      />
      <button type="submit">Add Property</button>
    </form>
  );
};
```

---

### 6. Upload Property Images

**Endpoint:** `POST /api/hotel/upload-images`

**Headers Required:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Frontend Form Data:**
```typescript
interface UploadImagesData {
  images: File[];  // jpg, jpeg, png, webp (max 10 files, 5MB each)
}
```

**Request Example:**
```typescript
export const uploadPropertyImages = async (images: File[]) => {
  const formData = new FormData();
  
  images.forEach((image) => {
    formData.append('images', image);
  });

  const response = await apiClient.post('/api/hotel/upload-images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": [
    {
      "url": "https://res.cloudinary.com/hotelpass/image1.jpg",
      "publicId": "hotelpass/properties/abc123",
      "caption": ""
    },
    {
      "url": "https://res.cloudinary.com/hotelpass/image2.jpg",
      "publicId": "hotelpass/properties/abc124",
      "caption": ""
    }
  ]
}
```

---

### 7. Get Hotel Bookings

**Endpoint:** `GET /api/hotel/bookings`

**Headers Required:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface HotelBookingFilters {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  propertyId?: string;
  page?: number;
  limit?: number;
}
```

**Request Example:**
```typescript
export const getHotelBookings = async (filters?: HotelBookingFilters) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.propertyId) params.append('propertyId', filters.propertyId);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await apiClient.get(`/api/hotel/bookings?${params.toString()}`);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24c45a88c9f111",
      "propertyId": "60d5ecb74b24c45a88c9f456",
      "propertyName": "Deluxe Ocean View Suite",
      "guestId": "60d5ecb74b24c45a88c9f123",
      "guestName": "John Doe",
      "guestEmail": "john@example.com",
      "guestPhone": "+234123456789",
      "checkIn": "2024-02-01T00:00:00.000Z",
      "checkOut": "2024-02-05T00:00:00.000Z",
      "guestCount": 2,
      "totalPrice": 100000,
      "status": "PENDING",
      "paymentStatus": "PAID",
      "specialRequests": "Late check-in",
      "createdAt": "2024-01-20T10:00:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    }
  ],
  "count": 1,
  "page": 1,
  "totalPages": 1
}
```

---

### 8. Update Booking Status

**Endpoint:** `PATCH /api/hotel/bookings/status`

**Headers Required:** `Authorization: Bearer <token>`

**Frontend Form Data:**
```typescript
interface UpdateBookingStatusData {
  bookingId: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}
```

**Request Example:**
```typescript
export const updateBookingStatus = async (data: UpdateBookingStatusData) => {
  const response = await apiClient.patch('/api/hotel/bookings/status', data);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "_id": "60d5ecb74b24c45a88c9f111",
    "status": "CONFIRMED",
    "updatedAt": "2024-01-20T11:00:00.000Z"
  }
}
```

---

## 👑 Super Admin Endpoints

### 1. Super Admin Login

**Endpoint:** `POST /api/auth/super-admin/login`

**Frontend Form Data:**
```typescript
interface SuperAdminLoginData {
  email: string;     // admin@hotelpass.com
  password: string;  // HotelPass2025!SuperSecure (change after first login)
}
```

**Request Example:**
```typescript
export const loginSuperAdmin = async (data: SuperAdminLoginData) => {
  const response = await apiClient.post('/api/auth/super-admin/login', data);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "message": "Super Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d5ecb74b24c45a88c9f000",
    "username": "hotelpass_admin",
    "email": "admin@hotelpass.com",
    "role": "SUPER_ADMIN"
  }
}
```

---

### 2. Get Dashboard Analytics

**Endpoint:** `GET /api/super-admin/dashboard`

**Headers Required:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface DashboardFilters {
  timeframe?: '7d' | '30d' | '90d' | '1y';  // default: 30d
}
```

**Request Example:**
```typescript
export const getDashboardAnalytics = async (timeframe = '30d') => {
  const response = await apiClient.get(`/api/super-admin/dashboard?timeframe=${timeframe}`);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userAnalytics": {
      "totalUsers": 1250,
      "totalGuests": 1100,
      "totalHotels": 45,
      "totalSuperAdmins": 1,
      "newUsersThisPeriod": 85,
      "activeUsers": 890
    },
    "hotelAnalytics": {
      "totalHotels": 45,
      "verifiedHotels": 38,
      "pendingVerification": 7,
      "totalProperties": 234,
      "averagePropertiesPerHotel": 5.2
    },
    "bookingAnalytics": {
      "totalBookings": 3280,
      "pendingBookings": 45,
      "confirmedBookings": 2890,
      "completedBookings": 2650,
      "cancelledBookings": 345,
      "bookingRate": 0.85
    },
    "revenueAnalytics": {
      "totalRevenue": 15750000,
      "averageBookingValue": 48000,
      "projectedRevenue": 18900000
    },
    "topPerformers": {
      "topHotels": [
        {
          "hotelId": "60d5ecb74b24c45a88c9f789",
          "hotelName": "Grand Plaza Hotel",
          "bookingCount": 245,
          "revenue": 5880000,
          "averageRating": 4.7
        }
      ],
      "topProperties": [
        {
          "propertyId": "60d5ecb74b24c45a88c9f456",
          "propertyName": "Deluxe Ocean View Suite",
          "bookingCount": 89,
          "revenue": 2225000,
          "averageRating": 4.8
        }
      ]
    }
  }
}
```

**Frontend Implementation:**
```typescript
// components/AdminDashboard.tsx
export const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await getDashboardAnalytics(timeframe);
        setAnalytics(response.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="1y">Last year</option>
      </select>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{analytics.userAnalytics.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Total Hotels</h3>
          <p>{analytics.hotelAnalytics.totalHotels}</p>
        </div>
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p>{analytics.bookingAnalytics.totalBookings}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>₦{analytics.revenueAnalytics.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* More dashboard components */}
    </div>
  );
};
```

---

### 3. Get System Statistics

**Endpoint:** `GET /api/super-admin/system/stats`

**Headers Required:** `Authorization: Bearer <token>`

**Request Example:**
```typescript
export const getSystemStats = async () => {
  const response = await apiClient.get('/api/super-admin/system/stats');
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "database": {
      "status": "connected",
      "collections": 7,
      "totalDocuments": 5678,
      "storageSize": "45MB"
    },
    "api": {
      "uptime": "15d 3h 24m",
      "requestsToday": 12450,
      "averageResponseTime": "125ms"
    },
    "storage": {
      "cloudinaryUsage": "2.3GB",
      "imagesCount": 1234,
      "documentsCount": 89
    }
  }
}
```

---

### 4. Get All Hotels

**Endpoint:** `GET /api/super-admin/hotels`

**Headers Required:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface HotelFilters {
  status?: 'verified' | 'pending' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}
```

**Request Example:**
```typescript
export const getAllHotels = async (filters?: HotelFilters) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await apiClient.get(`/api/super-admin/hotels?${params.toString()}`);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24c45a88c9f789",
      "name": "Grand Plaza Hotel",
      "adminId": "60d5ecb74b24c45a88c9f123",
      "adminName": "Jane Smith",
      "adminEmail": "jane@grandplaza.com",
      "location": "Lagos, Nigeria",
      "description": "Luxury hotel in Lagos",
      "contactInfo": {
        "phone": "+234123456789",
        "email": "admin@grandplaza.com",
        "website": "https://grandplaza.com"
      },
      "isVerified": true,
      "propertyCount": 12,
      "bookingCount": 145,
      "totalRevenue": 3480000,
      "averageRating": 4.5,
      "kycStatus": "VERIFIED",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "count": 1,
  "page": 1,
  "totalPages": 1
}
```

---

### 5. Get All Users

**Endpoint:** `GET /api/super-admin/users`

**Headers Required:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface UserFilters {
  role?: 'GUEST' | 'HOTEL' | 'SUPER_ADMIN';
  search?: string;
  page?: number;
  limit?: number;
}
```

**Request Example:**
```typescript
export const getAllUsers = async (filters?: UserFilters) => {
  const params = new URLSearchParams();
  if (filters?.role) params.append('role', filters.role);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await apiClient.get(`/api/super-admin/users?${params.toString()}`);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24c45a88c9f123",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "GUEST",
      "isActive": true,
      "bookingCount": 5,
      "totalSpent": 240000,
      "createdAt": "2024-01-10T00:00:00.000Z",
      "lastLogin": "2024-01-20T15:30:00.000Z"
    }
  ],
  "count": 1,
  "page": 1,
  "totalPages": 1
}
```

---

### 6. Get KYC Submissions

**Endpoint:** `GET /api/super-admin/kyc/submissions`

**Headers Required:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface KYCFilters {
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  page?: number;
  limit?: number;
}
```

**Request Example:**
```typescript
export const getKYCSubmissions = async (filters?: KYCFilters) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await apiClient.get(`/api/super-admin/kyc/submissions?${params.toString()}`);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb74b24c45a88c9f555",
      "userId": "60d5ecb74b24c45a88c9f123",
      "userName": "Jane Smith",
      "userEmail": "jane@grandplaza.com",
      "hotelName": "Grand Plaza Hotel",
      "documentType": "BUSINESS_REGISTRATION",
      "documentUrl": "https://res.cloudinary.com/hotelpass/kyc/doc.pdf",
      "status": "PENDING",
      "submittedAt": "2024-01-18T10:00:00.000Z",
      "verifiedBy": null,
      "verifiedAt": null,
      "rejectionReason": null
    }
  ],
  "count": 1,
  "page": 1,
  "totalPages": 1
}
```

---

### 7. Verify KYC Document

**Endpoint:** `POST /api/super-admin/kyc/verify`

**Headers Required:** `Authorization: Bearer <token>`

**Frontend Form Data:**
```typescript
interface VerifyKYCData {
  userId: string;
  status: 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;  // required if status is REJECTED
}
```

**Request Example:**
```typescript
export const verifyKYC = async (data: VerifyKYCData) => {
  const response = await apiClient.post('/api/super-admin/kyc/verify', data);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "KYC status updated successfully",
  "data": {
    "userId": "60d5ecb74b24c45a88c9f123",
    "status": "VERIFIED",
    "verifiedAt": "2024-01-20T10:00:00.000Z",
    "verifiedBy": "60d5ecb74b24c45a88c9f000"
  }
}
```

**Frontend Implementation:**
```typescript
// components/KYCReviewModal.tsx
export const KYCReviewModal = ({ submission, onClose }: Props) => {
  const [status, setStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = async () => {
    try {
      await verifyKYC({
        userId: submission.userId,
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      });
      alert('KYC updated successfully');
      onClose();
    } catch (err) {
      alert('Failed to update KYC');
    }
  };

  return (
    <div className="modal">
      <h2>Review KYC Document</h2>
      <img src={submission.documentUrl} alt="KYC Document" />
      <p>Hotel: {submission.hotelName}</p>
      <p>Email: {submission.userEmail}</p>
      
      <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
        <option value="VERIFIED">Approve</option>
        <option value="REJECTED">Reject</option>
      </select>

      {status === 'REJECTED' && (
        <textarea
          placeholder="Rejection reason"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
      )}

      <button onClick={handleSubmit}>Submit</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};
```

---

## ⚠️ Error Handling

### Standard Error Response Structure

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: string[];  // validation errors
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation failed, invalid data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (email, etc.) |
| 500 | Internal Server Error | Server-side error |

### Frontend Error Handler

```typescript
// utils/errorHandler.ts
import { AxiosError } from 'axios';

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const response = error.response?.data;
    
    // Validation errors
    if (response?.errors && Array.isArray(response.errors)) {
      return response.errors.join(', ');
    }
    
    // Single error message
    if (response?.message) {
      return response.message;
    }
    
    // Network errors
    if (error.message === 'Network Error') {
      return 'Network error. Please check your connection.';
    }
    
    // Status code errors
    switch (error.response?.status) {
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  }
  
  return 'An unexpected error occurred.';
};
```

**Usage:**
```typescript
try {
  await loginUser(credentials);
} catch (err) {
  const errorMessage = handleApiError(err);
  setError(errorMessage);
}
```

---

## 🔌 WebSocket Integration

### Connection Setup

```typescript
// socket/client.ts
import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(process.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketClient = new SocketClient();
```

### Listen for New Properties (Guest)

```typescript
// components/PropertyList.tsx
import { useEffect, useState } from 'react';
import { socketClient } from '../socket/client';

export const PropertyList = () => {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('hotelpass_token');
    if (!token) return;

    const socket = socketClient.connect(token);

    // Listen for new properties
    socket.on('new-property', (property) => {
      console.log('New property added:', property);
      setProperties((prev) => [property, ...prev]);
      
      // Show toast notification
      toast.success(`New property: ${property.name}`);
    });

    // Cleanup on unmount
    return () => {
      socketClient.disconnect();
    };
  }, []);

  return <div>{/* Render properties */}</div>;
};
```

### Broadcast Property (Hotel Admin)

```typescript
// Already handled by backend after property creation
// No additional frontend code needed - just listen for confirmations
```

---

## 📤 File Upload Guidelines

### Image Upload Requirements

| Type | Max Size | Formats | Max Files |
|------|----------|---------|-----------|
| Profile Picture | 5MB | jpg, jpeg, png, webp | 1 |
| Property Images | 5MB each | jpg, jpeg, png, webp | 10 |
| KYC Document | 10MB | jpg, jpeg, png, pdf | 1 |

### Upload Helper Function

```typescript
// utils/fileUpload.ts
export const validateFile = (
  file: File,
  maxSizeMB: number,
  allowedTypes: string[]
): { valid: boolean; error?: string } => {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Only ${allowedTypes.join(', ')} files are allowed`,
    };
  }

  return { valid: true };
};

export const generatePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
```

**Usage:**
```typescript
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const validation = validateFile(file, 5, ['image/jpeg', 'image/jpg', 'image/png']);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  const preview = await generatePreview(file);
  setPreview(preview);
};
```

---

## 💳 Payment Integration (Paystack)

### Initialize Payment

**Endpoint:** `POST /api/payments/initialize`

**Headers Required:** `Authorization: Bearer <token>`

**Frontend Form Data:**
```typescript
interface InitializePaymentData {
  bookingId: string;
  email: string;
  amount: number;  // in kobo (₦100 = 10000 kobo)
}
```

**Request Example:**
```typescript
export const initializePayment = async (data: InitializePaymentData) => {
  const response = await apiClient.post('/api/payments/initialize', data);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment initialized",
  "data": {
    "authorization_url": "https://checkout.paystack.com/abcd1234",
    "access_code": "abcd1234efgh5678",
    "reference": "ref_1234567890"
  }
}
```

**Frontend Implementation:**
```typescript
// components/PaymentButton.tsx
export const PaymentButton = ({ booking }: { booking: Booking }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await initializePayment({
        bookingId: booking._id,
        email: booking.guestEmail,
        amount: booking.totalPrice * 100, // Convert to kobo
      });

      // Redirect to Paystack checkout
      window.location.href = response.data.authorization_url;
    } catch (err) {
      alert('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Processing...' : `Pay ₦${booking.totalPrice.toLocaleString()}`}
    </button>
  );
};
```

---

### Verify Payment

**Endpoint:** `GET /api/payments/verify/:reference`

**Headers Required:** `Authorization: Bearer <token>`

**Request Example:**
```typescript
export const verifyPayment = async (reference: string) => {
  const response = await apiClient.get(`/api/payments/verify/${reference}`);
  return response.data;
};
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "reference": "ref_1234567890",
    "amount": 100000,
    "status": "success",
    "paidAt": "2024-01-20T10:00:00.000Z",
    "channel": "card",
    "currency": "NGN"
  }
}
```

**Frontend Implementation:**
```typescript
// pages/PaymentCallback.tsx
export const PaymentCallback = () => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const searchParams = new URLSearchParams(window.location.search);
  const reference = searchParams.get('reference');

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      return;
    }

    const verify = async () => {
      try {
        await verifyPayment(reference);
        setStatus('success');
        
        // Redirect to booking details after 3 seconds
        setTimeout(() => {
          window.location.href = '/bookings';
        }, 3000);
      } catch (err) {
        setStatus('failed');
      }
    };

    verify();
  }, [reference]);

  if (status === 'verifying') {
    return <div>Verifying payment...</div>;
  }

  if (status === 'success') {
    return (
      <div>
        <h2>Payment Successful!</h2>
        <p>Your booking has been confirmed.</p>
        <p>Redirecting to your bookings...</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Payment Failed</h2>
      <p>There was an issue processing your payment.</p>
      <button onClick={() => window.location.href = '/bookings'}>
        Return to Bookings
      </button>
    </div>
  );
};
```

---

## 🔄 State Management Best Practices

### Context API Setup (Optional)

```typescript
// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'GUEST' | 'HOTEL' | 'SUPER_ADMIN';
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = localStorage.getItem('hotelpass_token');
    const storedUser = localStorage.getItem('hotelpass_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('hotelpass_token', newToken);
    localStorage.setItem('hotelpass_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('hotelpass_token');
    localStorage.removeItem('hotelpass_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**Usage:**
```typescript
// App.tsx
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your routes */}
    </AuthProvider>
  );
}

// components/Header.tsx
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header>
      {isAuthenticated ? (
        <>
          <span>Welcome, {user?.username}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </header>
  );
};
```

---

## 🛡️ Protected Routes

### Route Guard Component

```typescript
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('GUEST' | 'HOTEL' | 'SUPER_ADMIN')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

**Usage in Routes:**
```typescript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Guest routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['GUEST']}>
              <GuestDashboard />
            </ProtectedRoute>
          }
        />

        {/* Hotel routes */}
        <Route
          path="/hotel/dashboard"
          element={
            <ProtectedRoute allowedRoles={['HOTEL']}>
              <HotelDashboard />
            </ProtectedRoute>
          }
        />

        {/* Super Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 📱 Responsive Design Considerations

### Mobile-First Breakpoints

```typescript
// styles/breakpoints.ts
export const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
};

export const media = {
  mobile: `@media (min-width: ${breakpoints.mobile})`,
  tablet: `@media (min-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
  wide: `@media (min-width: ${breakpoints.wide})`,
};
```

### Touch-Friendly Components

```typescript
// components/TouchFriendlyButton.tsx
export const TouchFriendlyButton = ({ children, onClick, ...props }: any) => {
  return (
    <button
      onClick={onClick}
      style={{
        minHeight: '44px',  // iOS touch target minimum
        minWidth: '44px',
        padding: '12px 24px',
        fontSize: '16px',   // Prevents zoom on iOS
      }}
      {...props}
    >
      {children}
    </button>
  );
};
```

---

## 🔍 Search and Filtering

### Advanced Property Search

```typescript
// components/PropertySearch.tsx
import { useState } from 'react';
import { getProperties } from '../api/guest';

export const PropertySearch = () => {
  const [filters, setFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    amenities: [] as string[],
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await getProperties({
        location: filters.location || undefined,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
        amenities: filters.amenities.length > 0 ? filters.amenities : undefined,
      });
      setProperties(response.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  return (
    <div>
      <div className="filters">
        <input
          type="text"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        />
        
        <input
          type="number"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
        />
        
        <input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
        />
        
        <select
          value={filters.bedrooms}
          onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
        >
          <option value="">Any Bedrooms</option>
          <option value="1">1 Bedroom</option>
          <option value="2">2 Bedrooms</option>
          <option value="3">3+ Bedrooms</option>
        </select>

        <div className="amenities">
          {['WiFi', 'Pool', 'Gym', 'Parking', 'Air Conditioning'].map((amenity) => (
            <label key={amenity}>
              <input
                type="checkbox"
                checked={filters.amenities.includes(amenity)}
                onChange={() => handleAmenityToggle(amenity)}
              />
              {amenity}
            </label>
          ))}
        </div>

        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="results">
        {properties.map((property: any) => (
          <PropertyCard key={property._id} property={property} />
        ))}
      </div>
    </div>
  );
};
```

---

## 📊 Data Visualization (Admin Dashboard)

### Chart Integration Example

```typescript
// components/RevenueChart.tsx
import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';

export const RevenueChart = () => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    // Fetch analytics data
    const fetchData = async () => {
      const response = await getDashboardAnalytics('30d');
      
      // Transform data for chart
      setChartData({
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Revenue (₦)',
            data: [3500000, 4200000, 3900000, 4150000],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      });
    };

    fetchData();
  }, []);

  if (!chartData) return <div>Loading chart...</div>;

  return (
    <div style={{ height: '400px' }}>
      <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
    </div>
  );
};
```

---

## 🎨 Theme Customization

### CSS Variables for Theming

```css
/* styles/theme.css */
:root {
  /* Colors */
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;

  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-dark: #343a40;

  /* Text */
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --text-light: #ffffff;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Borders */
  --border-radius: 4px;
  --border-color: #dee2e6;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --border-color: #404040;
}
```

---

## 🧪 Testing Guidelines

### API Service Testing

```typescript
// api/__tests__/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { apiClient } from '../client';
import { loginUser, registerUser } from '../auth';

// Mock axios
vi.mock('../client');

describe('Auth API', () => {
  it('should login user successfully', async () => {
    const mockResponse = {
      data: {
        token: 'mock-token',
        user: { _id: '123', email: 'test@example.com', role: 'GUEST' },
      },
    };

    (apiClient.post as any).mockResolvedValue(mockResponse);

    const result = await loginUser({ email: 'test@example.com', password: 'password' });

    expect(result.token).toBe('mock-token');
    expect(result.user.email).toBe('test@example.com');
  });

  it('should handle login error', async () => {
    const mockError = {
      response: {
        data: { message: 'Invalid credentials' },
        status: 401,
      },
    };

    (apiClient.post as any).mockRejectedValue(mockError);

    await expect(
      loginUser({ email: 'wrong@example.com', password: 'wrong' })
    ).rejects.toMatchObject(mockError);
  });
});
```

---

## 📦 Environment Variables

### Frontend Environment Setup

```bash
# .env.local (Development)
VITE_API_URL=http://localhost:3000
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name

# .env.production (Production)
VITE_API_URL=https://hotelpass-api-gtml.onrender.com
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Environment Type Definitions

```typescript
// types/env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 🚀 Deployment Checklist

### Pre-Deployment Steps

- [ ] Update `.env.production` with production API URL
- [ ] Test all API endpoints with production credentials
- [ ] Verify Paystack integration with live keys
- [ ] Check Cloudinary configuration
- [ ] Test authentication flows (Guest, Hotel, Super Admin)
- [ ] Verify file uploads work correctly
- [ ] Test WebSocket connections
- [ ] Ensure error handling covers all edge cases
- [ ] Check mobile responsiveness
- [ ] Run production build: `npm run build`
- [ ] Test production build locally: `npm run preview`

### Post-Deployment Verification

- [ ] Verify all routes are accessible
- [ ] Test user registration and login
- [ ] Test property creation and image uploads
- [ ] Test booking creation and payment flow
- [ ] Verify WebSocket notifications
- [ ] Check Super Admin dashboard analytics
- [ ] Monitor API response times
- [ ] Check browser console for errors

---

## 📞 Support and Resources

### Useful Links

- **API Documentation**: `/api/docs` (Swagger UI)
- **Backend Repository**: `https://github.com/your-repo/hotelpass-api`
- **Postman Collection**: Available in `/docs/postman`

### Common Issues

**Issue: Token expired errors**
- Solution: Implement token refresh logic or redirect to login

**Issue: CORS errors**
- Solution: Ensure frontend URL is whitelisted in backend CORS config

**Issue: File uploads failing**
- Solution: Check file size limits and Cloudinary configuration

**Issue: WebSocket not connecting**
- Solution: Verify token is being passed in `auth` object

---

## 🎯 Next Steps

1. **Set up your API client** using the provided structure
2. **Implement authentication** for Guest, Hotel, and Super Admin
3. **Build core features** (properties, bookings, payments)
4. **Add WebSocket support** for real-time updates
5. **Implement error handling** and loading states
6. **Test thoroughly** before deployment
7. **Deploy to production** and monitor performance

---

## 📄 License

This API is proprietary to HotelPass. Unauthorized use is prohibited.

---

**Last Updated**: January 2025  
**API Version**: 1.0.0  
**Maintained by**: HotelPass Development Team
