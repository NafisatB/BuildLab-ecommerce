import { ApiProperty, ApiPropertyOptional, } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, MaxLength, Min, MinLength } from "class-validator";

export class CreateProductDto{
    @ApiProperty({
        example: 'Wireless Bluetooth Headphones',
        description: 'Name of the product',
        minLength: 2,
        maxLength: 150,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(150)
    name!: string;

    @ApiProperty({
        example: 49999.99,
        description: 'Product price. Must be greater than zero',
        minimum: 0.01
    })
    @Type(()=> Number)
    @IsNumber({maxDecimalPlaces: 2}, {message: 'Price must be valid number with at most 2 decimal place'})
    @Min(0.01, {message: 'Price must be greater than zero'})
    price!: number;

    @ApiPropertyOptional({
    example: 'Premium wireless headphones with noise cancellation.',
    description: 'Optional product description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({
    example: 25,
    description: 'Available stock quantity. Cannot be negative.',
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 0 },
    {
      message: 'Stock must be a whole number',
    },
  )
  @Min(0, {
    message: 'Stock cannot be negative',
  })
  stock!: number;

  @ApiPropertyOptional({
    example: 'Electronics',
    description: 'Optional product category',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/headphones.jpg',
    description: 'Optional product image URL',
  })
  @IsOptional()
  @IsUrl({},{message: 'imageUrl must be a valid URL'})
  imageUrl?: string;
}