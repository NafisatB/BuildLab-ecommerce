import {Injectable, NotFoundException} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createProductDto: CreateProductDto) {
      return await this.prisma.product.create({
        data: {
          name: createProductDto.name.trim(),
          price: new Prisma.Decimal(createProductDto.price),
          description: createProductDto.description?.trim(),
          stock: createProductDto.stock,
          category: createProductDto.category?.trim(),
          imageUrl: createProductDto.imageUrl,
        },
      });
  }

  async findAll(query: QueryProductDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (query.category) {
      where.category = {
        equals: query.category,
        mode: 'insensitive',
      };
    }

    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({
        where,
      }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: {id},
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: {id},
      data: {
        ...(updateProductDto.name !== undefined && {
          name: updateProductDto.name.trim(),
        }),

        ...(updateProductDto.price !== undefined && {
          price: new Prisma.Decimal(updateProductDto.price),
        }),

        ...(updateProductDto.description !== undefined && {
          description: updateProductDto.description?.trim(),
        }),

        ...(updateProductDto.stock !== undefined && {
          stock: updateProductDto.stock,
        }),

        ...(updateProductDto.category !== undefined && {
          category: updateProductDto.category?.trim(),
        }),

        ...(updateProductDto.imageUrl !== undefined && {
          imageUrl: updateProductDto.imageUrl,
        }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.product.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Product deleted successfully',
    };
  }
}