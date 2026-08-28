# E-Commerce Backend

## Project Overview

Backend API for an e-commerce platform developed using
NestJS, PostgreSQL, Prisma and Swagger.

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma
- Swagger/OpenAPI
- Docker
- class-validator

## Features

- Product creation
- Product listing
- Product retrieval
- Product updating
- Product deletion
- Input validation
- Pagination
- Category filtering
- Product search
- Swagger documentation

## Requirements

- Node.js 22+
- npm
- Docker
- PostgreSQL

## Installation

npm install

## Environment Variables

- DATABASE_URL=
- PORT=
- NODE_ENV=

## Database Setup

docker compose up -d

npx prisma migrate dev

npx prisma generate

## Running the Application

npm run start:dev


## API Documentation

Interactive Swagger/OpenAPI documentation:

https://buildlab-ecommerce.onrender.com/api/docs

## Live API

Base URL:

https://buildlab-ecommerce.onrender.com/api

## API Endpoints

- POST /api/products
- GET /api/products
- GET /api/products/:id
- PATCH /api/products/:id
- DELETE /api/products/:id

## Testing

npm run test

## Author

Nafisat Babamusa