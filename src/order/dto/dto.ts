import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from "class-validator";

export class CreateOrderItemDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'ID of the product to purchase'
    })
    @IsUUID()
    productId: string;

    @ApiProperty({
        example: 2,
        description: 'Number of units to purchase',
        minimum: 1
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto{
    @ApiProperty({
        type: [CreateOrderItemDto],
        example: [{
            productId: '550e8400-e29b-41d4-a716-446655440000',
            quantity: 2
        }]
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({each: true})
    @Type(()=> CreateOrderItemDto)
    items: CreateOrderItemDto[]
}
