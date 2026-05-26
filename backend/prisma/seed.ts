import { prisma } from '../lib/prisma'

async function main() {
  // Use upsert to avoid conflicts if the seed is run multiple times
  // or if a real user already exists with these values
  await prisma.user.upsert({
    where: { clerk_id: 'user_sample_seed' },
    update: {},  // no-op if it already exists
    create: {
      clerk_id: 'user_sample_seed',
      email: 'sample-seed@devleap.ai',
      tier: 'Pro Broker',
      profiles: {
        create: {
          github_username: 'octocat',
          skills_json: JSON.stringify([
            { name: "TypeScript", level: "Expert", context: "Full-stack web development" },
            { name: "React", level: "Expert", context: "Frontend frameworks and component architecture" }
          ]),
          architecture_json: '[]',
          summary_json: JSON.stringify({ pitch: "Experienced full-stack developer.", key_features: ["TypeScript", "React"] })
        }
      }
    }
  })
  console.log('Seeded database!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
