export function updateMetaTags({
  title,
  description,
  image,
  url,
}: {
  title: string;
  description: string;
  image?: string | null;
  url: string;
}) {
  // Convert relative image URL to absolute URL if needed
  const absoluteImageUrl = image ? (
    image.startsWith('http') ? image : `${window.location.origin}${image.startsWith('/') ? image : `/${image}`}`
  ) : null;

  // Update primary meta tags
  document.title = title;
  document.querySelector('meta[name="title"]')?.setAttribute("content", title);
  document.querySelector('meta[name="description"]')?.setAttribute("content", description);

  // Update OpenGraph meta tags
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", url);
  document.querySelector('meta[property="og:type"]')?.setAttribute("content", "article");
  if (absoluteImageUrl) {
    document.querySelector('meta[property="og:image"]')?.setAttribute("content", absoluteImageUrl);
  }

  // Update Twitter Card meta tags
  document.querySelector('meta[name="twitter:card"]')?.setAttribute("content", "summary_large_image");
  document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description);
  document.querySelector('meta[name="twitter:url"]')?.setAttribute("content", url);
  if (absoluteImageUrl) {
    document.querySelector('meta[name="twitter:image"]')?.setAttribute("content", absoluteImageUrl);
  }
}