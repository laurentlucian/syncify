import { useFetcher, useSearchParams } from '@remix-run/react';
import { useState, useEffect } from 'react';

import type { Track } from '@prisma/client';

import useSessionUser from './useSessionUser';

export const useSearch = () => {
  const [searchParams] = useSearchParams();
  const searchDefault = searchParams.get('spotify');
  const [search, setSearch] = useState<string>(searchDefault || '');
  const [tracks, setTracks] = useState<Track[]>([]);

  const { data, load } = useFetcher();

  const currentUser = useSessionUser();
  const id = currentUser?.userId || 'daniel.valdecantos';

  useEffect(() => {
    const delaySubmit = setTimeout(() => {
      if (search.trim().length > 0) {
        load(`/${id}/search?spotify=${search}`);
      }
    }, 1000);

    return () => clearTimeout(delaySubmit);
  }, [search, load, id]);

  useEffect(() => {
    if (data) {
      setTracks(
        data.results.tracks.items.map((track: SpotifyApi.TrackObjectFull) => ({
          albumName: track.album.name,
          albumUri: track.album.uri,
          artist: track.album.artists[0].name,
          artistUri: track.artists[0].uri,
          explicit: track.explicit,
          id: track.id,
          image: track.album.images[0].url,
          link: track.external_urls.spotify,
          name: track.name,
          preview_url: track.preview_url,
          uri: track.uri,
        })),
      );
    }
  }, [data]);

  return { data, search, setSearch, setTracks, tracks };
};
