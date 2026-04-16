# Pharmacy Management System

A comprehensive pharmacy management system built with React and Node.js/Express.

## Features

- **Dashboard** - Overview of sales, inventory, and alerts
- **POS (Point of Sale)** - Quick sales processing with cart management
- **Medicines Inventory** - Full CRUD operations with stock tracking
- **Suppliers Management** - Manage supplier information
- **Sales History** - View and manage past transactions
- **Reports & Analytics** - Sales reports, inventory reports, expiry tracking

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- Recharts (for data visualization)
- React Router DOM

### Backend
- Node.js
- Express 5
- PostgreSQL
- JWT Authentication
- bcrypt Password Hashing

## Project Structure

```
pharmacy-management-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── features/      # Feature modules
│   │   │   ├── auth/      # Login/Register
│   │   │   ├── dashboard/ # Dashboard
│   │   │   ├── medicines/ # Medicine management
│   │   │   ├── sales/     # POS & Sales history
│   │   │   ├── suppliers/ # Supplier management
│   │   │   └── reports/   # Reports & analytics
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── services/      # API services
│   │   └── routes/        # Route definitions
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth middleware
│   │   ├── config/        # Database config
│   │   └── utils/         # Utility functions
│   ├── schema.sql         # Database schema
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE pharmacy_db;
```

2. Run the schema script:
```bash
psql -U postgres -d pharmacy_db -f server/schema.sql
```

3. Configure environment variables in `server/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/pharmacy_db
PORT=5000
JWT_SECRET=your-secret-key
```

### Backend Setup

```bash
cd server
npm install
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

## Default Login

After setting up, create a user via the registration page or insert directly:

```sql
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2b$10$...hashed-password...', 'admin');
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Medicines
- `GET /api/medicines` - List medicines (with filters)
- `GET /api/medicines/:id` - Get single medicine
- `POST /api/medicines` - Add medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Add supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Sales
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales/:id/cancel` - Cancel sale

### Reports
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/expiry` - Expiry report

## License

MIT