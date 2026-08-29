# E-Commerce Backend – Product Management API

A RESTful Product Management API developed as part of the BuildLab internship e-commerce backend project.

The API provides product CRUD operations with input validation, pagination, category filtering, product search, PostgreSQL persistence, and interactive Swagger/OpenAPI documentation.

## Project Overview

This project implements the Product Management module of an e-commerce backend. It is designed as the foundation for future features including authentication, role-based access control, order management, payment simulation, and order status tracking.

## Live Demo

**Swagger / API Documentation:**
https://buildlab-ecommerce.onrender.com/api/docs

The Swagger interface provides an interactive way to view and test the available API endpoints.

**Production API Base URL:**
https://buildlab-ecommerce.onrender.com/api

**GitHub Repository:**
https://github.com/NafisatB/BuildLab-ecommerce

## Tech Stack

* **NestJS**
* **TypeScript**
* **Express** – HTTP platform used by NestJS
* **PostgreSQL**
* **Prisma ORM 7.9.1**
* **Swagger / OpenAPI**
* **class-validator**
* **class-transformer**
* **Docker**
* **Git & GitHub**
* **Render**

## Features

### Product Management

* Create products
* Retrieve all products
* Retrieve a single product
* Update products
* Delete products

### API Features

* Request validation
* Meaningful HTTP status codes
* Structured error handling
* Pagination
* Category filtering
* Product search
* PostgreSQL persistence
* Prisma migrations
* Swagger/OpenAPI documentation
* Production deployment

## Product Data Model

| Field         | Type     | Required | Description               |
| ------------- | -------- | -------- | ------------------------- |
| `id`          | UUID     | Yes      | Unique product identifier |
| `name`        | String   | Yes      | Product name              |
| `price`       | Decimal  | Yes      | Product price             |
| `description` | String   | No       | Product description       |
| `stock`       | Integer  | Yes      | Available stock quantity  |
| `category`    | String   | No       | Product category          |
| `imageUrl`    | String   | No       | Product image URL         |
| `createdAt`   | DateTime | Yes      | Creation timestamp        |
| `updatedAt`   | DateTime | Yes      | Last update timestamp     |

## Validation

The API validates incoming product data before processing requests.

Examples include:

* Product name is required.
* Product name cannot be empty.
* Price must be greater than zero.
* Stock quantity cannot be negative.
* Optional fields are validated when provided.
* Invalid request data returns `400 Bad Request`.
* Requests for non-existent products return `404 Not Found`.

## Project Structure

```text
src/
├── common/
│   └── filters/
│       └── exception.filter.ts
│
├── database/
│   ├── database.module.ts
│   └── database.service.ts
│
├── products/
│   ├── dto/
│   │   ├── create-product.dto.ts
│   │   └── update-product.dto.ts
│   ├── products.controller.ts
│   ├── products.module.ts
│   └── products.service.ts
│
├── app.module.ts
└── main.ts

prisma/
├── migrations/
└── schema.prisma
```

The project follows a modular NestJS architecture, separating controllers, business logic, validation, database access, and common error handling.

## Requirements

* Node.js 22+
* npm
* PostgreSQL
* Docker *(optional for running PostgreSQL locally)*

## Installation

Clone the repository:

```bash
git clone https://github.com/NafisatB/BuildLab-ecommerce.git
cd BuildLab-ecommerce/ecommerce-backend
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce"
PORT=3000
NODE_ENV=development
```

Do not commit `.env` files or database credentials to GitHub.

## Database Setup

Start PostgreSQL using Docker if required:

```bash
docker compose up -d
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

## Running the Application

Start the development server:

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3000
```

Swagger documentation:

```text
http://localhost:3000/api/docs
```

## API Endpoints

| Method   | Endpoint            | Description               |
| -------- | ------------------- | ------------------------- |
| `POST`   | `/api/products`     | Create a product          |
| `GET`    | `/api/products`     | Retrieve all products     |
| `GET`    | `/api/products/:id` | Retrieve a single product |
| `PATCH`  | `/api/products/:id` | Update a product          |
| `DELETE` | `/api/products/:id` | Delete a product          |

For complete request parameters, response schemas, and interactive testing, use the **Swagger documentation**.

## Testing

Run the test suite:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate test coverage:

```bash
npm run test:cov
```

## Deployment

The API is deployed to **Render** with PostgreSQL as the production database.

**Production Swagger:**
https://buildlab-ecommerce.onrender.com/api/docs

**Production API:**
https://buildlab-ecommerce.onrender.com/api

## Key Technical Decisions

### NestJS

NestJS was selected because it provides a modular architecture, dependency injection, structured application design, and features that will support the future authentication, authorization, order, and payment modules.

### PostgreSQL

PostgreSQL was selected as the relational database for reliable and persistent storage of e-commerce data.

### Prisma

Prisma was selected for type-safe database access, schema management, and database migrations.

### Swagger/OpenAPI

Swagger was used to provide interactive API documentation and simplify API testing.

### DTO Validation

`class-validator` and `class-transformer` are used to validate incoming request data before it reaches the business logic.

## Future Improvements

As the e-commerce platform develops, the following features will be added:

* User registration and authentication
* JWT-based authentication
* Role-based access control
* Administrator authorization
* Order management
* Payment simulation
* Order status tracking
* Automated unit and integration testing
* Improved logging and monitoring
* Rate limiting and additional security measures

## Relevant Links

* **GitHub Repository:**
  https://github.com/NafisatB/BuildLab-ecommerce

* **Swagger / Live Demo:**
  https://buildlab-ecommerce.onrender.com/api/docs

* **Live API:**
  https://buildlab-ecommerce.onrender.com/api

## Author

**Nafisat Babamusa**
