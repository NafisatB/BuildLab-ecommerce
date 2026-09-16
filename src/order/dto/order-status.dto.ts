import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { OrderStatus } from "generated/prisma/enums";

export class UpdatedOrderStatusDto{
    @ApiProperty({
        enum: OrderStatus,
        example: OrderStatus.PROCESSING,
        description: 'Status transitions are validated by the server'
    })
    @IsEnum(OrderStatus)
    @IsNotEmpty()
    status!: OrderStatus
}