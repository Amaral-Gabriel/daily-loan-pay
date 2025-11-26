# Daily Loan Pay - Setup and Usage Guide

## Overview

**Daily Loan Pay** is a comprehensive web application for managing daily loan payments with PIX integration. It allows customers to view their loans, generate daily payment QR codes, and automatically process payments through webhooks.

## Technology Stack

The system is built with a modern full-stack architecture:

**Frontend:** React 19 with Vite, Tailwind CSS 4, and shadcn/ui components  
**Backend:** Express 4 with tRPC 11 for type-safe API communication  
**Database:** MySQL with Drizzle ORM for schema management  
**Authentication:** Manus OAuth for secure user authentication  
**Payment Processing:** QRCode library for PIX QR code generation

## Installation and Local Setup

### Prerequisites

Ensure you have the following installed on your system:

- Node.js 22.13.0 or higher
- pnpm package manager
- MySQL database (local or remote)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Amaral-Gabriel/daily-loan-pay.git
cd daily-loan-pay
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
DATABASE_URL=mysql://user:password@localhost:3306/daily_loan_pay
JWT_SECRET=your-secret-key-here
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login
VITE_APP_TITLE=Daily Loan Pay
VITE_APP_LOGO=/logo.svg
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name
```

### Step 4: Set Up the Database

Run migrations to create the database schema:

```bash
pnpm db:push
```

This command will:
1. Generate migration files based on the schema defined in `drizzle/schema.ts`
2. Apply migrations to your MySQL database
3. Create all necessary tables

### Step 5: Start the Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
daily-loan-pay/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Dashboard with loan list
│   │   │   ├── LoanDetail.tsx      # Loan details and payment
│   │   │   └── NotFound.tsx        # 404 page
│   │   ├── components/             # Reusable UI components
│   │   ├── lib/
│   │   │   └── trpc.ts             # tRPC client configuration
│   │   ├── App.tsx                 # Main app with routing
│   │   └── main.tsx                # Entry point
│   └── index.html
├── server/                          # Express backend
│   ├── routers.ts                  # Main tRPC router
│   ├── routers/
│   │   ├── loans.ts                # Loan management routes
│   │   ├── payments.ts             # Payment generation routes
│   │   ├── webhooks.ts             # Webhook handlers
│   │   └── *.test.ts               # Unit tests
│   ├── db.ts                       # Database query helpers
│   └── _core/                      # Framework internals
├── drizzle/
│   ├── schema.ts                   # Database schema definition
│   └── migrations/                 # Database migration files
├── shared/                         # Shared constants
├── ARCHITECTURE.md                 # System architecture
├── SETUP_GUIDE.md                  # This file
└── package.json
```

## Database Schema

### Users Table

Stores user information and authentication details.

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  cpf VARCHAR(14) UNIQUE,
  phone VARCHAR(20),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Loans Table

Stores loan information for each user.

```sql
CREATE TABLE loans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  totalAmount DECIMAL(10, 2) NOT NULL,
  dailyAmount DECIMAL(10, 2) NOT NULL,
  paidAmount DECIMAL(10, 2) DEFAULT 0,
  remainingAmount DECIMAL(10, 2) NOT NULL,
  status ENUM('active', 'paid_off', 'overdue') DEFAULT 'active',
  startDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expectedEndDate DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Daily Payments Table

Tracks daily payment generation for each loan.

```sql
CREATE TABLE dailyPayments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loanId INT NOT NULL,
  paymentDate DATE NOT NULL,
  pixKey VARCHAR(255),
  pixQrCode TEXT,
  pixTransactionId VARCHAR(255),
  status ENUM('pending', 'confirmed', 'expired') DEFAULT 'pending',
  expiresAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_daily_payment (loanId, paymentDate),
  FOREIGN KEY (loanId) REFERENCES loans(id) ON DELETE CASCADE
);
```

### Payments Table

Audit log of all completed payments.

```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loanId INT NOT NULL,
  userId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  pixKey VARCHAR(255),
  pixQrCode TEXT,
  pixTransactionId VARCHAR(255) UNIQUE,
  status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending',
  paymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (loanId) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

## API Endpoints

All endpoints are accessed through tRPC at `/api/trpc/`.

### Authentication

- **`auth.me`** - Get current user information
- **`auth.logout`** - Logout current user

### Loans

- **`loans.list`** - Get all loans for current user
- **`loans.getById`** - Get a specific loan by ID
- **`loans.getDetails`** - Get loan details with calculated fields
- **`loans.create`** (admin only) - Create a new loan for a user

### Payments

- **`payments.generateDaily`** - Generate a daily payment QR code
- **`payments.getDailyStatus`** - Check status of today's payment

### Webhooks

- **`webhooks.pixConfirmation`** - Receive payment confirmation from PIX provider

## PIX Integration

### How It Works

1. **Daily Payment Generation**: When a user clicks "Generate Payment", the system creates a unique PIX key and generates a QR code
2. **QR Code Display**: The frontend displays the QR code and copy-paste key
3. **User Payment**: The user scans the QR code or copies the key and makes the payment through their bank app
4. **Webhook Confirmation**: The PIX provider sends a webhook confirming the payment
5. **Automatic Update**: The system automatically updates the loan balance and marks the payment as confirmed

### Webhook Configuration

To integrate with a real PIX provider (Gerencianet, Banco do Brasil, etc.), configure the webhook URL:

```
POST https://your-domain.com/api/trpc/webhooks.pixConfirmation
```

Webhook payload example:

```json
{
  "pixTransactionId": "TXN-1-1234567890",
  "amount": "50.00",
  "status": "confirmed",
  "timestamp": "2025-11-26T10:30:00Z"
}
```

## Running Tests

Execute the test suite with:

```bash
pnpm test
```

This will run all unit tests using Vitest. Tests are located in `*.test.ts` files throughout the project.

## Building for Production

To build the application for production:

```bash
pnpm build
```

This will:
1. Build the frontend with Vite
2. Compile the backend TypeScript
3. Generate optimized bundles

## Key Features

### For Users

- **Secure Login**: OAuth-based authentication via Manus
- **Loan Dashboard**: View all active loans with progress indicators
- **Daily Payments**: Generate PIX QR codes for daily payments
- **Real-time Updates**: Automatic payment confirmation and balance updates
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### For Admins

- **Loan Management**: Create and manage loans for users
- **Payment Monitoring**: Track all payments and confirmations
- **User Management**: View and manage user accounts

## Security Considerations

### Authentication

- All sensitive routes are protected with JWT tokens
- Manus OAuth provides secure user authentication
- Session cookies are HTTP-only and secure

### Data Protection

- Passwords are never stored (OAuth-based)
- Sensitive data like CPF can be encrypted in transit
- All API calls require authentication (except webhooks)

### Input Validation

- All user inputs are validated using Zod schemas
- Monetary values are validated as positive decimals
- Email and phone formats are validated

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify MySQL is running
2. Check DATABASE_URL environment variable
3. Ensure database user has proper permissions
4. Run migrations again: `pnpm db:push`

### TypeScript Errors

If you see TypeScript compilation errors:

```bash
pnpm tsc --noEmit
```

This will show all type errors. Fix them before running the application.

### Frontend Not Loading

If the frontend doesn't load:

1. Clear browser cache
2. Check browser console for errors
3. Verify the dev server is running on port 3000
4. Check network tab in browser DevTools

## Contributing

To contribute to this project:

1. Create a feature branch
2. Make your changes
3. Run tests to ensure everything passes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

**Last Updated**: November 26, 2025  
**Version**: 1.0.0
