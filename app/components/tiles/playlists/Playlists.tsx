import { Stack } from '@chakra-ui/react';

import { usePlaylists } from '~/hooks/usePlaylist';

import Tiles from '../Tiles';
import PlaylistDrawer from './PlaylistDrawer';
import PlaylistTile from './PlaylistTile';

const Playlists = ({
  playlists: initialPlaylists,
}: {
  playlists: SpotifyApi.PlaylistObjectSimplified[];
}) => {
  const { playlists, setRef } = usePlaylists(initialPlaylists);

  if (!playlists) return null;
  const scrollButtons = playlists.length > 5;
  const title = playlists.length > 1 ? 'PLAYLISTS' : 'PLAYLIST';

  if (!playlists.length) return null;

  return (
    <Stack spacing={1}>
      <Tiles title={title} scrollButtons={scrollButtons}>
        {playlists.map((list, index) => {
          const isLast = index === playlists.length - 1;
          if (list.tracks.total === 0) return null;
          return (
            <PlaylistTile
              ref={(node) => {
                isLast && setRef(node);
              }}
              key={list.id}
              playlist={list}
            />
          );
        })}
      </Tiles>
      <PlaylistDrawer />
    </Stack>
  );
};

export default Playlists;
