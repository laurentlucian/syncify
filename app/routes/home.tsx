import type { LoaderArgs } from '@remix-run/server-runtime';

import { Stack } from '@chakra-ui/react';

import { typedjson, useTypedLoaderData } from 'remix-typedjson';

import ActivityTile from '~/components/activity/ActivityTile';
import TilesPlayback from '~/components/tiles/TilesPlayback';
import useFollowing from '~/hooks/useFollowing';
import { getCacheControl } from '~/lib/utils';
import { getActivity } from '~/services/prisma/tracks.server';
import { getCurrentUserId } from '~/services/prisma/users.server';

const Home = () => {
  const following = useFollowing();
  const { activities } = useTypedLoaderData<typeof loader>();

  return (
    <Stack spacing={[2, 10]} px={['5px', 0]}>
      <TilesPlayback users={following} />
      {activities.map((activity, index) => (
        <ActivityTile key={index} activity={activity} />
      ))}
    </Stack>
  );
};

export const loader = async ({ request }: LoaderArgs) => {
  const currentUserId = await getCurrentUserId(request);
  const activities = await getActivity(currentUserId);

  return typedjson(
    {
      activities,
    },
    {
      headers: { ...getCacheControl() },
    },
  );
};

export default Home;

export { CatchBoundary } from '~/components/error/CatchBoundary';
export { ErrorBoundary } from '~/components/error/ErrorBoundary';
