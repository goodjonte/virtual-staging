export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/staging/:path*", "/history/:path*", "/account/:path*"],
};
