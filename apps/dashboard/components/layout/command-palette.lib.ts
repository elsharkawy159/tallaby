/**
 * Opens the header's command palette from anywhere in the dashboard (the
 * mobile bottom nav's Search). DashboardHeader owns the palette's state and
 * listens for this event, so there is still one palette.
 */
export const OPEN_COMMAND_PALETTE_EVENT = "tallaby:open-command-palette";

export function openCommandPalette(): void {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
}
