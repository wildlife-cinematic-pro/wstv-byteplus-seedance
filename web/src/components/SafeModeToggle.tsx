import { useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Button } from "./ui/primitives";
import { Modal } from "./ui/Modal";
import { ShieldIcon } from "./ui/Icon";

export function SafeModeToggle() {
  const { safeMode, setSafeMode } = useDashboard();
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    // Re-enabling Safe Mode is the safe direction — no confirmation needed.
    // Turning it OFF exposes paid generation, so confirm first.
    if (safeMode) setConfirming(true);
    else setSafeMode(true);
  };

  const disableSafeMode = () => {
    setSafeMode(false);
    setConfirming(false);
  };

  return (
    <>
      <button
        type="button"
        className="safe-toggle"
        role="switch"
        aria-checked={safeMode}
        data-safe={safeMode}
        onClick={handleClick}
        title={
          safeMode
            ? "Safe Mode ON — paid generation disabled"
            : "Safe Mode OFF — paid generation enabled"
        }
      >
        <span className="st-track">
          <span className="st-knob">
            <ShieldIcon size={10} />
          </span>
        </span>
        <span className="st-label">
          {safeMode ? (
            "Safe"
          ) : (
            <>
              <span className="st-blink" aria-hidden />
              Unsafe
            </>
          )}
        </span>
      </button>

      <Modal open={confirming} onClose={() => setConfirming(false)} labelledBy="safe-modal-title">
        <div className="modal-icon danger">
          <ShieldIcon size={22} />
        </div>
        <h3 id="safe-modal-title">Turn off Safe Mode?</h3>
        <p>
          This reveals the paid zone and allows submitting real BytePlus tasks that{" "}
          <b>spend credits</b>. You will still need a successful dry run and the exact confirmation
          token before any paid submit.
        </p>
        <div className="modal-actions">
          <Button onClick={() => setConfirming(false)}>Keep Safe Mode</Button>
          <Button variant="danger" onClick={disableSafeMode}>
            Turn off
          </Button>
        </div>
      </Modal>
    </>
  );
}
