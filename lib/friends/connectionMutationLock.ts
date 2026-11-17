let connectionMutationQueue = Promise.resolve();

/**
 * Serializes read-check-write mutations for the JSON friend store in this
 * server process. This prevents concurrent requests handled by the same
 * process from both passing the 50-friend check before either write finishes.
 */
export async function acquireFriendConnectionMutationLock() {
  const previousMutation = connectionMutationQueue;
  let releaseCurrentMutation: () => void = () => undefined;

  connectionMutationQueue = new Promise<void>((resolve) => {
    releaseCurrentMutation = () => resolve();
  });

  await previousMutation;
  return releaseCurrentMutation;
}
