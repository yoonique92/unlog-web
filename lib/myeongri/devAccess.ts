export function isMyeongriDevRouteEnabled(environment = process.env.NODE_ENV) {
  return environment !== "production";
}
