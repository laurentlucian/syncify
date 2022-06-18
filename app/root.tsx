import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useCatch, useLoaderData } from '@remix-run/react';
import type { MetaFunction, LinksFunction, LoaderFunction } from '@remix-run/node';
import { VStack, Heading, ChakraProvider, Text } from '@chakra-ui/react';
import { withEmotionCache } from '@emotion/react';
import { ServerStyleContext, ClientStyleContext } from './lib/emotion/context';
import { useContext, useEffect } from 'react';
import { theme } from './lib/theme';
import Layout from './components/Layout';
import type { Session } from 'remix-auth-spotify';

import { spotifyStrategy } from '~/services/auth.server';
import { SpotifyClientProvider } from './hooks/useSpotifyClient';

export const loader: LoaderFunction = async ({ request }) => {
  return spotifyStrategy.getSession(request);
};

export default function App() {
  const data = useLoaderData<Session>();

  return (
    <Document>
      <ChakraProvider theme={theme}>
        <SpotifyClientProvider>
          <Layout user={data?.user}>
            <Outlet />
          </Layout>
        </SpotifyClientProvider>
      </ChakraProvider>
    </Document>
  );
}

export const ErrorBoundary = ({ error }: { error: Error }) => {
  console.error(error);
  return (
    <Document>
      <VStack h="100vh" justify="center">
        <Heading>There was an error</Heading>
        <Text>{error.message}</Text>
        <hr />
        <Text>Hey, developer, you should replace this with what you want your users to see.</Text>
      </VStack>
    </Document>
  );
};

export const CatchBoundary = () => {
  let caught = useCatch();
  let message;
  switch (caught.status) {
    case 401:
      message = <Text>Oops! Looks like you tried to visit a page that you do not have access to.</Text>;
      break;
    case 404:
      message = <Text>Oops! Looks like you tried to visit a page that does not exist.</Text>;
      break;

    default:
      throw new Error(caught.data || caught.statusText);
  }

  return (
    <Document>
      <VStack h="100vh" justify="center">
        <Heading>
          {caught.status}: {caught.statusText}
        </Heading>
        {message}
      </VStack>
    </Document>
  );
};

interface DocumentProps {
  children: React.ReactNode;
}

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Syncify',
  viewport: 'width=device-width,initial-scale=1',
});

export let links: LinksFunction = () => {
  return [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstaticom' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;600;700&display=swap',
    },
  ];
};

const Document = withEmotionCache(({ children }: DocumentProps, emotionCache) => {
  const serverSyleData = useContext(ServerStyleContext);
  const clientStyleData = useContext(ClientStyleContext);

  // Only executed on client
  useEffect(() => {
    // re-link sheet container
    emotionCache.sheet.container = document.head;
    // re-inject tags
    const tags = emotionCache.sheet.tags;
    emotionCache.sheet.flush();
    tags.forEach((tag) => {
      (emotionCache.sheet as any)._insertTag(tag);
    });
    // reset cache to reapply global styles
    clientStyleData?.reset();
  }, []);

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        {serverSyleData?.map(({ key, ids, css }) => (
          <style key={key} data-emotion={`${key} ${ids.join(' ')}`} dangerouslySetInnerHTML={{ __html: css }} />
        ))}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' ? <LiveReload /> : null}
      </body>
    </html>
  );
});
