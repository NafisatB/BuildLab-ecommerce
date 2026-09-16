# E-Commerce Backend – Product Management, Authentication & Order Processing

A RESTful e-commerce backend developed for the **BuildLab internship** using **NestJS, TypeScript, PostgreSQL, and Prisma**.

The API currently covers:

* **Task 1: Product Management**
* **Task 2: Authentication & Authorization**
* **Task 3: Order Processing & Payment Integration**

It includes JWT authentication, Argon2id password hashing, role-based authorization, product management, order processing, Paystack test-mode payments, order status management, email notifications, request validation, pagination, search, and Swagger/OpenAPI documentation.

## Live Demo

* **Swagger / API Documentation:** https://buildlab-ecommerce.onrender.com/api/docs
* **Production API Base URL:** https://buildlab-ecommerce.onrender.com
* **GGitHub Repository:** https://github.com/NafisatB/BuildLab-ecommerce

## Tech Stack

* **NestJS 11** + **TypeScript**
* **PostgreSQL** + **Prisma ORM**
* **JWT** + **Passport**
* **Argon2id** for password hashing
* **Paystack** for test-mode payment processing
* **Resend** for email notifications
* **Termii** for SMS notifications
* **Swagger/OpenAPI** for API documentation
* **class-validator / class-transformer** for validation
* **Docker** for local development
* **Render** for deployment

**SMS notification integration:** The notification architecture is designed to support SMS delivery through Termii. SMS delivery is currently not enabled as a production feature because Sender ID registration/approval is required by the SMS provider.

## Features

### Product Management

* Create, retrieve, update, and delete products
* Product search and category filtering
* Pagination
* Request validation
* Admin-only product write operations

### Authentication & Authorization

* Customer registration and login
* JWT-based authentication
* Argon2id password hashing
* `CUSTOMER` and `ADMIN` roles
* Protected endpoints
* Role-based access control
* Authenticated-user endpoint
* Logout

New users are assigned the `CUSTOMER` role by default. The registration endpoint does not accept a role, preventing users from registering themselves as administrators.

### Order Processing

* Authenticated customers can create orders
* Customers can view their order history and individual orders
* Server-side price and total calculation
* Stock validation and atomic stock deduction
* Order items linked to products
* Protection against duplicate products within an order
* Ownership checks on customer order access

### Payment Processing

* Paystack Test Mode integration
* Payment initialization and verification
* Payment amount validation
* Payment retry support after failed payments
* Payment records linked to orders
* Paystack webhook signature verification
* Successful payments update the order to `PAID`
* Failed payments update the order to `FAILED`

### Order Status Management

Orders follow a controlled lifecycle:

```text
PENDING
   ↓
PAID
   ↓
PROCESSING
   ↓
SHIPPED
   ↓
DELIVERED
```

Invalid status transitions are rejected, and only administrators can update order status.

### Notifications

Email notifications are supported for:

* Successful payment
* Order processing
* Order shipped
* Order delivered

Notifications are sent after the relevant database transaction succeeds so notification failures do not roll back successful payment or order updates.

The notification module uses a channel-oriented design that can support additional notification providers in the future.

**SMS status:** SMS support has been prepared at the service/integration level but is currently disabled for production delivery pending external provider Sender ID registration and approval.

## Authentication Flow

```text
Register
   ↓
Validate input
   ↓
Hash password with Argon2id
   ↓
Create CUSTOMER account

Login
   ↓
Verify credentials
   ↓
Generate JWT
   ↓
Return access token

Protected Request
   ↓
Bearer JWT
   ↓
JwtAuthGuard
   ↓
Verify token
   ↓
RolesGuard
   ↓
Allow / Reject
```

## User Roles

| Role       | Access                                                                   |
| ---------- | -----------------------------------------------------------------------  |
| `CUSTOMER` | Register, login, logout, view products, access personal resources        |
| `ADMIN`    | All customer permissions + product management and order status updates   |

## JWT Token Usage

A successful login returns a short-lived JWT access token.

Include it in protected requests:

```http
Authorization: Bearer <access-token>
```

The token contains the user's ID, email, and role.

```json
{
  "sub": "user-id",
  "email": "customer12@example.com",
  "role": "CUSTOMER"
}
```

Access tokens expire after **15 minutes**. The JWT secret is stored in an environment variable and must not be committed to source control.

## API Endpoints

### Authentication

| Method | Endpoint             | Access        |
| ------ | -------------------- | ------------- |
| `POST` | `/api/auth/register` | Public        |
| `POST` | `/api/auth/login`    | Public        |
| `GET`  | `/api/auth/me`       | Authenticated |
| `POST` | `/api/auth/logout`   | Authenticated |

### Products

| Method   | Endpoint            | Access  |
| -------- | ------------------- | ------- |
| `GET`    | `/api/products`     | Public  |
| `GET`    | `/api/products/:id` | Public  |
| `POST`   | `/api/products`     | `ADMIN` |
| `PATCH`  | `/api/products/:id` | `ADMIN` |
| `DELETE` | `/api/products/:id` | `ADMIN` |

### Orders

| Method  | Endpoint                 | Access        |
| ------- | ------------------------ | ------------- |
| `POST`  | `/api/orders`            | Authenticated |
| `GET`   | `/api/orders`            | Authenticated |
| `GET`   | `/api/orders/:id`        | Authenticated |
| `PATCH` | `/api/orders/:id/status` | `ADMIN`       |

### Payments

| Method | Endpoint                            | Access        |
| ------ | ----------------------------------- | ------------- |
| `POST` | `/api/payments/:orderId/initialize` | Authenticated |
| `GET`  | `/api/payments/verify/:reference`   | Authenticated |
| `POST` | `/api/payments/webhook/paystack`    | Paystack      |



Unauthenticated requests to protected endpoints return **401 Unauthorized**. Authenticated users without the required role receive **403 Forbidden**.

## Security

* Passwords are hashed using **Argon2id**
* Password hashes are never returned in API responses
* Registration enforces password requirements
* Email addresses are normalized and unique
* JWTs are short-lived
* Secrets are stored in environment variables
* Admin operations require authentication and the `ADMIN` role
* Customer order access is restricted to the authenticated user's own orders
* Payment amounts are verified against the server-side order amount
* Paystack webhooks are authenticated using HMAC SHA-512 signatures
* Generic authentication errors help prevent account enumeration

## Validation

Incoming requests are validated before reaching business logic.

Examples include:

* Valid email format
* Password requirements
* Required product fields
* Positive product prices
* Non-negative stock
* Valid UUIDs
* Valid order quantities
* Valid order status values

Invalid requests return `400 Bad Request`.

## Project Structure

The application follows a modular NestJS architecture with separate modules for authentication, users, products, orders, payments, notifications, and database access.

## Getting Started

### Requirements

* Node.js 22+
* npm
* PostgreSQL
* Docker *(optional)*

### Installation

```bash
git clone https://github.com/NafisatB/BuildLab-ecommerce.git
cd BuildLab-ecommerce/ecommerce-backend
npm install
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce"

PORT=3000
NODE_ENV=development

JWT_SECRET="your-secure-secret"
JWT_EXPIRES_IN="15m"

PAYSTACK_SECRET_KEY="sk_test_your_test_key"
PAYSTACK_BASE_URL="https://api.paystack.co"

RESEND_API_KEY="your_resend_api_key"
RESEND_FROM_EMAIL="your_verified_sender@example.com"

```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Never commit `.env`, JWT secrets, API keys, passwords, or database credentials.

### Database Setup

```bash
docker compose up -d

npx prisma migrate dev

npx prisma generate
```

### Run the Application

```bash
npm run start:dev
```

API:

```text
http://localhost:3000/api
```

Swagger:

```text
http://localhost:3000/api/docs
```

## Testing

```bash
npm run test
npm run test:watch
npm run test:cov
```

Key scenarios include:

* Registration and duplicate email handling
* Valid and invalid login
* Missing, invalid, and expired JWT
* Customer attempting admin operations → `403`
* Unauthenticated protected requests → `401`
* Admin product management
* Order creation and ownership checks
* Insufficient stock
* Payment initialization and verification
* Failed payment retry
* Payment amount validation
* Paystack webhook signature validation
* Valid order status transitions
* Invalid order status transitions

## Logout

The current implementation uses **stateless JWT access tokens**. Logout requires the client to discard the access token; an already-issued token remains valid until it expires.

A future version can introduce refresh tokens, token rotation, and server-side session revocation.

## Future Improvements

* Refresh-token authentication and rotation
* Email verification
* Password reset
* Rate limiting
* Automated integration/E2E tests
* Background job processing for notifications
* Payment refund handling
* Order cancellation workflow

## Author

**Nafisat Babamusa**

