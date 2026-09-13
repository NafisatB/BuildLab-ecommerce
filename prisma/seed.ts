import 'dotenv/config';
import { PrismaClient, UserRole } from "generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is not configured')
}

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminFirstName = process.env.ADMIN_FIRST_NAME;
const adminLastName = process.env.ADMIN_LAST_NAME;

if (!adminEmail?.trim() || !adminPassword || !adminFirstName?.trim() || !adminLastName?.trim()) {
    throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME and ADMIN_LAST_NAME must be configured')
}

const email = adminEmail.trim().toLowerCase();
const password = adminPassword;
const firstName = adminFirstName.trim();
const lastName = adminLastName.trim()

const adapter = new PrismaPg({
    connectionString
});

const prisma = new PrismaClient({
    adapter
});

async function main() {

    const existingAdmin = await prisma.user.findUnique({
        where: { email }
    });

    if (existingAdmin) {
        if (existingAdmin.role !== UserRole.ADMIN) {
            throw new Error(`User ${email} already exists but is not an ADMIN`)
        }

        console.log(`Admin already exists: ${email}`)
        return;
    }

    const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1
    });

    const admin = await prisma.user.create({
        data: {
            email,
            password: passwordHash,
            firstName,
            lastName,
            role: UserRole.ADMIN
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            role: true,
            createdAt: true
        }
    })
    console.log('Initial administrator created')
    console.log(admin)

}
main().catch((error) => {
    console.error('Admin seed failed:', error)
    process.exit(1)
})
    .finally(async () => {
        await prisma.$disconnect()
    })




