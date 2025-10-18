# Hotel Management Components

This directory contains React components for managing hotel properties, bookings, and related functionality.

## Components

### PropertyManagement
A comprehensive component for managing hotel properties including:
- Adding new properties
- Editing existing properties
- Deleting properties
- Uploading property images
- Managing property details (name, location, price, amenities, etc.)

### BookingManagement
A component for managing hotel bookings including:
- Viewing all bookings
- Filtering bookings by status
- Updating booking status (approve, reject, complete)
- Viewing booking details

### KycUpload
A component for uploading KYC (Know Your Customer) documents including:
- Selecting document type
- Uploading identification documents
- Handling file validation

### HotelRegistration
A component for registering new hotels including:
- Hotel name, location, and description
- Admin association
- Registration submission

### WithdrawalRequest
A component for requesting fund withdrawals including:
- Amount input with validation
- Balance checking
- Withdrawal submission

## Usage

All components are designed to work with the hotel management API and integrate with React Query for data fetching and mutations.

```tsx
import { PropertyManagement } from '@/components';

function MyComponent() {
  return (
    <PropertyManagement 
      onPropertyAdded={() => console.log('Property added')}
      onPropertyUpdated={() => console.log('Property updated')}
      onPropertyDeleted={() => console.log('Property deleted')}
    />
  );
}
```