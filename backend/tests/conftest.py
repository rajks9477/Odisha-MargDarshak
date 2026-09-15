import os
import sys
import pytest_asyncio
import pytest

# Ensure backend directory is in python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.init_db import init_database

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_test_db():
    await init_database()

