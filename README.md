# E-Commerce Backend – Product Management & Authentication API

A RESTful e-commerce backend developed for the **BuildLab internship** using **NestJS, TypeScript, PostgreSQL, and Prisma**.

The API implements product management, JWT authentication, Argon2id password hashing, role-based authorization, request validation, pagination, search, category filtering, and Swagger/OpenAPI documentation.

The current implementation covers 
* **Task 1: Product Management**
* **Task 2: Authentication & Authorization**

## Live Demo

* **Swagger / API Documentation:** https://buildlab-ecommerce.onrender.com/api/docs
* **Production API Base URL:** https://buildlab-ecommerce.onrender.com
* **GGitHub Repository:** https://github.com/NafisatB/BuildLab-ecommerce

## Tech Stack

* **NestJS 11** + **TypeScript**
* **PostgreSQL** + **Prisma ORM**
* **JWT** + **Passport**
* **Argon2id** for password hashing
* **Swagger/OpenAPI** for API documentation
* **class-validator / class-transformer** for validation
* **Docker** for local development
* **Render** for deployment

## Features

### Product Management

* Create, retrieve, update, and delete products
* Product search and category filtering
* Pagination
* Request validation

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

| Role       | Access                                                            |
| ---------- | ----------------------------------------------------------------- |
| `CUSTOMER` | Register, login, logout, view products, access personal resources |
| `ADMIN`    | All customer permissions + create, update, and delete products    |

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

Unauthenticated requests to protected endpoints return **401 Unauthorized**. Authenticated users without the required role receive **403 Forbidden**.

## Security

* Passwords are hashed using **Argon2id**.
* Password hashes are never returned in API responses.
* Registration enforces a minimum 12-character password with complexity requirements.
* Email addresses are normalized and unique.
* JWTs are short-lived.
* Secrets are stored in environment variables.
* Admin product operations require authentication and the `ADMIN` role.
* Generic authentication error messages help prevent account enumeration.

## Validation

Incoming requests are validated before reaching business logic.

Examples include:

* Valid email format
* Password requirements
* Required product fields
* Positive product prices
* Non-negative stock
* Valid UUIDs

Invalid requests return `400 Bad Request`.

## Project Structure

The application follows a modular NestJS architecture with separate controllers, services, DTOs, authentication strategies, guards, authorization, and database access.

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
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Never commit `.env`, JWT secrets, passwords, or database credentials.

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

Key authentication and authorization scenarios include:

* Valid and invalid registration
* Duplicate email
* Valid and invalid login
* Missing, invalid, and expired JWT
* Customer attempting admin operations → `403`
* Unauthenticated protected request → `401`
* Admin product creation, update, and deletion

## Logout

The current implementation uses **stateless JWT access tokens**. Logout requires the client to discard the access token; an already-issued token remains valid until it expires.

A future version can introduce refresh tokens, token rotation, and server-side session revocation.

## Future Improvements

* Refresh-token authentication and rotation
* Email verification
* Password reset
* Rate limiting
* Automated integration/E2E tests
* Order and payment modules

## Author

**Nafisat Babamusa**

