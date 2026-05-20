"use client";

import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState, startTransition } from "react";

import { AuthHeader } from "@/components/AuthHeader";
import { hasFinishedToday, markLostToday } from "@/lib/dailyPlayCache";

function playerKeyFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

const SPIN_DURATION_MS = 800;

type ScoreRow = {
  player_key: string;
  play_date_utc: string;
  score: number;
  display_name: string | null;
  created_at: string;
  Lost?: boolean;
};

function rowKey(row: ScoreRow): string {
  return `${row.player_key}-${row.play_date_utc}`;
}

function rowLabel(row: ScoreRow): string {
  const name = row.display_name?.trim();
  if (name) return name;
  return row.player_key;
}

type AllTimeHigh = {
  player_key: string;
  score: number;
};

type LeaderboardPanelProps = {
  leaderboard: ScoreRow[];
  allTimeHigh: AllTimeHigh | null;
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  /** Stretch to parent height (play card height on desktop / square on mobile). */
  fillHeight?: boolean;
};

function LeaderboardPanel({
  leaderboard,
  allTimeHigh,
  leaderboardLoading,
  leaderboardError,
  fillHeight = false,
}: LeaderboardPanelProps) {
  return (
    <Card
      w="100%"
      h={fillHeight ? "100%" : undefined}
      miw={0}
      shadow="sm"
      padding="lg"
      radius="md"
      style={{
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        ...(fillHeight
          ? { flex: 1, minHeight: 0 }
          : { minHeight: 320 }),
      }}
    >
      <Stack gap={4}>
        <Title order={2} fz="1.15rem" fw={800} tt="uppercase" c="gold">
          Leaderboard
        </Title>

      </Stack>

      <ScrollArea
        type="auto"
        scrollbars="y"
        offsetScrollbars="present"
        scrollbarSize={12}
        mt="md"
        flex={fillHeight ? 1 : undefined}
        style={fillHeight ? { flex: 1, minHeight: 0 } : undefined}
        styles={{
          root: {
            marginRight: "calc(-1 * var(--mantine-spacing-lg))",
            width: "calc(100% + var(--mantine-spacing-lg))",
          },
          viewport: {
            paddingRight: "var(--mantine-spacing-xl)",
          },
        }}
      >
        {leaderboardLoading ? (
          <Flex justify="center" align="center" py="xl">
            <Loader color="white" size="sm" />
          </Flex>
        ) : leaderboardError ? (
          <Text size="sm" c="white">
            {leaderboardError}
          </Text>
        ) : leaderboard.length === 0 ? (
          <Text
            size="sm"
            c="white"
            ta="center"
            py="xl"
            px="sm"
            opacity={0.88}
            lh={1.6}
          >
            No scores yet today.
            <br />
            Be the first.
          </Text>
        ) : (
          <Stack gap="xs">
            {leaderboard.map((row, i) => (
              <Flex
                key={rowKey(row)}
                justify="space-between"
                align="center"
                gap="md"
                pl="sm"
                pr="md"
                py={10}
                wrap="nowrap"
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  background: "rgba(0, 0, 0, 0.14)",
                }}
              >
                <Flex align="center" gap="sm" miw={0} flex={1}>
                  <Text
                    fw={800}
                    c="gold.3"
                    fz="sm"
                    w={28}
                    ta="center"
                    ff="monospace"
                  >
                    {i + 1}
                  </Text>
                  <Text
                    size="sm"
                    truncate
                    c="white"
                    title={row.player_key}
                  >
                    {rowLabel(row)}
                  </Text>
                </Flex>
                <Text
                  fw={700}
                  c="gold.3"
                  fz="sm"
                  mr="sm"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {row.score.toLocaleString()}
                </Text>
              </Flex>
            ))}
          </Stack>
        )}
      </ScrollArea>

      <Box
        mt="md"
        pt="md"
        style={{ borderTop: "1px solid rgba(255, 255, 255, 0.12)" }}
      >
        <Text size="xs" fw={800} tt="uppercase" c="gold.3" mb="xs">
          Top score ever
        </Text>
        {leaderboardLoading ? (
          <Loader color="white" size="xs" />
        ) : allTimeHigh ? (
          <Flex justify="space-between" align="center" gap="md" wrap="nowrap">
            <Text
              size="sm"
              truncate
              c="white"
              miw={0}
              flex={1}
              title={allTimeHigh.player_key}
            >
              {allTimeHigh.player_key}
            </Text>
            <Text
              fw={700}
              c="gold.3"
              fz="sm"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {allTimeHigh.score.toLocaleString()}
            </Text>
          </Flex>
        ) : (
          <Text size="sm" c="white" opacity={0.88}>
            No record yet.
          </Text>
        )}
      </Box>
    </Card>
  );
}

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const playerKey = playerKeyFromEmail(session?.user?.email);
  const signedIn = sessionStatus === "authenticated" && Boolean(playerKey);

  const [coins, setCoins] = useState(100);
  const [topWinnings, setTopWinnings] = useState(coins);
  const [gameEnded, setGameEnded] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<"W" | "L" | null>(null);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [leaderboard, setLeaderboard] = useState<ScoreRow[]>([]);
  const [allTimeHigh, setAllTimeHigh] = useState<AllTimeHigh | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);
  const [doneForDay, setDoneForDay] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const res = await fetch("/api/scores");
      const data: unknown = await res.json();
      if (!res.ok || !data || typeof data !== "object") {
        const msg =
          data &&
            typeof data === "object" &&
            "message" in data &&
            typeof (data as { message: unknown }).message === "string"
            ? (data as { message: string }).message
            : "Could not load leaderboard";
        setLeaderboardError(msg);
        setLeaderboard([]);
        setAllTimeHigh(null);
        return;
      }
      const o = data as {
        playDateUtc?: unknown;
        scores?: unknown;
        allTimeHigh?: unknown;
      };
      setLeaderboard(Array.isArray(o.scores) ? (o.scores as ScoreRow[]) : []);
      const ath = o.allTimeHigh;
      if (
        ath &&
        typeof ath === "object" &&
        "player_key" in ath &&
        typeof (ath as AllTimeHigh).player_key === "string" &&
        "score" in ath &&
        typeof (ath as AllTimeHigh).score === "number"
      ) {
        setAllTimeHigh(ath as AllTimeHigh);
      } else {
        setAllTimeHigh(null);
      }
    } catch {
      setLeaderboardError("Could not load leaderboard");
      setLeaderboard([]);
      setAllTimeHigh(null);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void loadLeaderboard();
    });
  }, [loadLeaderboard]);

  useEffect(() => {
    if (leaderboardLoading || sessionStatus === "loading") return;

    const row = playerKey
      ? leaderboard.find((r) => r.player_key === playerKey)
      : undefined;
    const finished =
      (signedIn && hasFinishedToday(playerKey)) || row?.Lost === true;

    startTransition(() => {
      if (finished) {
        if (row?.Lost && playerKey) markLostToday(playerKey);
        setDoneForDay(true);
        if (row) {
          setCoins(row.score);
          setTopWinnings(row.score);
        }
        return;
      }
      const score = row?.score ?? 100;
      setCoins(score);
      setTopWinnings(score);
      setDoneForDay(false);
    });
  }, [leaderboard, leaderboardLoading, playerKey, sessionStatus, signedIn]);

  function endGame() {
    setGameEnded(true);
  }

  async function performSpin(): Promise<void> {
    if (!signedIn) return;

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json().catch(() => null)) as {
        message?: string;
        result?: string;
        score?: number;
        lost?: boolean;
        context?: string;
        code?: string;
        details?: string;
        hint?: string;
        debug?: unknown;
      } | null;

      if (res.status === 401) {
        setSubmissionNotice("Sign in to spin.");
        return;
      }

      if (res.status === 409) {
        if (playerKey) markLostToday(playerKey);
        setDoneForDay(true);
        setSubmissionNotice("Already played today.");
        return;
      }

      if (
        !res.ok ||
        (data?.result !== "W" && data?.result !== "L") ||
        typeof data.score !== "number"
      ) {
        console.error("[spin] failed", res.status, data);
        const detail =
          data && typeof data === "object" && "details" in data
            ? String((data as { details?: string }).details)
            : null;
        const hint =
          data && typeof data === "object" && "hint" in data
            ? String((data as { hint?: string }).hint)
            : null;
        const parts = [data?.message ?? "Spin failed", detail, hint].filter(
          Boolean,
        );
        setSubmissionNotice(parts.join(" — "));
        return;
      }

      const nextScore = data.score;
      setCoins(nextScore);
      setTopWinnings((prev) => Math.max(prev, nextScore));
      setLastResult(data.result);

      if (data.lost) {
        if (playerKey) markLostToday(playerKey);
        setDoneForDay(true);
        endGame();
      }

      await loadLeaderboard();
    } catch (e) {
      console.error("[spin] network error", e);
      setSubmissionNotice("Spin failed — check console");
    }
  }

  function handleSpinClick() {
    if (!signedIn || spinning || doneForDay || gameEnded) return;

    if (spinTimerRef.current) {
      clearTimeout(spinTimerRef.current);
    }

    setSpinning(true);
    setLastResult(null);
    setSubmissionNotice(null);

    spinTimerRef.current = setTimeout(() => {
      void (async () => {
        await performSpin();
        setSpinning(false);
        spinTimerRef.current = null;
      })();
    }, SPIN_DURATION_MS);
  }

  return (
    <>
      <main
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(180deg, #061a10 0%, var(--background) 38%, var(--background) 100%)",
        }}
      >
        <AuthHeader />
        <Container size="sm" py="xl">
          <Stack align="center" gap="lg" pt="xl">
            <Title
              order={1}
              fz="3.5rem"
              fw={900}
              tt="uppercase"
              c="gold.3"
              style={{ letterSpacing: "0.08em" }}
            >
              Roulettdle
            </Title>

            <Box className="w-full mx-auto relative" style={{ maxWidth: 600 }}>
              <Card
                w="100%"
                maw={600}
                miw={0}
                shadow="sm"
                padding="lg"
                radius="md"
                style={{ aspectRatio: 1, position: "relative" }}
              >
                <Stack h="100%" justify="space-between" align="center">
                  <Text ta="center" fz="2rem" fw={800} c="gold.3">
                    {coins}
                  </Text>

                  <Box
                    mx="auto"
                    style={{
                      position: "relative",
                      width: "15rem",
                      height: "15rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      className={spinning ? "spin-once" : undefined}
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "9999px",
                        border: "12px dashed var(--foreground)",
                        opacity: 0.9,
                        pointerEvents: "none",
                      }}
                    />
                    {!spinning && lastResult ? (
                      <Text
                        fz="2.75rem"
                        fw={900}
                        c={lastResult === "W" ? "felt.4" : "red.6"}
                        ta="center"
                        style={{ position: "relative", zIndex: 1, lineHeight: 1 }}
                      >
                        {lastResult}
                      </Text>
                    ) : null}
                  </Box>

                  <Button
                    size="md"
                    disabled={!signedIn || spinning || doneForDay || gameEnded}
                    onClick={handleSpinClick}
                  >
                    {!signedIn
                      ? "Sign in to spin"
                      : doneForDay
                        ? "Played today"
                        : spinning
                          ? "Spinning…"
                          : "Spin"}
                  </Button>
                </Stack>

                <Text
                  ta="right"
                  size="sm"
                  c="gold.3"
                  style={{
                    position: "absolute",
                    bottom: "var(--mantine-spacing-lg)",
                    right: "var(--mantine-spacing-lg)",
                  }}
                >
                  Top winnings: {topWinnings}
                </Text>
              </Card>

              <Box
                className="hidden lg:flex"
                style={{
                  position: "absolute",
                  left: "100%",
                  top: 0,
                  bottom: 0,
                  marginLeft: "var(--mantine-spacing-xl)",
                  width: 340,
                  zIndex: 1,
                  flexDirection: "column",
                }}
              >
                <LeaderboardPanel
                  fillHeight
                  leaderboard={leaderboard}
                  allTimeHigh={allTimeHigh}
                  leaderboardLoading={leaderboardLoading}
                  leaderboardError={leaderboardError}
                />
              </Box>
            </Box>

            <Box
              className="lg:hidden w-full mx-auto flex flex-col"
              style={{ maxWidth: 600, aspectRatio: 1 }}
              mt="lg"
            >
              <LeaderboardPanel
                fillHeight
                leaderboard={leaderboard}
                allTimeHigh={allTimeHigh}
                leaderboardLoading={leaderboardLoading}
                leaderboardError={leaderboardError}
              />
            </Box>

            <Text size="xl" c="felt.3" ta="center" opacity={0.92}>
              See the most money you can get
            </Text>
          </Stack>
        </Container>
      </main>
      <Modal
        opened={gameEnded}
        onClose={() => {
          setGameEnded(false);
          setSubmissionNotice(null);
        }}
        title="Game over"
        centered
      >
        <Text>
          You reached{" "}
          <Text component="span" c="gold.3" fw={700} inherit>
            {topWinnings}
          </Text>{" "}
          coins.
        </Text>
        {submissionNotice ? (
          <Text size="sm" c="red.4" mt="xs">
            {submissionNotice}
          </Text>
        ) : null}
        <Box mt="md" style={{ display: "flex", justifyContent: "center" }}>
          <Button
            mt="md"
            onClick={() => {
              setGameEnded(false);
              setSubmissionNotice(null);
            }}
          >
            Ok
          </Button>
        </Box>
      </Modal>
    </>
  );
}
