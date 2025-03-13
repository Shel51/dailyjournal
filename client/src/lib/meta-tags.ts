export function updateMetaTags({
  title,
  description,
  image,
  url,
}: {
  title: string;
  description: string;
  image?: string;
  url: string;
}) {
  // Update primary meta tags
  document.title = title;
  document.querySelector('meta[name="title"]')?.setAttribute("content", title);
  document.querySelector('meta[name="description"]')?.setAttribute("content", description);

  // Update OpenGraph meta tags
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", url);
  if (image) {
    document.querySelector('meta[property="og:image"]')?.setAttribute("content", image);
  }

  // Update Twitter Card meta tags
  document.querySelector('meta[property="twitter:title"]')?.setAttribute("content", title);
  document.querySelector('meta[property="twitter:description"]')?.setAttribute("content", description);
  document.querySelector('meta[property="twitter:url"]')?.setAttribute("content", url);
  if (image) {
    document.querySelector('meta[property="twitter:image"]')?.setAttribute("content", image);
  }
}
