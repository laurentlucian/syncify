import { useParams } from '@remix-run/react';
import { useState, useCallback } from 'react';

import { Stack } from '@chakra-ui/react';

import type { RecentSongs, Track } from '@prisma/client';

import ExpandedSongs from '../profile/ExpandedSongs';
import Tile from '../Tile';
import Card from './Card';
import Tiles from './Tiles';

const RecentTracksPrisma = ({
  recent,
}: {
  recent: (RecentSongs & {
    track: Track & {};
  })[];
}) => {
  const [show, setShow] = useState(false);
  const scrollButtons = recent.length > 5;
  const { id } = useParams();

  const onClose = useCallback(() => {
    setShow(false);
  }, [setShow]);
  const title = 'Recent';

  if (!recent.length) return null;

  return (
    <Stack spacing={3}>
      <Tiles title={title} scrollButtons={scrollButtons} setShow={setShow}>
        {recent.map(({ track }, index) => {
          return <Tile key={index} track={track} profileId={id ?? ''} />;
        })}
      </Tiles>
      <ExpandedSongs title={title} show={show} onClose={onClose}>
        {recent.map(({ track }, index) => {
          return <Card key={index} track={track} userId={id ?? ''} />;
        })}
      </ExpandedSongs>
    </Stack>
  );
};

export default RecentTracksPrisma;
