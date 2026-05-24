import { prisma } from "./prisma";

const OWNER = {
  email: "shazebsaifi@gmail.com",
  name: "Shazeb Saifi",
} as const;

const NETWORK_NAME = "Cluster";

const SEED_CHANNELS: {
  name: string;
  messages: { id: string; text: string }[];
}[] = [
  {
    name: "welcome",
    messages: [
      { id: "welcome-1", text: "It's Shazeb here 👋" },
      {
        id: "welcome-2",
        text: "Welcome to Cluster. This is a global network created by me. Every new user gets connected to this network to explore Cluster.",
      },
      {
        id: "welcome-3",
        text: "If you like Cluster, please give it a star on GitHub. You can open the repo by clicking the GitHub icon in the top bar.",
      },
      { id: "welcome-4", text: "Have a nice day 😊" },
    ],
  },
  { name: "general", messages: [] },
  {
    name: "announcements",
    messages: [
      {
        id: "announcements-1",
        text: "All announcements related to Cluster will be posted here.",
      },
    ],
  },
];

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: OWNER.email },
    update: { name: OWNER.name, emailVerified: true },
    create: {
      name: OWNER.name,
      email: OWNER.email,
      emailVerified: true,
    },
  });

  let network = await prisma.network.findFirst({
    where: {
      ownerId: owner.id,
      name: NETWORK_NAME,
    },
    include: {
      channels: true,
    },
  });

  if (!network) {
    network = await prisma.network.create({
      data: {
        name: NETWORK_NAME,
        type: "PUBLIC",
        ownerId: owner.id,
        channels: {
          create: SEED_CHANNELS.map(({ name }) => ({ name })),
        },
      },
      include: {
        channels: true,
      },
    });
  } else {
    await prisma.channel.createMany({
      data: SEED_CHANNELS.map(({ name }) => ({
        name,
        networkId: network?.id as string,
      })),
      skipDuplicates: true,
    });

    network = await prisma.network.findUniqueOrThrow({
      where: { id: network.id },
      include: {
        channels: true,
      },
    });
  }

  await prisma.networkMembers.upsert({
    where: { userId_networkId: { userId: owner.id, networkId: network.id } },
    update: { role: "OWNER" },
    create: { userId: owner.id, networkId: network.id, role: "OWNER" },
  });

  const channelId = new Map(network.channels.map((c) => [c.name, c.id]));

  await prisma.message.createMany({
    data: SEED_CHANNELS.flatMap(({ name, messages }) =>
      messages.map(({ id, text }) => ({
        id: `${network.id}:${id}`,
        channelId:
          channelId.get(name) ??
          (() => {
            throw new Error(`Missing channel: ${name}`);
          })(),
        senderId: owner.id,
        message: text,
      }))
    ),
    skipDuplicates: true,
  });

  console.log({ ownerId: owner.id, networkId: network.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
