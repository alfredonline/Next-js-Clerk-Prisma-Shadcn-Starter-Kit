import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    const clerkId = evt.data.id
    const eventType = evt.type

    // Handle user.created and user.updated events
    if (eventType === 'user.created' || eventType === 'user.updated') {
      if (!clerkId) {
        console.error('No Clerk user ID found in webhook payload')
        return new Response('No Clerk user ID found', { status: 400 })
      }

      const userData = evt.data

      // Extract email from primary email address
      const primaryEmail = userData.email_addresses?.find(
        (email: { id: string; email_address: string }) => email.id === userData.primary_email_address_id
      ) || userData.email_addresses?.[0]

      const emailAddress = primaryEmail?.email_address

      if (!emailAddress) {
        console.error('No email address found in webhook payload')
        return new Response('No email address found', { status: 400 })
      }

      // Extract name from first_name and last_name
      const firstName = userData.first_name || ''
      const lastName = userData.last_name || ''
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || null

      // Upsert user in database (create or update)
      await prisma.user.upsert({
        where: { clerkId },
        update: {
          email: emailAddress,
          name: fullName,
        },
        create: {
          clerkId,
          email: emailAddress,
          name: fullName,
        },
      })

      console.log(`Successfully synced user ${clerkId} (${eventType})`)
    }

    // Handle user.deleted event
    if (eventType === 'user.deleted') {
      if (!clerkId) {
        console.error('No Clerk user ID found in webhook payload')
        return new Response('No Clerk user ID found', { status: 400 })
      }

      // Find the user first to get their database ID
      const user = await prisma.user.findUnique({
        where: { clerkId },
      })

      if (!user) {
        console.log(`User with clerkId ${clerkId} not found in database, skipping deletion`)
        return new Response('User not found', { status: 200 })
      }

      // Delete user and all related records in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete all images associated with the user
        await tx.image.deleteMany({
          where: { userId: user.id },
        })

        // Delete all credits associated with the user
        await tx.credit.deleteMany({
          where: { userId: user.id },
        })

        // Finally, delete the user
        await tx.user.delete({
          where: { id: user.id },
        })
      })

      console.log(`Successfully deleted user ${clerkId} and all related records`)
    }

    return new Response('Webhook received', { status: 200 })
  } catch (err) {
    console.error('Error processing webhook:', err)
    return new Response('Error processing webhook', { status: 400 })
  }
}