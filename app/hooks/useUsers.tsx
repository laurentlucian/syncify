import { useTypedRouteLoaderData } from 'remix-typedjson';

import type { loader } from '~/root';

import useFriends from './useFollowing';
import useCurrentUser from './useCurrentUser';

const useUsers = () => useTypedRouteLoaderData<typeof loader>('root')?.users ?? [];

export const useQueueableUsers = () => {
  return useTypedRouteLoaderData<typeof loader>('root')?.queueableUsers ?? [];
};

export const useRestOfUsers = () => {
  const users = useUsers();
  const friends = useFriends();
  const currentUser = useCurrentUser();

  const restOfUsers = users
    .filter((user) => {
      const isFriend = friends.some((friend) => friend.userId === user.userId);

      return !isFriend;
    })
    .sort((user, prevUser) => {
      if (user.playback === null && prevUser.playback !== null) return 0;
      return currentUser?.favorite?.some(({ favoriteId }) => favoriteId === user.userId) ? -1 : 1;
    });
  return restOfUsers;
};

export default useUsers;
