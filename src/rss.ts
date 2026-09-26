import { XMLParser } from "fast-xml-parser";

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.statusText}`);
  }

  const xmlText = await response.text();

  const parser = new XMLParser({
    processEntities: false,
  });

  const parsed = parser.parse(xmlText);

  if (!parsed.rss || !parsed.rss.channel) {
    throw new Error("Invalid RSS feed format: missing channel field");
  }

  const channel = parsed.rss.channel;

  const title = channel.title;
  const link = channel.link;
  const description = channel.description;

  if (!title || !link || !description) {
    throw new Error("Invalid RSS feed metadata");
  }

  let rawItems: any[] = [];
  if (channel.item) {
    if (Array.isArray(channel.item)) {
      rawItems = channel.item;
    } else if (typeof channel.item === "object") {
      rawItems = [channel.item];
    }
  }

  const items: RSSItem[] = [];

  for (const item of rawItems) {
    if (item.title && item.link && item.description && item.pubDate) {
      items.push({
        title: String(item.title),
        link: String(item.link),
        description: String(item.description),
        pubDate: String(item.pubDate),
      });
    }
  }

  return {
    channel: {
      title: String(title),
      link: String(link),
      description: String(description),
      item: items,
    },
  };
}
