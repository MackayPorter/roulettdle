"use client";

import { Button, Flex, Text } from "@mantine/core";
import { signIn, signOut, useSession } from "next-auth/react";

function truncateEmail(email: string, max = 28): string {
  if (email.length <= max) return email;
  const at = email.indexOf("@");
  if (at <= 0) return `${email.slice(0, max - 1)}…`;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const budget = max - domain.length - 1;
  if (budget < 4) return `${email.slice(0, max - 1)}…`;
  return `${local.slice(0, budget)}…${domain}`;
}

export function AuthHeader() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Flex
        justify="flex-end"
        align="center"
        style={{
          position: "fixed",
          top: "var(--mantine-spacing-md)",
          right: "var(--mantine-spacing-md)",
          zIndex: 100,
        }}
      >
        <Text size="sm" c="gold.3" opacity={0.7}>
          …
        </Text>
      </Flex>
    );
  }

  if (!session?.user?.email) {
    return (
      <Flex
        justify="flex-end"
        align="center"
        style={{
          position: "fixed",
          top: "var(--mantine-spacing-md)",
          right: "var(--mantine-spacing-md)",
          zIndex: 100,
        }}
      >
        <Button
          size="compact-sm"
          variant="light"
          color="gold"
          onClick={() => void signIn("google")}
        >
          Sign in with Google
        </Button>
      </Flex>
    );
  }

  return (
    <Flex
      gap="sm"
      align="center"
      wrap="nowrap"
      style={{
        position: "fixed",
        top: "var(--mantine-spacing-md)",
        right: "var(--mantine-spacing-md)",
        zIndex: 100,
        maxWidth: "min(100vw - 2rem, 420px)",
      }}
    >
      <Text size="sm" c="gold.3" truncate title={session.user.email}>
        {truncateEmail(session.user.email)}
      </Text>
      <Button
        size="compact-sm"
        variant="subtle"
        color="gold"
        onClick={() => void signOut()}
      >
        Sign out
      </Button>
    </Flex>
  );
}
