
import "./globals.css";

export const metadata = {
  title: "AI Dino Runner | Science Fair",
  description:
    "Control a dinosaur game using artificial intelligence and body movements.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
