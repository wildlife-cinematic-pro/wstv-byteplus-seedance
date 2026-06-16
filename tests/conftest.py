import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

os.environ["PYTHON_DOTENV_DISABLED"] = "1"
os.environ.pop("ARK_API_KEY", None)
os.environ.pop("BYTEPLUS_API_KEY", None)
