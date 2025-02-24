import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.223.0/http/file_server.ts";
import { contentType } from "https://deno.land/std@0.223.0/media_types/mod.ts";

const dataDir = "./data";
const distDir = "./dist";
const port = Deno.env.get("PORT") || "8000";

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // API İsteklerini İşle
  if (url.pathname.startsWith("/data/")) {
    const filename = url.pathname.substring("/data/".length);

    if (request.method === "GET") {
      try {
        const data = await Deno.readFile(`${dataDir}/${filename}`);
        const decoded = new TextDecoder().decode(data);
        const type = contentType(filename);
        return new Response(decoded, {
          headers: {
            "content-type": type || "application/json",
          },
        });
      } catch (e) {
        console.error(e);
        return new Response("Not found", { status: 404 });
      }
    } else if (request.method === "PUT") {
      try {
        const body = await request.text();
        await Deno.writeFile(`${dataDir}/${filename}`, new TextEncoder().encode(body));
        return new Response("OK");
      } catch (e) {
        console.error(e);
        return new Response("Error writing file", { status: 500 });
      }
    } else {
      return new Response("Method not allowed", { status: 405 });
    }
  }

  // Statik Dosyaları Sun
  try {
    return await serveDir(request, {
      fsRoot: distDir,
      urlRoot: "/",
    });
  } catch (e) {
    console.error(e);
    return new Response("404 - Sayfa Bulunamadı", { status: 404 });
  }
}

console.log(`Sunucu ${port} portunda çalışıyor`);
serve(handleRequest, { port: parseInt(port) });
