import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { ROLES_KEY } from "src/common/roles.decorator";
import type { AuthenticatedRequest } from "../types/authenticated-request";

@Injectable()
export class RolesGuard implements CanActivate{
    constructor(private readonly reflector: Reflector){}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY, [context.getHandler(), context.getClass()]
        );

        if(!requiredRoles || requiredRoles.length === 0){
            return true;
        }

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const user = request.user;

        if(!user){
            throw new ForbiddenException('User authentication is required')
        }

        const hasRequiredRole = requiredRoles.includes(user.role);

        if(!hasRequiredRole){
            throw new ForbiddenException('You do not have permission to access this resource')
        }
        return true;
    }
}