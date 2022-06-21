import {
  Avatar,
  AvatarGroup,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Progress,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import type { Party, Profile } from '@prisma/client';
import { Form } from '@remix-run/react';
import { Stop } from 'iconsax-react';
import listen_width from '~/assets/listen-with.svg';
import spotify_icon_white from '~/assets/spotify-icon-white.png';
import spotify_icon_black from '~/assets/spotify-icon-black.png';

type Type = {
  id: string;
  name: string | undefined;
  artist: string;
  image: string;
  device: string;
  progress: number;
  type: 'track' | 'episode' | undefined;

  currentUser: Profile | null;
  party: Party[];

  active: boolean;
};

const Player = ({
  id,
  name,
  artist,
  image,
  device,
  progress,
  currentUser,
  party,
  active,
}: Type) => {
  const bg = useColorModeValue('music.50', 'music.900');
  const color = useColorModeValue('music.900', 'music.50');
  const spotify_icon = useColorModeValue(spotify_icon_black, spotify_icon_white);
  const currentParty = party.find((e) => e.userId !== currentUser?.userId);

  return (
    <Stack w={[363, '100%']} bg={bg} spacing={0} borderRadius={5}>
      <HStack h="112px" spacing={2} px="2px" py="2px" justify="space-between">
        <Stack pl="7px" spacing={2} h="100%" flexGrow={1}>
          <Flex direction="column">
            <Text noOfLines={[1]}>{name}</Text>
            <Text opacity={0.8} fontSize="13px">
              {artist}
            </Text>
            <Text fontSize="14px" fontWeight="semibold">
              {device}
            </Text>
          </Flex>

          {/* letting owner join own party for testing */}
          {currentUser && active && (
            <HStack>
              <Form
                action={currentParty ? `/party/leave/${id}` : `/party/join/${id}`}
                method="post"
              >
                {currentParty ? (
                  <IconButton
                    aria-label="Leave"
                    icon={<Stop size="24px" />}
                    variant="ghost"
                    type="submit"
                    cursor="pointer"
                  />
                ) : (
                  <Button px={0} variant="ghost" type="submit">
                    <Image boxSize="24px" src={listen_width} />
                  </Button>
                )}
              </Form>
              <AvatarGroup size="xs" spacing={-2} max={5}>
                {party.map((v) => {
                  return <Avatar key={v.userId} name={v.userName} src={v.userImage} />;
                })}
              </AvatarGroup>
              <Image boxSize="22px" src={spotify_icon} />
            </HStack>
          )}
        </Stack>
        <Image src={image} m={0} boxSize={108} borderRadius={2} />
      </HStack>
      <Progress
        sx={{
          backgroundColor: bg,
          '> div': {
            backgroundColor: color,
          },
        }}
        borderBottomLeftRadius={2}
        borderBottomRightRadius={2}
        h="2px"
        value={progress}
      />
    </Stack>
  );
};
export default Player;
