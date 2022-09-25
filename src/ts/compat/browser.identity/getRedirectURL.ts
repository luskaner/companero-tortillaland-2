export default function getRedirectURL(): string {
  // Used by Chrome Extension, Google ensures it is unresolvable so no information leak
  return 'https://gkenadplonllfndfpcdfblfjhdeifjbm.chromiumapp.org/'
}
