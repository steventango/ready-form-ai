import os
import platform
import subprocess
import mss
from PIL import Image

def get_png():
    # Linux Wayland support requires system tools (grim or gnome-screenshot)
    if platform.system() == "Linux" and os.environ.get("WAYLAND_DISPLAY"):
        cmds = [
            ["grim", "sc_tmp.png"],
            ["gnome-screenshot", "-f", "sc_tmp.png"]
        ]
        for cmd in cmds:
            try:
                subprocess.run(
                    cmd, check=True, stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                return Image.open("sc_tmp.png")
            except (OSError, subprocess.CalledProcessError):
                continue

    # Fallback / Windows / MacOS / X11
    with mss.mss() as sct:
        mon = sct.monitors[1] # Primary monitor
        img = sct.grab(mon)
        return Image.frombytes("RGB", img.size, img.bgra, "raw", "BGRX")
