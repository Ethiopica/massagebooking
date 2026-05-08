import "./globals.css";

export const metadata = {
  title: "Massage Booking System",
  description: "Book massage appointments from Monday to Saturday.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
