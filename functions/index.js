const crypto = require("crypto");
const { setGlobalOptions } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const {
  FieldValue,
  getFirestore,
  Timestamp
} = require("firebase-admin/firestore");

initializeApp();

setGlobalOptions({
  region: "us-central1",
  maxInstances: 3
});

const SPOTIFY_CLIENT_ID =
  "8085086b764d44d5bafbcaf222b76c13";

const PLAYLIST_ID =
  "6tbcUkbr5lvA3L3pwxZy3f";

const REDIRECT_URI =
  "https://nosotros-61129.web.app/spotify-callback.html";

const SPOTIFY_CLIENT_SECRET =
  defineSecret("SPOTIFY_CLIENT_SECRET");

const db = getFirestore();

function callbackCors(response) {
  response.set(
    "Access-Control-Allow-Origin",
    "https://nosotros-61129.web.app"
  );

  response.set(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );
}

async function requestSpotifyToken(params) {
  const credentials = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET.value()}`
  ).toString("base64");

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(params)
    }
  );

  if (!response.ok) {
    throw new Error(
      `Spotify respondió ${response.status}.`
    );
  }

  return response.json();
}

async function getAccessToken() {
  const integration = await db
    .collection("privateIntegrations")
    .doc("spotify")
    .get();

  if (!integration.exists) return null;

  const token = await requestSpotifyToken({
    grant_type: "refresh_token",
    refresh_token: integration.data().refreshToken
  });

  if (token.refresh_token) {
    await integration.ref.update({
      refreshToken: token.refresh_token,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  return token.access_token;
}

async function getPlaylistItems(accessToken) {
  let next = new URL(
    `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/items`
  );

  next.searchParams.set("limit", "50");

  next.searchParams.set(
    "fields",
    "items(added_at,track(id,name,artists(name),external_urls(spotify))),next"
  );

  const items = [];

  while (next) {
    const response = await fetch(next, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(
        `No se pudo leer la playlist (${response.status}).`
      );
    }

    const page = await response.json();

    items.push(
      ...(page.items || []).filter(
        (item) => item.track && item.track.id
      )
    );

    next = page.next ? new URL(page.next) : null;
  }

  return items;
}

exports.spotifyStart = onRequest(
  async (request, response) => {
    if (request.method !== "GET") {
      return response
        .status(405)
        .send("Método no permitido.");
    }

    const state = crypto
      .randomBytes(32)
      .toString("hex");

    await db
      .collection("spotifyAuthorizationStates")
      .doc(state)
      .set({
        createdAt: Timestamp.now()
      });

    const authorizationUrl = new URL(
      "https://accounts.spotify.com/authorize"
    );

    authorizationUrl.search =
      new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope:
          "playlist-read-private playlist-read-collaborative",
        state
      }).toString();

    return response.redirect(
      authorizationUrl.toString()
    );
  }
);

exports.spotifyComplete = onRequest(
  { secrets: [SPOTIFY_CLIENT_SECRET] },
  async (request, response) => {
    callbackCors(response);

    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    if (request.method !== "GET") {
      return response
        .status(405)
        .send("Método no permitido.");
    }

    const { code, state } = request.query;

    if (
      typeof code !== "string" ||
      typeof state !== "string"
    ) {
      return response
        .status(400)
        .send("Solicitud incompleta.");
    }

    const stateRef = db
      .collection("spotifyAuthorizationStates")
      .doc(state);

    const storedState = await stateRef.get();

    const createdAt = storedState.exists
      ? storedState.data().createdAt
      : null;

    const expired =
      !createdAt ||
      Timestamp.now().toMillis() -
        createdAt.toMillis() >
        10 * 60 * 1000;

    if (expired) {
      await stateRef.delete();

      return response
        .status(400)
        .send("La autorización expiró. Inténtalo de nuevo.");
    }

    try {
      const token = await requestSpotifyToken({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI
      });

      if (!token.refresh_token) {
        throw new Error(
          "Spotify no devolvió un token de renovación."
        );
      }

      await db
        .collection("privateIntegrations")
        .doc("spotify")
        .set({
          refreshToken: token.refresh_token,
          connectedAt:
            FieldValue.serverTimestamp(),
          updatedAt:
            FieldValue.serverTimestamp()
        });

      await stateRef.delete();

      return response.json({
        connected: true
      });
    } catch (error) {
      logger.error(
        "No se pudo terminar la conexión con Spotify.",
        error
      );

      return response
        .status(502)
        .send(
          "No se pudo completar la conexión con Spotify."
        );
    }
  }
);

exports.spotifyStatus = onRequest(
  async (request, response) => {
    response.set(
      "Access-Control-Allow-Origin",
      "*"
    );

    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    const integration = await db
      .collection("privateIntegrations")
      .doc("spotify")
      .get();

    return response.json({
      connected: integration.exists
    });
  }
);

exports.syncSpotifyPlaylist = onSchedule(
  {
    schedule: "every 10 minutes",
    timeZone: "America/Bogota",
    secrets: [SPOTIFY_CLIENT_SECRET]
  },
  async () => {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      logger.info(
        "Esperando la conexión inicial de Spotify."
      );
      return;
    }

    const items = await getPlaylistItems(accessToken);

    const stateRef = db
      .collection("spotifySyncState")
      .doc("playlist");

    const firstSync =
      !(await stateRef.get()).exists;

    for (const item of items) {
      const track = item.track;

      const eventId = crypto
        .createHash("sha256")
        .update(
          `${track.id}:${item.added_at || ""}`
        )
        .digest("hex");

      const knownRef = db
        .collection("spotifyKnownSongs")
        .doc(eventId);

      if ((await knownRef.get()).exists) {
        continue;
      }

      await knownRef.set({
        trackId: track.id,
        addedAt: item.added_at || null,
        discoveredAt:
          FieldValue.serverTimestamp()
      });

      if (!firstSync) {
        const artist = (track.artists || [])
          .map((entry) => entry.name)
          .join(", ");

        await db
          .collection("songs")
          .doc(eventId)
          .set({
            mensaje:
              `Nueva canción: ${track.name} — ${artist}`,
            titulo: track.name,
            artista: artist,
            urlSpotify: track.external_urls
              ? track.external_urls.spotify
              : "",
            timestamp:
              FieldValue.serverTimestamp()
          });
      }
    }

    await stateRef.set({
      lastSyncAt:
        FieldValue.serverTimestamp(),
      totalTracks: items.length
    });

    logger.info("Playlist revisada.", {
      totalTracks: items.length,
      firstSync
    });
  }
);