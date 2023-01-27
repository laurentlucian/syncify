import type { Profile } from '@prisma/client';
import SpotifyWebApi from 'spotify-web-api-node';
import invariant from 'tiny-invariant';
import { getUser, updateToken } from './auth.server';
import { prisma } from './db.server';

if (!process.env.SPOTIFY_CLIENT_ID) {
  throw new Error('Missing SPOTIFY_CLIENT_ID env');
}

if (!process.env.SPOTIFY_CLIENT_SECRET) {
  throw new Error('Missing SPOTIFY_CLIENT_SECRET env');
}

if (!process.env.SPOTIFY_CALLBACK_URL) {
  throw new Error('Missing SPOTIFY_CALLBACK_URL env');
}

export const spotifyClient = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_CALLBACK_URL,
});

declare global {
  var __registeredSpotifyClients: Record<string, SpotifyWebApi> | undefined;
}

const registeredSpotifyClients =
  global.__registeredSpotifyClients || (global.__registeredSpotifyClients = {});

const createSpotifyClient = () => {
  return new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_CALLBACK_URL,
  });
};

export type SpotifyApiWithUser =
  | {
      spotify: null;
      user: null;
      token?: undefined;
    }
  | {
      spotify: SpotifyWebApi;
      user: Profile;
      token: string;
    };

export const spotifyApi = async (id: string): Promise<SpotifyApiWithUser> => {
  const data = await getUser(id);

  let spotifyClient: SpotifyWebApi;
  if (registeredSpotifyClients[id]) {
    spotifyClient = registeredSpotifyClients[id];
  } else {
    spotifyClient = createSpotifyClient();
    registeredSpotifyClients[id] = spotifyClient;
  }

  // @todo(type-fix) data.user should never be null if data exists
  if (!data || !data.user) return { spotify: null, user: null };
  spotifyClient.setAccessToken(data.accessToken);

  const now = new Date();
  const isExpired = new Date(data.expiresAt) < now;
  let newToken = data.accessToken;
  if (isExpired) {
    console.log('Access Token expired');
    spotifyClient.setRefreshToken(data.refreshToken);
    const { body } = await spotifyClient.refreshAccessToken();
    spotifyClient.setAccessToken(body.access_token);
    newToken = body.access_token;

    const expiresAt = Date.now() + body.expires_in * 1000;
    await updateToken(data.user.userId, body.access_token, expiresAt, body.refresh_token);
  }

  await spotifyClient.getMe().catch(async (e) => {
    if (e.statusCode === 403) {
      console.log('403 user would be deleted', id);

      // await prisma.queue.deleteMany({ where: { OR: [{ userId: id }, { ownerId: id }] } });
      // await prisma.likedSongs.deleteMany({ where: { userId: id } });
      // await prisma.recentSongs.deleteMany({ where: { userId: id } });
      // await prisma.recommendedSongs.deleteMany({
      //   where: { OR: [{ senderId: id }, { ownerId: id }] },
      // });
      // await prisma.aI.delete({ where: { userId: id } });
      // await prisma.settings.delete({ where: { userId: id } });
      // await prisma.profile.delete({ where: { userId: id } });
      // await prisma.user.delete({ where: { id } });
    }
  });

  return { spotify: spotifyClient, user: data.user, token: newToken };
};

export interface ContextObjectCustom extends Omit<SpotifyApi.ContextObject, 'type'> {
  name?: string;
  image?: string;
  description?: string;
  type: 'collection' | SpotifyApi.ContextObject['type'];
}

export interface CurrentlyPlayingObjectCustom
  extends Omit<SpotifyApi.CurrentlyPlayingObject, 'context'> {
  context: ContextObjectCustom | null;
}

export interface Playback {
  userId: string;
  currently_playing: CurrentlyPlayingObjectCustom | null;
  queue: SpotifyApi.TrackObjectFull[];
}

export const getUserQueue = async (id: string) => {
  const { token } = await spotifyApi(id);
  if (!token)
    return {
      currently_playing: null,
      queue: [],
    };

  const calls = [
    fetch('https://api.spotify.com/v1/me/player/queue', {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${token}` },
    }),
    // fetch('https://api.spotify.com/v1/me/player/devices', {
    //   headers: { Authorization: `Bearer ${token}` },
    // }),
  ];
  const [call1, call2] = await Promise.all(calls);

  const { queue } = await call1.json();
  const currently_playing = call2.status === 200 ? await call2.json() : null;
  // const [device] =
  //   call3.status === 200
  //     ? await call3.json().then((v) => {
  //         console.log('v', v);
  //         return v.devices.filter((d: any) => d.is_active === true);
  //       })
  //     : null;
  // currently_playing.device = device;

  if (currently_playing?.context) {
    switch (currently_playing.context.type) {
      case 'playlist':
        const res = await fetch(
          'https://api.spotify.com/v1/playlists/' +
            currently_playing.context.href.match(/playlists\/(.*)/)?.[1] ?? '',
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res || res.status !== 200) break;
        const playlist = await res.json();

        currently_playing.context.description = playlist.description;
        currently_playing.context.name = playlist.name;
        currently_playing.context.image = playlist.images[0].url;
        break;
      case 'collection':
        currently_playing.context.name = 'Liked Songs';
        currently_playing.context.image =
          'https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png';
        break;
    }
  }

  const isEpisode = currently_playing?.currently_playing_type === 'episode';
  const data = {
    userId: id,
    currently_playing: isEpisode ? null : currently_playing,
    queue: isEpisode ? [] : queue,
  };

  if (data) {
    return data as Playback;
  } else
    return {
      userId: id,
      currently_playing: null,
      queue: [],
    };
};

export const getUserLikedSongs = async (id: string) => {
  const { spotify } = await spotifyApi(id);
  if (!spotify) return [];

  const {
    body: { items },
  } = await spotify.getMySavedTracks();

  return items;
};

export const getUSerPlaylistSongs = async (id: string, playlistID: string) => {
  const { token } = await spotifyApi(id);
  invariant(token, 'missing token');

  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}/tracks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data;
};

export const getSavedStatus = async (id: string, trackId: string) => {
  const { token } = await spotifyApi(id);
  invariant(token, 'missing token');

  const response = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  return data;
};
