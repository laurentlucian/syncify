import { useCallback, useState } from 'react';

import { Box, SimpleGrid, Stack } from '@chakra-ui/react';

import { usePlaylists } from '~/hooks/usePlaylist';

import PlaylistDrawer from '../playlists/PlaylistDrawer';
import PlaylistTile from '../playlists/PlaylistTile';
import { default as ExpandedPlayLists } from '../profile/ExpandedSongs';
import PlaylistCard from './PlaylistCard';
import Tiles from './Tiles';

const Playlists = ({
  playlists: initialPlaylists,
}: {
  playlists: SpotifyApi.PlaylistObjectSimplified[];
}) => {
  const { playlists, setRef, setShow, show } = usePlaylists(initialPlaylists);
  const [layout, setLayout] = useState(true);

  const onClose = useCallback(() => {
    setShow(false);
  }, [setShow]);

  if (!playlists) return null;
  const scrollButtons = playlists.length > 5;
  const title = playlists.length > 1 ? 'Playlists' : 'Playlist';

  if (!playlists.length) return null;

  return (
    <Stack spacing={3}>
      <Tiles title={title} scrollButtons={scrollButtons} setShow={setShow}>
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
      {scrollButtons && (
        <ExpandedPlayLists
          title={title}
          show={show}
          onClose={onClose}
          setLayout={setLayout}
          layout={layout}
        >
          {layout ? (
            <SimpleGrid
              minChildWidth={['115px', '100px']}
              spacing="10px"
              w={{ base: '100vw', md: '750px', sm: '450px', xl: '1100px' }}
            >
              {playlists.map((list, index) => {
                const isLast = index === playlists.length - 1;
                if (list.tracks.total === 0) return null;
                return (
                  <Box key={index}>
                    <PlaylistTile
                      ref={(node) => {
                        isLast && setRef(node);
                      }}
                      key={list.id}
                      playlist={list}
                    />
                  </Box>
                );
              })}
            </SimpleGrid>
          ) : (
            playlists.map((list, index) => {
              const isLast = index === playlists.length - 1;
              return (
                <PlaylistCard
                  ref={(node) => {
                    isLast && setRef(node);
                  }}
                  key={list.id}
                  playlist={list}
                />
              );
            })
          )}
        </ExpandedPlayLists>
      )}
      <PlaylistDrawer />
    </Stack>
  );
};

export default Playlists;
